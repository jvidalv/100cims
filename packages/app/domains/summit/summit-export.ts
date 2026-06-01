import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { APP_BUILD_VERSION } from "@/lib/app-version";
import { getJwt } from "@/lib/auth";
import { getLocale } from "@/lib/locale";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Fetch the user's full summit history as CSV, write it to a temp file, and
 * open the system share sheet so the user can save it to Files / Drive /
 * email it / etc. The endpoint streams text/csv directly, so we read the body
 * with `response.text()` — no JSON parsing.
 *
 * The file is deleted from cache after the share sheet closes so repeated
 * exports don't accumulate on disk (Android in particular won't auto-purge).
 */
export const exportUserSummitsCsv = async (): Promise<void> => {
  const jwt = await getJwt();
  if (!jwt) throw new Error("Not authenticated");

  const response = await fetch(`${API_URL}/api/protected/user/summits/export`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      "x-app-platform": Platform.OS,
      "x-app-version": APP_BUILD_VERSION,
      "x-app-locale": getLocale(),
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Export failed (${response.status})`);
  }

  const csv = await response.text();

  const file = new File(Paths.cache, `cims-summits-${Date.now()}.csv`);
  file.create({ overwrite: true });
  file.write(csv);

  if (!(await Sharing.isAvailableAsync())) {
    file.delete();
    throw new Error("Sharing is not available on this device");
  }

  try {
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: "Export summits",
      UTI: "public.comma-separated-values-text",
    });
  } finally {
    file.delete();
  }
};
