import * as Device from "expo-device";

const devicesWithDynamicIsland = [
  "iPhone 14 Pro",
  "iPhone 14 Pro Max",
  "iPhone 15",
  "iPhone 15 Plus",
  "iPhone 15 Pro",
  "iPhone 15 Pro Max",
  "iPhone 16",
  "iPhone 16 Plus",
  "iPhone 16 Pro",
  "iPhone 16 Pro Max",
];

export const hasDynamicIsland =
  Device.brand === "Apple" &&
  Device.modelName &&
  devicesWithDynamicIsland.includes(Device.modelName);

export const isAndroid = Device.osName === "Android";
export const isIOS = Device.osName === "iOS";
