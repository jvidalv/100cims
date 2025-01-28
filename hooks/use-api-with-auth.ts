import { useAuth } from "@/components/providers/auth-provider";
import { request } from "@/lib/request";

export const useApiWithAuth = () => {
  const { jwt } = useAuth();

  const app = request({
    headers: (path) => {
      if (path.startsWith("/api/protected") && jwt) {
        return [{ Authorization: `Bearer ${jwt}` }];
      }
      return {};
    },
  });

  return app.api;
};
