import "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      _id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      provider: string;
      avatar: string;
      isEmailVerified: boolean;
      image?: string | null;
    };
    accessToken?: string;
    error?: string;
    expires: string;
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    id: string;
    _id: string;
    name: string;
    email: string;
    role: string;
    provider: string;
    avatar: string;
    isEmailVerified: boolean;
    emailVerified?: Date | null;
    accessToken: string;
    tokenIssuedAt: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    _id: string;
    name: string;
    email: string;
    role: string;
    provider: string;
    avatar: string;
    isEmailVerified: boolean;
    accessToken: string | null;
    tokenIssuedAt: number;
    error?: string;
  }
}
