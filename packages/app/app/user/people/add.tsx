import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";

import {
  ActivityIndicator,
  LucideIcon,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { ThemedTextInput } from "@/components/ui/atoms/themed-text-input";
import { PersonRow, ScreenHeader } from "@/components/ui/molecules";
import { useAddUserPerson, useUsers } from "@/domains/user/user.api";
import { logError } from "@/lib/log-error";

export default function AddPeopleScreen() {
  const intl = useIntl();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { data: results, isFetching } = useUsers({
    query: debounced,
    mode: "search",
  });
  const addPerson = useAddUserPerson();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const onAdd = async (userId: string) => {
    if (pendingId) return;
    setPendingId(userId);
    try {
      await addPerson.mutateAsync(userId);
      router.back();
    } catch (error) {
      logError(error, "user/people/add");
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Something went wrong" }),
      );
      setPendingId(null);
    }
  };

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <View className="mb-4 px-6">
        <ThemedText className="mb-4 text-4xl font-bold">
          <FormattedMessage defaultMessage="Add people" />
        </ThemedText>
        <ThemedTextInput
          value={search}
          onChangeText={setSearch}
          autoFocus
          label={intl.formatMessage({
            defaultMessage: "Type to search by name or email",
          })}
        />
      </View>
      <ScrollView
        contentContainerClassName="gap-3 px-6 pb-28"
        keyboardShouldPersistTaps="handled"
      >
        {!debounced && (
          <View className="rounded border-2 border-border p-4">
            <ThemedText className="text-sm text-muted-foreground">
              <FormattedMessage defaultMessage="Can’t find someone? They may have “Visible on people search” turned off in their profile — ask them to enable it." />
            </ThemedText>
          </View>
        )}
        {debounced && !isFetching && results && results.length === 0 && (
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="No results, please change the search." />
          </ThemedText>
        )}
        {results?.map((person) => (
          <PersonRow
            key={person.id}
            person={person}
            disabled={!!pendingId || person.isPerson}
            onPress={() => onAdd(person.id)}
            trailing={
              pendingId === person.id ? (
                <ActivityIndicator size="sm" />
              ) : person.isPerson ? (
                <View className="flex-row items-center gap-1">
                  <ThemedText className="text-base text-emerald-500">
                    <FormattedMessage defaultMessage="Already added" />
                  </ThemedText>
                  <LucideIcon icon={Check} size={16} color="#10b981" />
                </View>
              ) : undefined
            }
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}
