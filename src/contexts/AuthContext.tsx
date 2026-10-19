import { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  revokeAccessToken,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { auth } from '../services/firebase'
import { consumeUtmParams } from '../utils/helpers'
import { consumeAcquisitionContext } from '../utils/acquisitionContext'
import { clearUserLocalData, forgetLastUser, switchLocalUser } from '../utils/localData'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithApple: () => Promise<void>
  logout: () => Promise<void>
  sendPasswordReset: (email: string, language?: string) => Promise<void>
  deleteAccount: (password?: string) => Promise<void>
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
        // Byter någon konto på den här enheten ska det förra kontots lokala
        // data (senast använda lag, utkast, Swish-nummer) inte följa med.
        switchLocalUser(currentUser.uid)
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

  // Skickar Firebases återställningsmejl. Mejlet skrivs på appens språk. Svaret
  // avslöjar inte om adressen har ett konto (Firebase svarar lika oavsett).
  const sendPasswordReset = async (email: string, language?: string) => {
    try {
      auth.languageCode = language === 'sv' ? 'sv' : 'en'
      await sendPasswordResetEmail(auth, email.trim())
    } catch (error) {
      console.error('Password reset error:', error)
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

  // Raderar kontot helt. Användaren bekräftar först sin identitet (lösenord,
  // Google eller Apple) så att inloggningen är färsk, sedan tar servern bort
  // allt: spelare, matcher, coachchattar, spelarlänkar, betalkund och själva
  // inloggningen (deleteMyAccount i functions/index.js). Inget raderas här i
  // klienten, så ett avbrott kan inte lämna kvar ett konto utan data.
  const deleteAccount = async (password?: string) => {
    const current = auth.currentUser
    if (!current) return

    const providers = current.providerData.map((p) => p.providerId)
    const native = Capacitor.isNativePlatform()

    // 0. Logga in på nytt FÖRE raderingen. Avbryter användaren dialogen har inget raderats.
    let appleAuthCode: string | undefined
    if (native && providers.includes('apple.com')) {
      // Apple ger också en engångskod som krävs för att dra tillbaka kopplingen till appen.
      const nativeResult = await FirebaseAuthentication.signInWithApple()
      appleAuthCode = nativeResult.credential?.authorizationCode
      const credential = new OAuthProvider('apple.com').credential({
        idToken: nativeResult.credential?.idToken,
        rawNonce: nativeResult.credential?.nonce
      })
      await reauthenticateWithCredential(current, credential)
    } else if (providers.includes('password')) {
      if (!password) throw new Error('PASSWORD_REQUIRED')
      try {
        await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email || '', password))
      } catch (error: any) {
        if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
          throw new Error('WRONG_PASSWORD')
        }
        throw error
      }
    } else if (providers.includes('google.com')) {
      if (native) {
        const nativeResult = await FirebaseAuthentication.signInWithGoogle()
        const credential = GoogleAuthProvider.credential(
          nativeResult.credential?.idToken,
          nativeResult.credential?.accessToken
        )
        await reauthenticateWithCredential(current, credential)
      } else {
        await reauthenticateWithPopup(current, new GoogleAuthProvider())
      }
    }
    await current.getIdToken(true) // uppdaterar auth_time som servern kontrollerar

    // 1. Dra tillbaka Apple-token (bästa försök: ett fel här ska inte hindra raderingen)
    if (appleAuthCode) {
      try {
        await revokeAccessToken(auth, appleAuthCode)
      } catch (revokeError) {
        console.warn('Kunde inte dra tillbaka Apple-token:', revokeError)
      }
    }

    // 2. Servern raderar allt, inloggningen sist.
    try {
      const { euFunctions } = await import('../services/firestore')
      const { httpsCallable } = await import('firebase/functions')
      await httpsCallable(euFunctions, 'deleteMyAccount')({})
    } catch (error: any) {
      console.error('Delete account error:', error)
      if (String(error?.message || '').includes('RECENT_LOGIN_REQUIRED')) {
        throw new Error('RECENT_LOGIN_REQUIRED')
      }
      throw error
    }

    // 3. Lämna sessionen och rensa det som ligger sparat på enheten.
    await signOut(auth).catch(() => {})
    clearUserLocalData()
    forgetLastUser()
    if (native) {
      await FirebaseAuthentication.signOut().catch(() => {})
      const { clearLocalData } = await import('../services/firestore')
      await clearLocalData()
      window.location.reload()
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
    sendPasswordReset,
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