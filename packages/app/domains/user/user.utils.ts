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

export const formatUsersLine = (users: { firstName?: string | null }[]) => {
  if (users.length === 0) return "";
  const names = users.map((u) => u.firstName || "?");
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]}, ${names[1]} & ${names.length - 2} more`;
};
