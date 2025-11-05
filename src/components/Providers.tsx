"use client";

import { SessionProvider, useSession, signIn } from "next-auth/react";
import { ReactNode, useEffect } from "react";

interface ProvidersProps {
  children: ReactNode;
}

function AutoAuth({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      // Faz login automático quando não houver sessão
      console.log("Autenticando automaticamente...");
      signIn("credentials", { redirect: false }).then((result) => {
        if (result?.error) {
          console.error("Erro na autenticação automática:", result.error);
        } else {
          console.log("Autenticação automática bem-sucedida!");
        }
      });
    }
  }, [status]);

  // Mostra loader enquanto autentica
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#002B5B] mx-auto mb-4"></div>
          <p className="text-[#002B5B] font-semibold">Autenticando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AutoAuth>{children}</AutoAuth>
    </SessionProvider>
  );
}


