export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  mobile: string;
  wallet: number;
  role?: 'admin' | 'user' | string;
  createdAt?: any;
  updatedAt?: any;
}
