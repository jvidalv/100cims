import { User } from "@/api/routes/@shared/types";

export const getFullName = (user: Partial<User>) => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  if (user.firstName) {
    return user.firstName;
  }

  if (user.lastName) {
    return user.lastName;
  }

  return user.email || "🥷";
};
