import { FirebaseAuthService } from '@/services/firebase/auth';
import { FirebaseFirestoreService } from '@/services/firebase/firestore';

export * from '@/services/firebase/config';
export * from '@/services/firebase/auth';
export * from '@/services/firebase/firestore';
export * from '@/services/firebase/seed';

// Unified backward-compatible and forward-compatible service facade
export const FirebaseService = {
  ...FirebaseAuthService,
  ...FirebaseFirestoreService,
};

