import { FormattedMessage } from "react-intl";

export default function PrivacyPolicyRoute() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="mb-4 text-5xl font-black">
        <FormattedMessage defaultMessage="Privacy policy" />
      </h1>
      <p className="text-lg">
        <FormattedMessage defaultMessage="This app only uses your data for authentication purposes. We do not store, share, or use your data for any other purpose. For questions, contact: josepvidalvidal@gmail.com." />
      </p>
    </div>
  );
}
