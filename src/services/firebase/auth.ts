import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/services/firebase/config';

export const FirebaseAuthService = {
  login: async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  },

  register: async (name: string, mobile: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    if (user?.uid) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          name,
          mobile,
          wallet: 250.0, // Welcome bonus balance
          createdAt: serverTimestamp(),
        });
        // Add welcome bonus transaction to wallet ledger
        const txnId = 'TXN_' + Date.now();
        await setDoc(doc(db, 'users', user.uid, 'wallet_ledger', txnId), {
          id: txnId,
          type: 'credit',
          amount: 250.0,
          description: 'Welcome Bonus',
          balanceAfter: 250.0,
          timestamp: serverTimestamp(),
          status: 'success',
        });
      } catch (err) {
        console.warn('Could not save user profile to Firestore:', err);
      }
    }
    return user;
  },

  logout: async () => {
    return signOut(auth);
  },

  getCurrentUser: (): User | null => {
    return auth?.currentUser || null;
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },
};

