import { LogBox } from "react-native";

/**
 * `@rnmapbox/maps` v10.x on RN's new architecture emits three recurring bits
 * of native lifecycle noise that bubble up as red-boxes / warns in dev:
 *
 *   • `WARN locationManager Error: RNMBXLocationModule.getLastKnownLocation()
 *     Objective C type was unsupported.` — iOS returns a CLLocation with
 *     fields the React Native bridge can't auto-encode (timestamp NSDate +
 *     others). The SDK logs the warn and falls back to the live location
 *     watch, which works fine.
 *
 *   • `ERROR Unknown reactTag: NNN` — the native bridge dispatches an event
 *     to a JS view whose tag has already been freed by React Native's view
 *     manager. Race between native-view-create and JS-handler-wire-up.
 *
 *   • `ERROR TypeError: undefined is not a function` — cascades from the
 *     reactTag rejection when the next queued method on the now-tagless view
 *     object resolves to `undefined`.
 *
 * None affect functionality (map renders, location works, taps work). All
 * three are internal SDK noise we can't fix at our layer; upstream tracking:
 * rnmapbox/maps issues around the new-arch lifecycle race.
 *
 * Dev-only filter. Tight string matches so it can't swallow real errors.
 */

// Only Mapbox-specific patterns. The bare `undefined is not a function`
// pattern was removed because it was silencing legitimate React Native
// Animated red-boxes (AnimatedNode listeners firing on torn-down nodes)
// during NativeTabs eager-mount warmup — not actually Mapbox noise.
const SILENT_PATTERNS: RegExp[] = [
  /Unknown reactTag: \d+/,
  /RNMBXLocationModule\.getLastKnownLocation\(\)/,
  /locationManager Error/,
];

// Collect every string-shaped piece of context we can find on a value:
// the value itself if it's a string, .message and .stack on Errors, the
// .toString() output, etc. Each piece is independently regex-tested so we
// catch noise no matter which shape RN's logger delivers it in.
const extractMessages = (input: unknown): string[] => {
  if (typeof input === "string") return [input];
  if (!input || typeof input !== "object") return [];
  const out: string[] = [];
  if ("message" in input && typeof input.message === "string") {
    out.push(input.message);
  }
  if ("stack" in input && typeof input.stack === "string") {
    out.push(input.stack);
  }
  const stringified = String(input);
  if (stringified && stringified !== "[object Object]") {
    out.push(stringified);
  }
  return out;
};

const isMapboxNoise = (input: unknown): boolean => {
  const messages = extractMessages(input);
  return messages.some((msg) => SILENT_PATTERNS.some((re) => re.test(msg)));
};

const argsMatchNoise = (args: unknown[]): boolean => args.some(isMapboxNoise);

// Stash the installed flag on globalThis so Metro Fast Refresh (which
// re-evaluates this module) doesn't re-wrap `console.error`/`console.warn`
// on top of the existing wrappers — each cycle would otherwise stack a new
// layer, growing closure depth until logs run through N nested wrappers.
declare global {
  // eslint-disable-next-line no-var
  var __mapboxNoiseInstalled: boolean | undefined;
}

export const silenceMapboxNoise = () => {
  if (!__DEV__ || globalThis.__mapboxNoiseInstalled) return;
  globalThis.__mapboxNoiseInstalled = true;

  // Hide the LogBox red/yellow overlays for these specific strings. LogBox's
  // matcher takes both substrings and RegExps.
  LogBox.ignoreLogs([
    "Unknown reactTag",
    "RNMBXLocationModule.getLastKnownLocation",
    "locationManager Error",
  ]);

  // RN routes uncaught rejections and warns through console.error /
  // console.warn. Wrap both so the noise doesn't even hit Metro's terminal.
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (argsMatchNoise(args)) return;
    origError.apply(console, args);
  };

  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (argsMatchNoise(args)) return;
    origWarn.apply(console, args);
  };
};
