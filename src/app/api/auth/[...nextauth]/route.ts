import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const nextAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize() {
        try {
          // Gerar o cabeçalho Basic Auth
          const credentials = Buffer.from(
            "ALIANCA_WEBSITE:TQzQzxvlKSZCzTAVjc2iP6CX"
          ).toString("base64");

          const response = await fetch(
            "https://aliancacvtest.rtcom.pt/anywhere/oauth/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${credentials}`, // Basic Auth header
              },
              body: new URLSearchParams({
                grant_type: "client_credentials",
                scope: "read write", // Incluindo escopo
              }),
            }
          );

          const data = await response.json();

          console.log("Resposta da API:", data);

          if (!response.ok || !data.access_token) {
            throw new Error(data.error || "Falha na autenticação.");
          }

          return {
            id: "oauth-user",
            token: data.access_token,
          };
        } catch (error) {
          console.error("Erro no fluxo de autorização:", error);
          throw new Error("Falha na autenticação.");
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET, // Certifique-se de que isso está configurado no .env
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.token;
        token.tokenExpiry = Math.floor(Date.now() / 1000) + 3600; // Define o tempo de expiração (exemplo: 1 hora)
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = session.user || {};
        session.user.accessToken = token.accessToken as string;
        session.user.tokenExpiry = token.tokenExpiry as number;
      }
      return session;
    },
  },
};

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
