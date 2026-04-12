import { auth } from "@/auth";

export const safeAuth = async () => {
  try {
    return await auth();
  } catch {
    return null;
  }
};
