import { FirebaseAuthService } from '@/services/firebase/auth';
import { FirebaseFirestoreService } from '@/services/firebase/firestore';
import { DatabaseSeedService } from '@/services/firebase/seed';

export * from '@/services/firebase/config';
export * from '@/services/firebase/auth';
export * from '@/services/firebase/firestore';
export * from '@/services/firebase/seed';

// Attempt master seed in background
DatabaseSeedService.seedMastersIfEmpty();

// Unified backward-compatible and forward-compatible service facade
export const FirebaseService = {
  ...FirebaseAuthService,
  ...FirebaseFirestoreService,
  seedMastersIfEmpty: DatabaseSeedService.seedMastersIfEmpty,
};

