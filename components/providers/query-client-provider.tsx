import {
  onlineManager,
  QueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
} from "@tanstack/react-query";
import * as Network from "expo-network";
import { PropsWithChildren } from "react";
import { Platform } from "react-native";

if (Platform.OS !== "web") {
  onlineManager.setEventListener((setOnline) => {
    Network.addNetworkStateListener((state) => {
      setOnline(!!state.isConnected);
    });

    return () => {};
  });
}

export const queryClient = new QueryClient();

export const QueryClientProvider = ({ children }: PropsWithChildren) => {
  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
    </TanstackQueryClientProvider>
  );
};
