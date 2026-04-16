import type { ImageSourcePropType } from "react-native";

export const UNLOCKABLES = ["merch", "share", "forcat", "picat"] as const;
export type Unlockable = (typeof UNLOCKABLES)[number];

export const APP_ICONS = [
  {
    id: null,
    labelKey: "default",
    preview: require("@/assets/images/icon.png"),
    requires: null,
  },
  {
    id: "Light",
    labelKey: "light",
    preview: require("@/assets/images/app-icons/icon-light.png"),
    requires: null,
  },
  {
    id: "Merch",
    labelKey: "merch",
    preview: require("@/assets/images/app-icons/icon-merch.png"),
    requires: "merch",
  },
  {
    id: "Share",
    labelKey: "share",
    preview: require("@/assets/images/app-icons/icon-share.png"),
    requires: "share",
  },
  {
    id: "Forcat",
    labelKey: "forcat",
    preview: require("@/assets/images/app-icons/icon-forcat.png"),
    requires: "forcat",
  },
  {
    id: "Picat",
    labelKey: "picat",
    preview: require("@/assets/images/app-icons/icon-picat.png"),
    requires: "picat",
  },
] as const satisfies ReadonlyArray<{
  id: string | null;
  labelKey: string;
  preview: ImageSourcePropType;
  requires: Unlockable | null;
}>;

export type AppIconId = (typeof APP_ICONS)[number]["id"];

export const isAppIconId = (value: string | null): value is AppIconId =>
  APP_ICONS.some((icon) => icon.id === value);
