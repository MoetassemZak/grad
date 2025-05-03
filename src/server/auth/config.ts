/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaAdapter } from "@auth/prisma-adapter";
import {type NextAuthConfig, type DefaultSession} from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "~/schema";
import bcrypt from "bcryptjs";
import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          const { email, password } =
            await signInSchema.parseAsync(credentials);

          const user = await db.user.findUnique({
            where: {
              email: email,
            },
          });

          if (!user) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            password,
            user.password,
          );

          if (!passwordMatch) {
            return null;
          }
          
          return user;
        } 
        catch (error) {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  adapter: PrismaAdapter(db),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        token.role = (user as any).role; // `user` comes from DB
      }
      return token;   
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          role: token.role, // Include role in session
        },
      };
    },
  } 
} satisfies NextAuthConfig;