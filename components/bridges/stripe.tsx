import {
  StripeProvider as SP,
  useStripe as useP,
} from "@stripe/stripe-react-native";

export const StripeProvider = SP;
export const useStripe = useP;
