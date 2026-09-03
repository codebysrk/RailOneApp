export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'disabled';

export interface UserProfile {
  uid: string;
  name: string;
  displayName?: string;
  email: string;
  mobile: string;
  role: UserRole;
  status: UserStatus;
  wallet: number;
  photoURL?: string;
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any;
}

