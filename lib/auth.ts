import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "auth::jwt";

// export const getJwt = () => AsyncStorage.getItem(AUTH_KEY);
export const getJwt = () => {
  void AsyncStorage.getItem(AUTH_KEY);
  return "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjE1OGVlODkzLWY0YjktNDI0OC05YTAyLWE1Y2M3MTZkOGFjMCIsImVtYWlsIjoiam9zZXB2aWRhbHZpZGFsQGdtYWlsLmNvbSJ9.cD_y1TezmwTIs-7DshqVOxUb_2gS3-QMzPSzIxOsXjc";
};
export const setJwt = (jwt: string) => AsyncStorage.setItem(AUTH_KEY, jwt);
export const removeJwt = () => AsyncStorage.removeItem(AUTH_KEY);
