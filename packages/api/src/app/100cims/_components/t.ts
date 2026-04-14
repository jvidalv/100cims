import { createTranslator } from "next-intl";

import caMessages from "../../../../messages/ca.json";

const CA_LOCALE = "ca";

export const getCaTranslator = () =>
  createTranslator({
    locale: CA_LOCALE,
    messages: caMessages,
    namespace: "100cims-page",
  });
