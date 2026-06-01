import type { Page } from "playwright";

import { extractWikilocTrailIdFromUrl } from "./units";
import type { TrailListEntry } from "./types";

// Serialized to the browser via page.evaluate. Plain function-expression form
// (no arrow at top level) to avoid tsx's `__name` rewrite breaking inside the page.
const PARSE_SEARCH_SOURCE = `() => {
  const anchors = Array.from(document.querySelectorAll("a[href]"));
  const seen = {};
  const out = [];
  for (var i = 0; i < anchors.length; i++) {
    const anchor = anchors[i];
    const href = anchor.getAttribute("href");
    if (!href) continue;
    // Hiking-only: trail URL paths look like /hiking-trails/<slug>-<id>(/...|?...|#...)?.
    // Wikiloc has separate activity slugs (mountaineering-trails, running-trails, …)
    // — we explicitly reject anything other than hiking. The slug can contain
    // percent-encoded chars (apostrophes, accented letters) so we widen the class.
    const looksLikeTrail =
      /\\/hiking-trails\\/[a-z0-9%-]+-\\d+(?:[/?#]|$)/i.test(href) &&
      !/download-(gpx|kml)/i.test(href);
    if (!looksLikeTrail) continue;
    let absolute;
    if (href.indexOf("http") === 0) absolute = href;
    else if (href.indexOf("//") === 0) absolute = "https:" + href;
    else absolute = "https://www.wikiloc.com" + href;
    if (seen[absolute]) continue;
    seen[absolute] = true;
    const title = (anchor.textContent || "").trim();
    if (!title) continue;
    out.push({ url: absolute, title: title });
  }
  return out;
}`;

export const parseSearchResults = async (
  page: Page,
  limit: number,
): Promise<TrailListEntry[]> => {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(`return (${PARSE_SEARCH_SOURCE})`)() as () => {
    url: string;
    title: string;
  }[];
  const raw = await page.evaluate(fn);

  const entries: TrailListEntry[] = [];
  for (const { url, title } of raw) {
    const id = extractWikilocTrailIdFromUrl(url);
    if (!id) continue;
    entries.push({ externalId: id, url, title });
    if (entries.length >= limit) break;
  }
  return entries;
};
