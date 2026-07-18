import "server-only";

import { compare, hashSync } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { getServerEnv } from "@/lib/env";
import { findUserByEmailForAuth } from "@/lib/services/user-service";
import { loginSchema } from "@/lib/validation/auth";

const dummyPasswordHash = hashSync("not-a-real-user-password", 12);

export async function authorizeCredentials(credentials: unknown) {
  const parsed = loginSchema.safeParse(credentials);

  if (!parsed.success) {
    return null;
  }

  const user = await findUserByEmailForAuth(parsed.data.email);
  const isPasswordValid = await compare(
    parsed.data.password,
    user?.passwordHash ?? dummyPasswordHash,
  );

  if (!user || !isPasswordValid) {
    return null;
  }

  return {
    id: user.id,
    name: user.username,
    email: user.email,
    role: user.role,
  };
}

export const authOptions: NextAuthOptions = {
  secret: getServerEnv().AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: getServerEnv().SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Correo y contraseña",
      credentials: {
        email: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId;
        session.user.role = token.role ?? "USER";
      }
      return session;
    },
  },
};
