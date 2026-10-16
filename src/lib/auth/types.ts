export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Session {
  token: string;
  user: User;
  /** Epoch milliseconds. */
  expiresAt: number;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface DemoAccount extends User {
  password: string;
}
