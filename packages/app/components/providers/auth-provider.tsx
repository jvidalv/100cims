import React, {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { queryClient } from "@/components/providers/query-client-provider";
import { setAuthToken, clearAuthToken } from "@/lib/api-client";
import { removeJwt, setJwt } from "@/lib/auth";

interface AuthContextType {
  jwt: string | null;
  isAuthenticated: boolean;
  setAuthenticated: (jwt: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<PropsWithChildren<{ jwt: string | null }>> = ({
  children,
  jwt,
}) => {
  const [providerJwt, setProviderJwt] = useState<string | null>(jwt);

  const setAuthenticated = async (jwt: string) => {
    await setJwt(jwt);
    queryClient.removeQueries({ queryKey: ["me"] });
    setAuthToken(jwt); // Configure API client with auth token
    setProviderJwt(jwt);
  };

  const logout = async () => {
    await removeJwt();
    clearAuthToken();
    queryClient.removeQueries({ queryKey: ["me"] });
    setProviderJwt("");
  };

  return (
    <AuthContext.Provider
      value={{
        jwt: providerJwt,
        isAuthenticated: !!providerJwt,
        setAuthenticated,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
