import { Link, useRouter } from "expo-router";
import {
  Check,
  ChevronRight,
  Lock,
  Plus,
  Square,
  SquareCheck,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { ScrollView, TouchableOpacity, View } from "react-native";

import { LucideIcon, ThemedText, ThemedView } from "@/components/ui/atoms";
import { PersonRow, ScreenHeader } from "@/components/ui/molecules";
import {
  clearPeoplePickerSession,
  commitPeoplePickerSession,
  readPeoplePickerSession,
} from "@/domains/user/people-picker-session";
import { useUserMe, useUserPeople } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";

type Selected = { id: string; fullName: string; imageUrl?: string | null };

export default function PeoplePickerScreen() {
  const router = useRouter();
  const { data: me } = useUserMe();
  const { data: people } = useUserPeople();

  // Session is read once synchronously at mount: callers always set it
  // before `router.push`. The id lets us cleanup only our own session on
  // unmount, so a later opener's session survives this screen's teardown.
  const [session] = useState(() => readPeoplePickerSession());
  const firstSelectedRemovable = session?.firstSelectedRemovable ?? true;
  const maxSelected = session?.maxSelected;
  const title = session?.title;

  const [selected, setSelected] = useState<Selected[]>(session?.initial ?? []);
  const [extras, setExtras] = useState<Selected[]>(session?.extras ?? []);

  // Safety: if the user navigates here without a session (deep link, etc.),
  // bounce back so we don't get stuck on a screen that can't commit.
  useEffect(() => {
    if (!session) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    }
    return () => clearPeoplePickerSession(session?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  type DrawerUser = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
  const list: DrawerUser[] = [];
  if (me) {
    list.push({
      id: me.id,
      firstName: me.firstName ?? null,
      lastName: me.lastName ?? null,
      imageUrl: me.imageUrl ?? null,
    });
  }
  for (const p of people ?? []) {
    if (p.userId === me?.id) continue;
    list.push({
      id: p.userId,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
    });
  }

  const toggle = (user: DrawerUser) => {
    const isSelected = selected.some((u) => u.id === user.id);
    const nextSelected = isSelected
      ? selected.filter((u) => u.id !== user.id)
      : [
          ...selected,
          {
            id: user.id,
            fullName: getFullName(user) || "?",
            imageUrl: user.imageUrl,
          },
        ];
    setSelected(nextSelected);
    // Commit to the session on every toggle so the caller reflects the
    // change immediately; no explicit Done step needed.
    commitPeoplePickerSession([...nextSelected, ...extras]);
  };

  const removeExtra = (id: string) => {
    const nextExtras = extras.filter((u) => u.id !== id);
    setExtras(nextExtras);
    commitPeoplePickerSession([...selected, ...nextExtras]);
  };

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <View className="mb-4 px-6">
        <ThemedText className="text-4xl font-bold">
          {title ?? <FormattedMessage defaultMessage="People" />}
        </ThemedText>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-3 px-6 pb-36"
      >
        {list.map((user, index) => {
          const isSelected = selected.some((u) => u.id === user.id);
          const isLocked = index === 0 && !firstSelectedRemovable;
          const notAllowed =
            !!maxSelected && selected.length >= maxSelected && !isSelected;

          return (
            <PersonRow
              key={user.id}
              person={user}
              disabled={isLocked || notAllowed}
              className={notAllowed ? "opacity-50" : undefined}
              onPress={() => toggle(user)}
              trailing={
                isLocked ? (
                  <LucideIcon icon={Lock} size={20} success />
                ) : (
                  <LucideIcon
                    icon={isSelected ? SquareCheck : Square}
                    size={20}
                    success={isSelected}
                  />
                )
              }
            />
          );
        })}
        <Link href="/user/people/add" asChild>
          <TouchableOpacity className="flex-row items-center gap-3">
            <View className="size-12 items-center justify-center rounded-full border-2 border-muted-foreground/50">
              <LucideIcon icon={Plus} size={22} muted />
            </View>
            <ThemedText className="text-lg font-medium">
              <FormattedMessage defaultMessage="Add people" />
            </ThemedText>
            <View className="ml-auto">
              <LucideIcon icon={ChevronRight} size={20} muted />
            </View>
          </TouchableOpacity>
        </Link>
        {extras.length > 0 && (
          <>
            <ThemedText className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <FormattedMessage defaultMessage="Other participants" />
            </ThemedText>
            {extras.map((u) => (
              <PersonRow
                key={u.id}
                displayName={u.fullName}
                person={{
                  firstName: null,
                  lastName: null,
                  imageUrl: u.imageUrl ?? null,
                }}
                onPress={() => removeExtra(u.id)}
                trailing={<LucideIcon icon={X} size={20} muted />}
              />
            ))}
          </>
        )}
        <TouchableOpacity
          className="flex-row items-center gap-3"
          onPress={() => router.back()}
        >
          <View className="size-12 items-center justify-center rounded-full border-2 border-emerald-500/70">
            <LucideIcon icon={Check} size={22} success />
          </View>
          <ThemedText className="text-lg font-medium text-emerald-500">
            <FormattedMessage defaultMessage="Done" />
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}
