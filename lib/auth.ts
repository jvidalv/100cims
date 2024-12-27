import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "auth::jwt";

export const getJwt = () => AsyncStorage.getItem(AUTH_KEY);
export const setJwt = (jwt: string) => AsyncStorage.setItem(AUTH_KEY, jwt);
export const removeJwt = () => AsyncStorage.removeItem(AUTH_KEY);
