import { useAuth } from "@/components/providers/auth-provider";
import { treaty } from "@elysiajs/eden";
import { App } from "@/api/routes";

export const useApiWithAuth = () => {
  const { jwt } = useAuth();

  const app = treaty<App>(process.env.EXPO_PUBLIC_API_URL || "", {
    headers: (path) => {
      if (path.startsWith("/api/protected") && jwt) {
        return [{ Authorization: `Bearer ${jwt}` }];
      }
      return {};
    },
  });

  return app.api;
};
