import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      // Entrar pelo Google e pelo GitHub com o mesmo endereço cai na mesma
      // conta, em vez de falhar com OAuthAccountNotLinked.
      //
      // O parâmetro se chama "dangerous" porque, num provedor que devolva
      // e-mail *não verificado*, alguém poderia assumir a conta alheia só
      // cadastrando aquele endereço. Google e GitHub devolvem apenas o e-mail
      // primário já verificado, então esse caminho não existe aqui. Antes de
      // adicionar um terceiro provedor, confirme que ele também verifica.
      allowDangerousEmailAccountLinking: true,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    // Sem isto, um callback falho cai na página de erro embutida do NextAuth
    // (ou volta calado para o login). Mandando para cá, a tela consegue ler
    // `?error=` e dizer o que aconteceu.
    error: '/login',
  },
  debug: process.env.NODE_ENV === "development",
}
