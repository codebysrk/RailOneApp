import React, { createContext, useContext, useState, useEffect } from "react";
import { FirebaseService } from '@/services';

export type UserProfile = {
  uid: string;
  email: string;
  name: string;
  mobile: string;
  wallet: number;
};

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, mobile: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserProfile: (name: string, mobile: string) => Promise<void>;
  addWalletBalance: (amount: number, description?: string) => Promise<number>;
  getWalletTransactions: () => Promise<any[]>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = FirebaseService.onAuthStateChanged(async (firebaseUser: any) => {
      if (firebaseUser) {
        await loadProfile(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const loadProfile = async (firebaseUser: any) => {
    try {
      const docSnap = await FirebaseService.getUserProfile(firebaseUser.uid);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: data?.name || firebaseUser.displayName || "User",
          mobile: data?.mobile || "",
          // FIX C6: only fall back to 250 if wallet field is genuinely absent
          wallet: data?.wallet !== undefined ? data.wallet : 250.0,
        });
      } else {
        // Document doesn't exist yet — create it (e.g. pre-Firestore users)
        const initialName = firebaseUser.displayName || "User";
        try {
          await FirebaseService.updateUserProfile(firebaseUser.uid, {
            name: initialName,
            mobile: "",
            wallet: 250.0,
          });
        } catch (writeErr) {
          console.warn('AuthContext: could not create user profile doc:', writeErr);
        }
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: initialName,
          mobile: "",
          wallet: 250.0,
        });
      }
    } catch (err) {
      // FIX C6: on network/Firestore error, preserve the last known user state
      // if we already have a user, keep them — don't overwrite wallet with 250
      console.warn('AuthContext: failed to load profile, keeping last known state:', err);
      setUser((prev) => {
        if (prev) return prev; // Preserve existing state on error
        // Only set fallback if we have no previous state (first login attempt)
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || "User",
          mobile: "",
          wallet: 0, // Don't gift ₹250 on error — start at 0 until sync
        };
      });
    }
  };

  const login = async (email: string, password: string) => {
    await FirebaseService.login(email, password);
  };

  const register = async (name: string, mobile: string, email: string, password: string) => {
    await FirebaseService.register(name, mobile, email, password);
  };

  const logout = async () => {
    await FirebaseService.logout();
    setUser(null);
  };

  const refreshProfile = async () => {
    const firebaseUser = FirebaseService.getCurrentUser();
    if (firebaseUser) await loadProfile(firebaseUser);
  };

  const updateUserProfile = async (name: string, mobile: string) => {
    if (!user?.uid) return;
    await FirebaseService.updateUserProfile(user.uid, { name, mobile });
    setUser(prev => prev ? { ...prev, name, mobile } : null);
  };

  const addWalletBalance = async (amount: number, description: string = 'Added via UPI') => {
    if (!user?.uid) throw new Error('User not logged in');
    const newBal = await FirebaseService.addWalletFunds(user.uid, amount, description);
    setUser(prev => prev ? { ...prev, wallet: newBal } : null);
    return newBal;
  };

  const getWalletTransactions = async () => {
    if (!user?.uid) return [];
    return FirebaseService.getWalletTransactions(user.uid);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile, updateUserProfile, addWalletBalance, getWalletTransactions }}>
      {children}
    </AuthContext.Provider>
  );
};
