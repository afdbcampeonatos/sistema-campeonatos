import NextAuth, { type DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Credenciais não fornecidas');
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          console.log('🔍 Buscando usuário:', email);
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log('❌ Usuário não encontrado:', email);
            return null;
          }

          console.log('🔐 Verificando senha...');
          const isPasswordValid = await bcrypt.compare(
            password,
            user.password
          );

          if (!isPasswordValid) {
            console.log('❌ Senha inválida');
            return null;
          }

          console.log('✅ Login bem-sucedido:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
          };
        } catch (error) {
          console.error('❌ Erro no authorize:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: { id: string; email: string; name?: string | null } | null }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: { session: DefaultSession; token: JWT }) {
      if (session.user && token.id && token.email) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'afdb-secret-key-change-in-production',
};

const { handlers, auth } = NextAuth(authOptions);

export { auth };

export const { GET, POST } = handlers;

