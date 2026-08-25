import React, { createContext, useContext, useState, useEffect } from "react";
import { FirebaseService } from '@/services';
import { UserProfile, UserRole, UserStatus } from '@/types/user';
import { AppAlert } from '@/context/AlertContext';

type AuthContextType = {
  user: UserProfile | null;
  isAdmin: boolean;
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

        // 1. Check account status
        if (data?.status === 'disabled') {
          await FirebaseService.logout();
          setUser(null);
          AppAlert.show(
            'Account Disabled',
            'Your account has been deactivated by the administrator. Please contact support.',
            undefined,
            'error'
          );
          return;
        }

        // 2. Strict Role Enforcement (Only 'admin' or 'user')
        const verifiedRole: UserRole = data?.role === 'admin' ? 'admin' : 'user';
        const verifiedStatus: UserStatus = 'active';

        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: data?.name || data?.displayName || firebaseUser.displayName || 'User',
          displayName: data?.displayName || data?.name || firebaseUser.displayName || 'User',
          mobile: data?.mobile || '',
          role: verifiedRole,
          status: verifiedStatus,
          wallet: data?.wallet !== undefined ? Number(data.wallet) : 250.0,
          createdAt: data?.createdAt,
          updatedAt: data?.updatedAt,
          lastLoginAt: data?.lastLoginAt,
        };

        setUser(profile);

        // Record last login timestamp non-blockingly
        FirebaseService.recordLastLogin(firebaseUser.uid).catch(() => {});
      } else {
        // Document doesn't exist yet — initialize with role: 'user'
        const initialName = firebaseUser.displayName || 'User';
        const initialRole: UserRole = 'user';
        const initialStatus: UserStatus = 'active';

        try {
          await FirebaseService.initializeUserProfile(firebaseUser.uid, {
            name: initialName,
            displayName: initialName,
            email: firebaseUser.email || '',
            mobile: '',
            role: initialRole,
            status: initialStatus,
            wallet: 250.0,
          });
        } catch (writeErr) {
          console.warn('AuthContext: could not create user profile doc:', writeErr);
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: initialName,
          displayName: initialName,
          mobile: '',
          wallet: 250.0,
          role: initialRole,
          status: initialStatus,
        });
      }
    } catch (err) {
      console.warn('AuthContext: failed to load profile, keeping last known state:', err);
      setUser((prev) => {
        if (prev) return prev;
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'User',
          displayName: firebaseUser.displayName || 'User',
          mobile: '',
          role: 'user',
          status: 'active',
          wallet: 0,
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
    await FirebaseService.updateUserProfile(user.uid, { name, displayName: name, mobile });
    setUser(prev => prev ? { ...prev, name, displayName: name, mobile } : null);
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

  const isAdmin = user?.role === 'admin' && user?.status === 'active';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        updateUserProfile,
        addWalletBalance,
        getWalletTransactions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

