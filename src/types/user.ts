export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  mobile: string;
  wallet: number;
  role?: 'admin' | 'user' | string;
  status?: 'active' | 'blocked';
  createdAt?: any;
  updatedAt?: any;
}
