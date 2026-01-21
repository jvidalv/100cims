import * as Linking from "expo-linking";

export const getUrlDeeplink = (url: string) => {
  const planLink = Linking.createURL(url, {
    scheme: "centcims",
  });

  return `https://cims-sempre-amunt.app/deeplink?link=${planLink}`;
};
