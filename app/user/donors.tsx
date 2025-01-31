import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import { useLocalSearchParams, Link } from "expo-router";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ScrollView, TouchableOpacity, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { queryClient } from "@/components/providers/query-client-provider";
import {
  Avatar,
  Button,
  Icon,
  Skeleton,
  ThemedText,
  ThemedTextInput,
  ThemedView,
} from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { DONORS_KEY, useDonorsGet } from "@/domains/donors/donors.api";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";
import { getInitials } from "@/lib/strings";

const Donate = () => {
  const { donate } = useLocalSearchParams();
  const intl = useIntl();
  const api = useApiWithAuth();
  const [donation, setDonation] = useState("9");
  const [isLoading, setIsLoading] = useState(false);
  const [isSummited, setIsSummited] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const animatedScale = useSharedValue(0);
  const [focused, setIsFocused] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: animatedScale.value }],
  }));

  const handleFocus = () => {
    setIsFocused(true);
    animatedScale.value = withSpring(-300, {
      damping: 20,
      stiffness: 100,
    });
  };

  const handleBlur = () => {
    setIsFocused(false);
    animatedScale.value = withSpring(0, {
      damping: 10,
      stiffness: 100,
    });
  };

  const onSubmit = async () => {
    try {
      setIsSummited(false);
      setIsLoading(true);
      const response = await api.protected.stripe.donation.get({
        query: { amount: donation },
      });

      if (response.error) {
        throw new Error("1");
      }

      const { error: initPaymentError } = await initPaymentSheet({
        merchantDisplayName: "Josep Vidal @ 100cims",
        returnURL: "centcims://user",
        applePay: {
          merchantCountryCode: "ES",
        },
        paymentIntentClientSecret: response.data.message, // retrieve this from your server
      });

      if (initPaymentError) {
        throw new Error("2");
      }

      const { error } = await presentPaymentSheet();

      if (error) {
        // canceled
      } else {
        // success
        void api.protected.donors.index
          .post({ quantity: donation })
          .then(() => queryClient.refetchQueries({ queryKey: DONORS_KEY }));
        setIsSummited(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View
      style={[animatedStyle]}
      className="relative border-t border-border px-6 pb-12 pt-8"
    >
      {isSummited && (
        <View className="absolute left-6 top-2 z-20 h-24 w-full items-center justify-center bg-background">
          <View className="flex flex-row items-center justify-center gap-1">
            <Icon name="checkmark.seal.fill" color="#10b981" />
            <ThemedText className="font-medium text-emerald-500">
              <FormattedMessage defaultMessage="Received, thanks for your donation!" />
            </ThemedText>
          </View>
        </View>
      )}
      <ThemedTextInput
        className="mb-2"
        inputClassName="text-center"
        autoFocus={!!donate}
        multiline
        keyboardType="numeric"
        value={donation}
        onChangeText={setDonation}
        label={intl.formatMessage({
          defaultMessage: "How much you want to contribute (€)?",
        })}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      <Button
        className="mb-2"
        disabled={!donation || isSummited}
        onPress={onSubmit}
        isLoading={isLoading}
      >
        <FormattedMessage defaultMessage="Donate" />
      </Button>
      {focused && (
        <View className="gap-6">
          <View>
            <ThemedText className="text-sm font-medium text-muted-foreground">
              <FormattedMessage defaultMessage="*By donating, you are helping us keep the app alive while also encouraging the continuous addition of new features." />
            </ThemedText>
          </View>
          <Link href="/user/suggestions" asChild>
            <TouchableOpacity className="flex-row items-center justify-between gap-4 rounded-xl border border-border p-4">
              <ThemedText>
                <FormattedMessage defaultMessage="Share requests or suggestions here" />
              </ThemedText>
              <Icon name="arrow.forward" muted size={18} />
            </TouchableOpacity>
          </Link>
        </View>
      )}
    </Animated.View>
  );
};

export default function DonorsScreen() {
  const { data: donors, isPending: isPendingDonors } = useDonorsGet();

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <View className="px-6">
        <ThemedText className="mb-1 text-4xl font-bold">
          <FormattedMessage defaultMessage="Donors" />
        </ThemedText>
        <ThemedText className="mb-8 text-muted-foreground">
          <FormattedMessage defaultMessage="Angels that with their contributions help 100cims stay alive." />
        </ThemedText>
      </View>
      <ScrollView className="flex-1 px-6" contentContainerClassName="gap-4">
        {isPendingDonors && (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="h-6 w-24" />
            </View>
            <Skeleton className="h-6 w-12" />
          </View>
        )}
        {donors?.map((donor) => (
          <View
            className="flex-row items-center justify-between"
            key={donor.userId}
          >
            <View className="flex-row items-center gap-3">
              <Avatar
                imageUrl={donor.userImageUrl}
                initials={getInitials(donor.userFirstName || "?")}
              />
              <ThemedText className="text-2xl font-medium">
                {donor.userFirstName}
              </ThemedText>
            </View>
            <ThemedText className="text-2xl text-primary">
              {donor.totalDonation}€
            </ThemedText>
          </View>
        ))}
      </ScrollView>
      <StripeProvider
        publishableKey="pk_test_51QlXQzGGF8E5GRBLA45Sb036ZDfsB5UFOvVaZ1lSOCa01Ict61waxEAEyVeOxzxypm8CUv440zVoCxehMYwgmB6X00lHUYjRUU"
        merchantIdentifier="merchant.100cims.100cims" // required for Apple Pay
        urlScheme="centcims" // required for 3D Secure and bank redirects
      >
        <Donate />
      </StripeProvider>
    </ThemedView>
  );
}
