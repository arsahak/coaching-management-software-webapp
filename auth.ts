import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// 30 days in seconds
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

export const { auth, signIn, signOut, handlers } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: THIRTY_DAYS_IN_SECONDS, // 30 days session expiry
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          console.error("API URL is not defined in environment variables.");
          throw new Error(
            "Server configuration error. Please try again later."
          );
        }

        try {
          const response = await fetch(`${apiUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          // Check content type to ensure we got JSON
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            console.error(
              "Server returned non-JSON response. Backend may be down."
            );
            throw new Error(
              "Unable to connect to server. Please check if backend is running."
            );
          }

          const data = await response.json();

          if (!response.ok) {
            // Throw specific error message from backend
            throw new Error(data.message || "Invalid email or password");
          }

          // Backend returns: { success, message, user, accessToken }
          if (!data.user || !data.accessToken) {
            console.error("Incomplete user data received from server.");
            throw new Error("Server error. Please try again.");
          }

          // Return user with accessToken and token issue time
          return {
            id: data.user._id,
            _id: data.user._id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            provider: data.user.provider,
            avatar: data.user.avatar,
            isEmailVerified: data.user.isEmailVerified,
            emailVerified: null, // Required by AdapterUser
            accessToken: data.accessToken,
            tokenIssuedAt: Date.now(), // Track when token was issued
          };
        } catch (error) {
          console.error("Authorization error:", error);
          // Re-throw with user-friendly message
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("An unexpected error occurred. Please try again.");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign in, add user data to token
      if (user) {
        token.id = user.id;
        token._id = user._id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.provider = user.provider;
        token.avatar = user.avatar;
        token.isEmailVerified = user.isEmailVerified;
        token.accessToken = user.accessToken;
        token.tokenIssuedAt = user.tokenIssuedAt || Date.now();
      }

      // Check if token has expired (30 days)
      if (token.tokenIssuedAt) {
        const tokenAge = Date.now() - (token.tokenIssuedAt as number);
        const maxAge = THIRTY_DAYS_IN_SECONDS * 1000; // Convert to milliseconds

        if (tokenAge > maxAge) {
          // Token has expired, return empty token to force re-login
          console.log("Token expired, forcing re-login");
          return {
            ...token,
            accessToken: null,
            error: "TokenExpired",
          };
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Check if token is expired or has error
      if (token.error === "TokenExpired" || !token.accessToken) {
        // Return session without user data to trigger logout
        return {
          ...session,
          user: undefined,
          accessToken: undefined,
          error: "TokenExpired",
        };
      }

      // Pass token data to session
      if (token) {
        session.user = {
          id: token.id,
          _id: token._id,
          name: token.name,
          email: token.email,
          role: token.role,
          provider: token.provider,
          avatar: token.avatar,
          isEmailVerified: token.isEmailVerified,
          image: token.avatar,
        } as any; // Type assertion needed due to NextAuth complex type inference
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
});
