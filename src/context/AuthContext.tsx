import React, { createContext, useContext, useState, useEffect } from "react";
import { FirebaseService } from "../services";

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
          wallet: data?.wallet !== undefined ? data.wallet : 250.0,
        });
      } else {
        // Document didn't exist in Firestore yet (e.g. created before Firestore was enabled)
        const initialName = firebaseUser.displayName || "User";
        await FirebaseService.updateUserProfile(firebaseUser.uid, {
          name: initialName,
          mobile: "",
          wallet: 250.0,
        });
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: initialName,
          mobile: "",
          wallet: 250.0,
        });
      }
    } catch {
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || "User",
        mobile: "",
        wallet: 250.0,
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
