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
          email,
          role: 'user',
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

  createManagedUser: async (
    name: string,
    mobile: string,
    email: string,
    password: string,
    initialWallet: number = 250.0,
    role: string = 'user'
  ) => {
    // Use Firebase Auth REST API to create user without logging out the currently logged in Admin
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyB5dQBQdBUSvxtpQNQ3dHhMaTbTUktTZLU`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          returnSecureToken: true,
        }),
      }
    );

    const json = await res.json();
    if (!res.ok || json.error) {
      const errCode = json?.error?.message || 'Failed to create user';
      if (errCode.includes('EMAIL_EXISTS')) {
        throw new Error('This email address is already registered.');
      } else if (errCode.includes('INVALID_EMAIL')) {
        throw new Error('Invalid email address format.');
      } else if (errCode.includes('WEAK_PASSWORD')) {
        throw new Error('Password must be at least 6 characters.');
      }
      throw new Error(errCode);
    }

    const uid = json.localId;
    if (uid) {
      await setDoc(doc(db, 'users', uid), {
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        role: role,
        wallet: initialWallet,
        createdAt: serverTimestamp(),
      });

      if (initialWallet > 0) {
        const txnId = 'TXN_' + Date.now();
        await setDoc(doc(db, 'users', uid, 'wallet_ledger', txnId), {
          id: txnId,
          type: 'credit',
          amount: initialWallet,
          description: 'Initial Account Credit',
          balanceAfter: initialWallet,
          timestamp: serverTimestamp(),
          status: 'success',
        });
      }
    }

    return { uid, email: email.trim(), name: name.trim(), password };
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

