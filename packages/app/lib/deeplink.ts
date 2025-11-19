import * as Linking from "expo-linking";

export const getUrlDeeplink = (url: string) => {
  const planLink = Linking.createURL(url, {
    scheme: "centcims",
  });

  return `https://100cims.app/deeplink?link=${planLink}`;
};
