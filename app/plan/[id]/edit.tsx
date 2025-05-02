import { useLocalSearchParams, useRouter } from "expo-router";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useIntl, FormattedMessage } from "react-intl";
import {
  Alert,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";

import {
  Button,
  Icon,
  SearchInput,
  ThemedKeyboardAvoidingView,
  ThemedText,
  ThemedDateInput,
  ThemedTextInput,
  ThemedView,
} from "@/components/ui/atoms";
import {
  AvatarGroup,
  BottomDrawer,
  MountainItemListAsTouchable,
  ScreenHeader,
  UserSelectInput,
  UserForSelectInput,
} from "@/components/ui/molecules";
import { useMountains } from "@/domains/mountain/mountain.api";
import {
  usePlanDelete,
  usePlanOne,
  usePlanUpdate,
} from "@/domains/plan/plan.api";
import { useUsers } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { cleanText } from "@/lib";

export default function PlanEditPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: planData } = usePlanOne({ id });
  const { data: mountainsData } = useMountains();
  const { mutateAsync: updatePlan, isPending: isPendingUpdate } =
    usePlanUpdate();
  const { mutateAsync: deletePlan } = usePlanDelete();

  const intl = useIntl();
  const router = useRouter();

  const plan = planData?.data?.message;
  const allMountains = useMemo(
    () => mountainsData?.data?.message ?? [],
    [mountainsData],
  );

  const [title, setTitle] = useState(plan?.title);
  const [description, setDescription] = useState(
    plan?.description || undefined,
  );
  const [date, setDate] = useState<Date | null>(
    plan?.startDate ? new Date(plan?.startDate) : null,
  );
  const [editingMountains, setEditingMountains] = useState(false);
  const [mountainIds, setMountainIds] = useState<string[]>([]);
  const [users, setUsers] = useState<UserForSelectInput[]>([]);

  useEffect(() => {
    if (plan) {
      setTitle(plan.title);
      setDescription(plan.description ?? undefined);
      setDate(plan.startDate ? new Date(plan.startDate) : null);
      setMountainIds(plan.mountains?.map((m) => m.id) ?? []);
      setUsers(
        plan?.users?.map((u) => ({
          id: u.id,
          fullName: getFullName(u),
          imageUrl: u.imageUrl,
        })) || [],
      );
    }
  }, [plan]);

  const selectedMountains = useMemo(() => {
    return allMountains.filter((m) => mountainIds.includes(m.id));
  }, [mountainIds, allMountains]);

  const handleUpdate = async () => {
    if (!title?.trim()) {
      return Alert.alert(
        intl.formatMessage({ defaultMessage: "Title is required" }),
      );
    }

    const response = await updatePlan({
      id,
      title,
      description,
      startDate: date ? date.toISOString() : undefined,
      mountainIds,
      userIds: users.map((u) => u.id),
    });

    if (response.data?.success) router.dismiss();
    else
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Something went wrong" }),
      );
  };

  const handleDelete = () => {
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Delete plan?" }),
      intl.formatMessage({ defaultMessage: "This cannot be undone." }),
      [
        {
          text: intl.formatMessage({ defaultMessage: "Cancel" }),
          style: "cancel",
        },
        {
          text: intl.formatMessage({ defaultMessage: "Delete" }),
          style: "destructive",
          onPress: async () => {
            await deletePlan({ id });
            router.dismissTo("/plans");
          },
        },
      ],
    );
  };

  const handleCancel = () => {
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Cancel this plan?" }),
      intl.formatMessage({ defaultMessage: "Participants will be notified." }),
      [
        {
          text: intl.formatMessage({ defaultMessage: "Keep" }),
          style: "cancel",
        },
        {
          text: intl.formatMessage({ defaultMessage: "Cancel plan" }),
          style: "destructive",
          onPress: async () => {
            await updatePlan({
              id,
              status: "canceled",
            });
            router.dismiss();
          },
        },
      ],
    );
  };

  if (!plan) return null;

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View className="flex-1">
        <ScreenHeader>
          <FormattedMessage defaultMessage="Updating plan" />
        </ScreenHeader>
        <ThemedKeyboardAvoidingView>
          <ScrollView
            className="p-6"
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-4 pb-24"
          >
            <ThemedTextInput
              label={intl.formatMessage({ defaultMessage: "Activity title" })}
              value={title}
              onChangeText={setTitle}
            />
            <ThemedTextInput
              label={intl.formatMessage({ defaultMessage: "Extra info" })}
              multiline
              value={description}
              onChangeText={setDescription}
            />
            <ThemedDateInput
              value={date}
              onDateValid={(date) => setDate(date)}
            />

            <View className="mb-2">
              <ThemedText className="mb-2 text-lg font-medium">
                <FormattedMessage defaultMessage="Participants" />
              </ThemedText>
              <UserSelection
                creatorId={plan.creatorId}
                selectedUsers={users}
                onChange={setUsers}
              />
            </View>

            <View className="mb-2">
              <ThemedText className="mb-2 text-lg font-medium">
                <FormattedMessage defaultMessage="Mountains" />
              </ThemedText>
              <TouchableOpacity
                onPress={() => setEditingMountains(true)}
                className="flex-row items-center justify-between gap-4 rounded-xl border-2 border-border px-4 py-2"
              >
                {!!selectedMountains?.length ? (
                  <AvatarGroup
                    limit={6}
                    items={selectedMountains.map((m) => ({
                      name: m.name,
                      imageUrl: m.imageUrl,
                    }))}
                  />
                ) : (
                  <View className="h-8" />
                )}
                <View className="size-10 items-center justify-center rounded-xl bg-muted-foreground/30 shadow">
                  <Icon name="plus" weight="semibold" color="white" size={16} />
                </View>
              </TouchableOpacity>
            </View>
            <Button
              className="mt-6"
              intent="success"
              onPress={handleUpdate}
              isLoading={isPendingUpdate}
            >
              <FormattedMessage defaultMessage="Update" />
            </Button>
            <Button intent="outline" onPress={() => router.dismiss()}>
              <FormattedMessage defaultMessage="Close" />
            </Button>
            <View className="flex-row items-center justify-center">
              <TouchableOpacity onPress={handleCancel} className="px-2 py-4">
                <ThemedText className="text-muted-foreground">
                  <FormattedMessage defaultMessage="Cancel" />
                </ThemedText>
              </TouchableOpacity>
              <ThemedText className="text-muted-foreground/50">
                <FormattedMessage defaultMessage="or" />
              </ThemedText>
              <TouchableOpacity onPress={handleDelete} className="px-2 py-4">
                <ThemedText className="text-muted-foreground">
                  <FormattedMessage defaultMessage="Delete" />
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <BottomDrawer
            isOpen={editingMountains}
            onRequestClose={() => setEditingMountains(false)}
          >
            <MountainsList
              mountainIds={mountainIds}
              setMountainIds={setMountainIds}
            />
          </BottomDrawer>
        </ThemedKeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const UserSelection = ({
  creatorId,
  selectedUsers,
  onChange,
}: {
  creatorId: string;
  selectedUsers: UserForSelectInput[];
  onChange: (selectedUsers: UserForSelectInput[]) => void;
}) => {
  const [userQuery, setUserQuery] = useState("");
  const { data: allUsersData, isFetching: isFetchingUsers } = useUsers({
    query: userQuery,
  });

  const allUsersDataMinusCreator = allUsersData?.filter(
    (u) => u.id !== creatorId,
  );

  return (
    <UserSelectInput
      query={userQuery}
      onQueryChange={setUserQuery}
      selectedUsers={selectedUsers}
      firstSelectedRemovable={false}
      selectableUsers={allUsersDataMinusCreator?.map((u) => ({
        id: u.id,
        fullName: getFullName(u),
        imageUrl: u.imageUrl,
      }))}
      onSelectedUsersChange={onChange}
      isFetchingUsers={isFetchingUsers}
    />
  );
};

