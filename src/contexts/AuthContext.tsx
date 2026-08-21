import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore' // LÄGG TILL DESSA
import { auth, db } from '../services/firebase' // SE TILL ATT db ÄR IMPORTERAD HÄR
import { consumeUtmParams } from '../utils/helpers'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  deleteAccount: (cleanupCallback?: () => Promise<void>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const saveNewUserToDatabase = async (user: User) => {
    try {
      const userRef = doc(db, 'artifacts', 'default-app-id', 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // 1. HELT NY ANVÄNDARE (eller föräldralös)
        // consumeUtmParams() töms samtidigt (engångsläsning) — täcker både
        // e-post- och Google-signup, eftersom båda går via den här funktionen.
        const acquisition = consumeUtmParams();
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
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
        // Om någon loggar in (eller redan är inloggad), kolla/skapa databasen direkt!
        await saveNewUserToDatabase(currentUser);
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
      const provider = new GoogleAuthProvider()
      // 1. Logga in med Google
      const result = await signInWithPopup(auth, provider)
      
      // 2. Spara användaren i databasen (ifall det är första gången)
      await saveNewUserToDatabase(result.user);

    } catch (error) {
      console.error('Google login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const deleteAccount = async (cleanupCallback?: () => Promise<void>) => {
    try {
      if (auth.currentUser) {
        
        // 1. Om vi skickade med en städfunktion, kör den FÖRST
        if (cleanupCallback) {
          await cleanupCallback();
        }

        // 2. När städningen är klar, radera användaren i Auth
        await deleteUser(auth.currentUser);
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