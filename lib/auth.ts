import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Simple, reliable email + password login. No external identity provider to
// misconfigure -- accounts are created directly for firm staff (see
// app/api/admin/create-user/route.ts) with a bcrypt-hashed password.
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const dbUser = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        });
        if (!dbUser || !dbUser.password) return null;

        const valid = await bcrypt.compare(credentials.password, dbUser.password);
        if (!valid) return null;

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role ?? 'staff';
      }
      return session;
    }
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login'
  }
};