const MountainsList = ({
  setMountainIds,
  mountainIds,
}: {
  setMountainIds: Dispatch<SetStateAction<string[]>>;
  mountainIds: string[];
}) => {
  const [query, setQuery] = useState("");
  const { data: mountainsData } = useMountains();
  const allMountains = useMemo(
    () => mountainsData?.data?.message ?? [],
    [mountainsData],
  );

  const filteredMountains = useMemo(() => {
    const filtered = !query.trim()
      ? allMountains
      : allMountains.filter(({ name, location }) =>
          cleanText(`${name} ${location}`)
            .toLowerCase()
            .includes(cleanText(query).toLowerCase()),
        );

    return filtered.sort((a, b) => {
      const aSelected = mountainIds.includes(a.id) ? 0 : 1;
      const bSelected = mountainIds.includes(b.id) ? 0 : 1;
      return aSelected - bSelected;
    });
  }, [query, allMountains, mountainIds]);

  return (
    <View className="max-h-[70vh] min-h-[70vh] bg-background p-6">
      <ThemedText className="mb-2 text-2xl font-semibold">
        <FormattedMessage defaultMessage="Mountains" />
      </ThemedText>
      <FlatList
        data={filteredMountains}
        keyExtractor={(m) => m.id}
        initialNumToRender={10}
        stickyHeaderIndices={[0]}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        getItemLayout={(_, index) => ({
          length: 100,
          offset: 100 * index,
          index,
        })}
        ListHeaderComponent={
          <ThemedView className="z-20 pb-2">
            <SearchInput onChangeText={(text) => setQuery(text)} />
          </ThemedView>
        }
        renderItem={({ item }) => {
          const isSelected = mountainIds.includes(item.id);
          return (
            <View className="relative py-2">
              <MountainItemListAsTouchable
                onPress={() => {
                  setMountainIds((prev) =>
                    isSelected
                      ? prev.filter((id) => id !== item.id)
                      : [...prev, item.id],
                  );
                }}
                name={item.name}
                location={item.location}
                imageUrl={item.imageUrl}
                essential={item.essential}
                slug={item.slug}
                height={item.height}
              />
              {isSelected && (
                <View
                  className="pointer-events-none absolute left-0 top-2 items-center justify-center bg-blue-500"
                  style={{ width: 100, height: 100, borderRadius: 12 }}
                >
                  <Icon
                    name="checkmark"
                    size={32}
                    color="white"
                    animationSpec={{ effect: { type: "bounce" } }}
                  />
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};
