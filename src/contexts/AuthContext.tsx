import { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  reauthenticateWithCredential,
  revokeAccessToken,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { auth } from '../services/firebase'
import { consumeUtmParams } from '../utils/helpers'
import { consumeAcquisitionContext } from '../utils/acquisitionContext'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithApple: () => Promise<void>
  logout: () => Promise<void>
  deleteAccount: (cleanupCallback?: () => Promise<void>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const saveNewUserToDatabase = async (user: User) => {
    try {
      // Dynamisk import: Firestore-SDK:t (tungt, ~250 KB) ska bara laddas för
      // besökare som faktiskt är inloggade, inte för alla som landar på
      // startsidan (AuthProvider wrap:ar hela appen).
      const { doc, setDoc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../services/firestore');
      const userRef = doc(db, 'artifacts', 'default-app-id', 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // 1. HELT NY ANVÄNDARE (eller föräldralös)
        // consumeUtmParams() töms samtidigt (engångsläsning) — täcker både
        // e-post- och Google-signup, eftersom båda går via den här funktionen.
        // Källan kan vara UTM-parametrar, avsändare/landningssida, eller båda.
        const utm = consumeUtmParams();
        const context = consumeAcquisitionContext();
        const acquisition = utm || context ? { ...(utm ?? {}), ...(context ?? {}) } : null;
        // Ingen `email` här: adressen bor i Firebase Auth, och ett fält som
        // bara skrivs vid signup blir tyst fel den dag användaren byter
        // adress. Alla utskick slår upp den i Auth i stället (getUserEmail i
        // functions/index.js).
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || '',
          language: localStorage.getItem('iceiq-language') || 'en',
          createdAt: new Date().toISOString(),
          subscriptionPlan: 'free',
          subscriptionStatus: 'inactive',
          aiCredits: 3,
          hasReceivedWelcomeCredits: true, // <-- Ny flagga så vi vet att de fått sin gåva
          role: 'manager',
          ...(acquisition && { acquisition })
        });
        console.log("Ny användare! Databasdokument skapat med 3 krediter.");
      }
      // 2. EXISTERANDE ANVÄNDARE: inget att göra här längre. aiCredits
      // (liksom subscriptionPlan/Status m.fl.) är sedan firestore.rules
      // server-only — klienten får inte längre skriva dem. Ett gammalt
      // konto utan aiCredits självläker i stället i askCoach, första
      // gången det kontot faktiskt frågar coachen (se functions/index.js).
    } catch (error) {
      console.error("Kunde inte spara/uppdatera användare i databasen:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Ett helt nytt konto måste ha sitt dokument innan appen visas. För
        // alla andra räcker det att kontrollen körs i bakgrunden: att vänta
        // på den (en Firestore-rundtur plus SDK-nedladdning) var det som
        // gjorde att appen tog lång tid att öppna efter inloggning.
        const created = Date.parse(currentUser.metadata.creationTime || '');
        const isBrandNew = !isNaN(created) && Date.now() - created < 2 * 60 * 1000;
        if (isBrandNew) {
          await saveNewUserToDatabase(currentUser);
        } else {
          saveNewUserToDatabase(currentUser);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

 

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const signup = async (email: string, password: string) => {
    try {
      // 1. Skapa kontot
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // 2. Spara användaren i databasen
      await saveNewUserToDatabase(userCredential.user);

    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }

  const loginWithGoogle = async () => {
    try {
      let result
      if (Capacitor.isNativePlatform()) {
        // Popup fungerar inte i iOS-skalet. Det native pluginet loggar in mot
        // Google och ger tillbaka en token som vi byter mot en Firebase-session
        // (skapas i JS-SDK:t, se skipNativeAuth i capacitor.config.ts).
        const native = await FirebaseAuthentication.signInWithGoogle()
        const credential = GoogleAuthProvider.credential(
          native.credential?.idToken,
          native.credential?.accessToken
        )
        result = await signInWithCredential(auth, credential)
      } else {
        result = await signInWithPopup(auth, new GoogleAuthProvider())
      }

      // Spara användaren i databasen (ifall det är första gången)
      await saveNewUserToDatabase(result.user);

    } catch (error) {
      console.error('Google login error:', error)
      throw error
    }
  }

  // Apple kräver "Sign in with Apple" i appar som erbjuder Google-inloggning.
  // Bara native: på webben är den inte konfigurerad i Firebase.
  const loginWithApple = async () => {
    try {
      const native = await FirebaseAuthentication.signInWithApple()
      const credential = new OAuthProvider('apple.com').credential({
        idToken: native.credential?.idToken,
        rawNonce: native.credential?.nonce
      })
      const result = await signInWithCredential(auth, credential)

      // Apple ger namnet bara första gången, och bara till appen.
      if (!result.user.displayName && native.user?.displayName) {
        const { updateProfile } = await import('firebase/auth')
        await updateProfile(result.user, { displayName: native.user.displayName })
      }
      await saveNewUserToDatabase(result.user);

    } catch (error) {
      console.error('Apple login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut().catch(() => {})
        // Telefonen ska inte behålla den utloggades data: rensa den lokala
        // cachen och starta om, så Firestore startar rent nästa gång.
        const { clearLocalData } = await import('../services/firestore')
        await clearLocalData()
        window.location.reload()
      }
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const deleteAccount = async (cleanupCallback?: () => Promise<void>) => {
    try {
      const current = auth.currentUser;
      if (current) {
        // 0. Apple-konton: logga in med Apple på nytt FÖRE raderingen. Det
        //    bekräftar att det är rätt person och ger en engångskod som Apple
        //    kräver för att dra tillbaka kopplingen till appen när kontot
        //    raderas. Görs först så att inget hunnit raderas om användaren
        //    avbryter Apples dialog.
        let appleAuthCode: string | undefined
        if (Capacitor.isNativePlatform() && current.providerData.some((p) => p.providerId === 'apple.com')) {
          const native = await FirebaseAuthentication.signInWithApple()
          appleAuthCode = native.credential?.authorizationCode
          const credential = new OAuthProvider('apple.com').credential({
            idToken: native.credential?.idToken,
            rawNonce: native.credential?.nonce
          })
          await reauthenticateWithCredential(current, credential)
        }

        // 1. Om vi skickade med en städfunktion, kör den FÖRST
        if (cleanupCallback) {
          await cleanupCallback();
        }

        // 2. Dra tillbaka Apple-token (bästa försök: ett fel här ska inte hindra raderingen)
        if (appleAuthCode) {
          try {
            await revokeAccessToken(auth, appleAuthCode)
          } catch (revokeError) {
            console.warn('Kunde inte dra tillbaka Apple-token:', revokeError)
          }
        }

        // 3. När städningen är klar, radera användaren i Auth
        await deleteUser(current)

        // 4. Appen: rensa också det som ligger sparat på telefonen
        if (Capacitor.isNativePlatform()) {
          const { clearLocalData } = await import('../services/firestore')
          await clearLocalData()
          window.location.reload()
        }
      }
    } catch (error: any) {
      console.error('Delete account error:', error);
      
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('RECENT_LOGIN_REQUIRED');
      }
      throw error;
    }
  }

  const value = {
    user,
    loading,
    login,
    signup,
    loginWithGoogle,
    loginWithApple,
    logout,
    deleteAccount
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}