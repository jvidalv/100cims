// Workaround for expo-alternate-app-icons@8 on iOS: the plugin sets
// ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES in the Xcode project but does
// NOT inject the CFBundleIcons.CFBundleAlternateIcons entries into Info.plist.
// Without those, iOS's setAlternateIconName: rejects with EAGAIN
// ("Resource temporarily unavailable"). This plugin writes the missing keys.
//
// Keep the icon list in sync with app.config.ts's expo-alternate-app-icons block.

const { withInfoPlist } = require("expo/config-plugins");

const ALTERNATE_ICON_NAMES = ["Light", "Merch", "Share", "Forcat", "Picat"];

const withAlternateIconsPlist = (config) =>
  withInfoPlist(config, (cfg) => {
    const alternateIcons = Object.fromEntries(
      ALTERNATE_ICON_NAMES.map((name) => [
        name,
        {
          CFBundleIconFiles: [name],
          UIPrerenderedIcon: false,
        },
      ]),
    );

    cfg.modResults.CFBundleIcons = {
      ...(cfg.modResults.CFBundleIcons ?? {}),
      CFBundleAlternateIcons: alternateIcons,
    };

    return cfg;
  });

module.exports = withAlternateIconsPlist;
