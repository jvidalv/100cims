import { treaty } from "@elysiajs/eden";
import { Treaty } from "@elysiajs/eden/dist/treaty2";
import { Alert } from "react-native";

import { App } from "@/api/routes";

export const request = (config?: Treaty.Config) =>
  treaty<App>(process.env.EXPO_PUBLIC_API_URL || "", {
    onResponse: (response) => {
      // console.log(response.url, response.status);
      if (!response.ok) {
        if (response.status === 422) {
          Alert.alert(
            "Error",
            "Please update the app ~ Porfavor, actualiza la app.",
          );
        }
      }
    },
    ...config,
  });

export const api = request().api;
