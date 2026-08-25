import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { FirebaseService, NotificationService } from '@/services';
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
  requestWalletRecharge: (amount: number, note?: string) => Promise<any>;
  getWalletTransactions: () => Promise<any[]>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const lastWalletRef = useRef<number | null>(null);
  const lastAdminPendingCountRef = useRef<number | null>(null);
  const currentFirebaseUserRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    NotificationService.requestPermissions().catch(() => {});

    // Watchdog timer: Guarantee splash screen dismissal even on slow network
    const watchdog = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 2200);

    let profileUnsub: (() => void) | null = null;
    let adminReqUnsub: (() => void) | null = null;

    const startListeners = (firebaseUser: any) => {
      if (profileUnsub) { profileUnsub(); profileUnsub = null; }
      if (adminReqUnsub) { adminReqUnsub(); adminReqUnsub = null; }

      // Real-time listener for user profile / wallet balance updates
      profileUnsub = FirebaseService.listenToUserProfile(firebaseUser.uid, (data) => {
        if (!isMounted || !data) return;
        const newWallet = data.wallet !== undefined ? Number(data.wallet) : 250.0;

        // Trigger notification if wallet balance was credited by Admin
        if (lastWalletRef.current !== null && newWallet > lastWalletRef.current) {
          const diff = newWallet - lastWalletRef.current;
          NotificationService.sendLocalNotification(
            'Wallet Recharge Approved! 🎉',
            `₹${diff.toFixed(2)} has been credited to your R-Wallet balance.`
          );
        }
        lastWalletRef.current = newWallet;

        setUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            wallet: newWallet,
            name: data.name || prev.name,
            mobile: data.mobile || prev.mobile,
            status: data.status || prev.status,
          };
        });
      });

      // If Admin, also listen to incoming pending recharge requests
      if (firebaseUser.email?.toLowerCase().includes('admin')) {
        adminReqUnsub = FirebaseService.listenToPendingRechargeRequests((requests) => {
          if (!isMounted) return;
          if (lastAdminPendingCountRef.current !== null && requests.length > lastAdminPendingCountRef.current) {
            const latest = requests[0];
            if (latest) {
              NotificationService.sendLocalNotification(
                'New Recharge Request 💰',
                `${latest.userName || 'Passenger'} requested ₹${latest.amount.toFixed(2)} wallet approval.`
              );
            }
          }
          lastAdminPendingCountRef.current = requests.length;
        });
      }
    };

    const stopListeners = () => {
      if (profileUnsub) { profileUnsub(); profileUnsub = null; }
      if (adminReqUnsub) { adminReqUnsub(); adminReqUnsub = null; }
    };

    const unsubscribe = FirebaseService.onAuthStateChanged(async (firebaseUser: any) => {
      try {
        currentFirebaseUserRef.current = firebaseUser;
        stopListeners();

        if (firebaseUser) {
          await loadProfile(firebaseUser);
          startListeners(firebaseUser);
        } else {
          lastWalletRef.current = null;
          lastAdminPendingCountRef.current = null;
          if (isMounted) setUser(null);
        }
      } catch (err) {
        console.warn('AuthContext onAuthStateChanged error:', err);
      } finally {
        if (isMounted) {
          clearTimeout(watchdog);
          setLoading(false);
        }
      }
    });

    // Background AppState Throttling: Pause listeners in background to save battery
    const appStateSub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        if (currentFirebaseUserRef.current) {
          startListeners(currentFirebaseUserRef.current);
          loadProfile(currentFirebaseUserRef.current).catch(() => {});
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        stopListeners();
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(watchdog);
      appStateSub.remove();
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      stopListeners();
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

  const login = React.useCallback(async (email: string, password: string) => {
    await FirebaseService.login(email, password);
  }, []);

  const register = React.useCallback(
    async (name: string, mobile: string, email: string, password: string) => {
      await FirebaseService.register(name, mobile, email, password);
    },
    []
  );

  const logout = React.useCallback(async () => {
    await FirebaseService.logout();
    setUser(null);
  }, []);

  const refreshProfile = React.useCallback(async () => {
    const firebaseUser = FirebaseService.getCurrentUser();
    if (firebaseUser) await loadProfile(firebaseUser);
  }, []);

  const updateUserProfile = React.useCallback(async (name: string, mobile: string) => {
    if (!user?.uid) return;
    await FirebaseService.updateUserProfile(user.uid, { name, displayName: name, mobile });
    setUser(prev => prev ? { ...prev, name, displayName: name, mobile } : null);
  }, [user?.uid]);

  const addWalletBalance = React.useCallback(
    async (amount: number, description: string = 'Added via UPI') => {
      if (!user?.uid) throw new Error('User not logged in');
      if (user.role !== 'admin') {
        throw new Error('Wallet top-up requires Administrator authorization.');
      }
      const newBal = await FirebaseService.addWalletFunds(user.uid, amount, description);
      setUser(prev => prev ? { ...prev, wallet: newBal } : null);
      return newBal;
    },
    [user?.uid, user?.role]
  );

  const requestWalletRecharge = React.useCallback(
    async (amount: number, note: string = 'User App Request') => {
      if (!user?.uid) throw new Error('User not logged in');
      const result = await FirebaseService.createWalletRechargeRequest(
        user.uid,
        amount,
        {
          name: user.name || user.displayName || 'User',
          email: user.email || '',
          mobile: user.mobile || '',
        },
        note
      );
      return result;
    },
    [user?.uid, user?.name, user?.displayName, user?.email, user?.mobile]
  );

  const getWalletTransactions = React.useCallback(async () => {
    if (!user?.uid) return [];
    return FirebaseService.getWalletTransactions(user.uid);
  }, [user?.uid]);

  const isAdmin = user?.role === 'admin' && user?.status === 'active';

  const contextValue = React.useMemo(
    () => ({
      user,
      isAdmin,
      loading,
      login,
      register,
      logout,
      refreshProfile,
      updateUserProfile,
      addWalletBalance,
      requestWalletRecharge,
      getWalletTransactions,
    }),
    [
      user,
      isAdmin,
      loading,
      login,
      register,
      logout,
      refreshProfile,
      updateUserProfile,
      addWalletBalance,
      requestWalletRecharge,
      getWalletTransactions,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

