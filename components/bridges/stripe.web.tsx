import { Fragment, PropsWithChildren } from "react";

export const StripeProvider = ({ children }: PropsWithChildren) => (
  <Fragment>{children}</Fragment>
);
export const useStripe = () => ({});
