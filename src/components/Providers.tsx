"use client";

import { SessionProvider, useSession, signIn } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { LoadingContainer } from "./ui/loading-container";

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
    return <LoadingContainer fullHeight />;
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


