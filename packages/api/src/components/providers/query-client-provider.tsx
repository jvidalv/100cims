"use client";

import {
  QueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
} from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function QueryClientProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 1000, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <TanstackQueryClientProvider client={client}>
      {children}
    </TanstackQueryClientProvider>
  );
}
