import { FirebaseAuthService } from './auth';
import { FirebaseFirestoreService } from './firestore';
import { DatabaseSeedService } from './seed';

export * from './config';
export * from './auth';
export * from './firestore';
export * from './seed';

// Attempt master seed in background
DatabaseSeedService.seedMastersIfEmpty();

// Unified backward-compatible and forward-compatible service facade
export const FirebaseService = {
  ...FirebaseAuthService,
  ...FirebaseFirestoreService,
  seedMastersIfEmpty: DatabaseSeedService.seedMastersIfEmpty,
};

