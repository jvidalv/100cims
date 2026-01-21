type UserLike = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export const getFullName = (user: UserLike) => {
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
