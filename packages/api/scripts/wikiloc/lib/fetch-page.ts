import type { Browser, BrowserContext, Page } from "playwright";
import { chromium } from "playwright";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/130.0.0.0 Safari/537.36";

export type BrowserSession = {
  browser: Browser;
  context: BrowserContext;
};

export const openBrowser = async (): Promise<BrowserSession> => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: "en-US",
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
    viewport: { width: 1280, height: 900 },
  });
  return { browser, context };
};

export const closeBrowser = async (session: BrowserSession): Promise<void> => {
  await session.context.close();
  await session.browser.close();
};

export const openPage = async (
  session: BrowserSession,
  url: string,
): Promise<Page> => {
  const page = await session.context.newPage();
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  if (!response) throw new Error(`No response for ${url}`);
  if (response.status() === 403) {
    throw new Error(`403 Forbidden for ${url} — Wikiloc blocked the request`);
  }
  if (response.status() >= 400) {
    throw new Error(`HTTP ${response.status()} for ${url}`);
  }
  return page;
};

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const jitteredDelay = async (
  baseMs: number,
  jitterMs: number,
): Promise<void> => {
  const extra = Math.floor(Math.random() * jitterMs);
  await sleep(baseMs + extra);
};
