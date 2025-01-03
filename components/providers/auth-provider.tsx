import React, {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { queryClient } from "@/components/providers/query-client-provider";
import { USER_ME_QUERY_KEY } from "@/domains/user/user.api";
import { removeJwt, setJwt } from "@/lib/auth";

interface AuthContextType {
  jwt?: string;
  isAuthenticated: boolean;
  setAuthenticated: (jwt: string) => void;
  logout: () => void;
}

let jwt = "";
export const overwriteJwt = (token: string) => (jwt = token);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [providerJwt, setProviderJwt] = useState<string>(jwt);

  const setAuthenticated = async (jwt: string) => {
    await setJwt(jwt);
    setProviderJwt(jwt);
  };

  const logout = async () => {
    await removeJwt();
    queryClient.removeQueries({ queryKey: USER_ME_QUERY_KEY });
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
