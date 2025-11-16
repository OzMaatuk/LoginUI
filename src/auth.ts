import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: "authentik",
      name: "Authentik",
      type: "oidc",
      // Server-side issuer (Docker network)
      issuer: process.env.AUTHENTIK_ISSUER,
      clientId: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
      // Override endpoints: use Docker network for server calls, localhost for browser redirects
      authorization: {
        url: process.env.AUTHENTIK_ISSUER!.replace("authentik-server-dev", "localhost") + "../authorize/",
        params: {
          scope: "openid email profile",
        },
      },
      token: {
        url: process.env.AUTHENTIK_ISSUER + "../token/",
        params: {
          grant_type: "authorization_code",
        },
      },
      userinfo: process.env.AUTHENTIK_ISSUER + "../userinfo/",
      checks: ["pkce", "state"],
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      idToken: true,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name || profile.preferred_username || profile.email,
        };
      },
      style: {
        brandColor: "#fd4b2d",
      },
    } as any,
    Credentials({
      id: "credentials",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        // OTP verification is handled in /api/otp/verify
        // This provider just creates the session after verification
        return {
          id: credentials.email as string,
          email: credentials.email as string,
          name: credentials.email as string,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.id = profile.sub;
        token.email = profile.email;
        token.name = profile.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow redirects to external apps via login_session
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Default to base URL for external redirects
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
