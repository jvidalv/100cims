import * as Linking from "expo-linking";

import { SITE_URL } from "@/lib/app-links";

export const getUrlDeeplink = (url: string) => {
  const planLink = Linking.createURL(url, {
    scheme: "centcims",
  });

  return `${SITE_URL}/deeplink?link=${planLink}`;
};
