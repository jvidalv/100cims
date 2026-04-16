import { forwardRef, ReactNode } from "react";
import { TouchableOpacity, TouchableOpacityProps, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { Avatar, type AvatarSize, ThemedText } from "@/components/ui/atoms";
import { getFullName } from "@/domains/user/user.utils";
import { getInitials } from "@/lib/strings";

type Person = {
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

type Props = {
  person: Person;
  /** Override the rendered name. Useful when you only have a pre-computed full name. */
  displayName?: string;
  avatarSize?: AvatarSize;
  trailing?: ReactNode;
} & TouchableOpacityProps;

/**
 * Standard row used across People lists (/user/people, /user/people/add,
 * /user/[user] profile). Avatar on the left, full name, optional trailing
 * content (count + icon, badge, spinner, etc).
 */
export const PersonRow = forwardRef<View, Props>(
  (
    { person, displayName, avatarSize = "md", trailing, className, ...props },
    ref,
  ) => {
    const label = displayName ?? getFullName(person);
    return (
      <TouchableOpacity
        ref={ref}
        className={twMerge("flex-row items-center gap-3", className)}
        {...props}
      >
        <Avatar
          size={avatarSize}
          imageUrl={person.imageUrl}
          initials={getInitials(label)}
        />
        <ThemedText className="text-lg font-medium">{label}</ThemedText>
        {trailing && <View className="ml-auto">{trailing}</View>}
      </TouchableOpacity>
    );
  },
);

PersonRow.displayName = "PersonRow";
