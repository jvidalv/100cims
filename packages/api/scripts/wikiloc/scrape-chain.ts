/**
 * Run multiple challenge scrapes back-to-back. Each selector is processed
 * sequentially; resume-by-existsSync skips mountains already on disk so
 * overlap between challenges (e.g. Aneto appears in 100 Cims, Sostres
 * Comarcals, Techos Provinciales, and Aragón) costs nothing extra.
 *
 * Usage:
 *   yarn tsx packages/api/scripts/wikiloc/scrape-chain.ts \
 *     challenge:sostres-comarcals challenge:techos-provinciales challenge:aragon
 *
 * After each selector finishes the chain continues to the next. A `--retry-
 * failures` pass runs at the very end so anything that errored mid-chain
 * gets one automatic retry.
 */
import { config as loadDotenv } from "dotenv";
import { spawn } from "child_process";
import { resolve } from "path";

loadDotenv({ path: resolve(__dirname, "../../.env.local") });

const scriptPath = resolve(__dirname, "scrape.ts");
const tsxPath = resolve(__dirname, "../../../../node_modules/tsx/dist/cli.mjs");

const runOne = (args: string[]): Promise<number> =>
  new Promise((resolveExit) => {
    console.log(`\n=========== scrape ${args.join(" ")} ===========\n`);
    const child = spawn("node", [tsxPath, scriptPath, ...args], {
      stdio: "inherit",
    });
    child.on("exit", (code) => resolveExit(code ?? 0));
  });

const main = async (): Promise<void> => {
  const selectors = process.argv.slice(2);
  if (selectors.length === 0) {
    console.error(
      "usage: scrape-chain.ts <selector> [<selector> ...]",
    );
    process.exit(1);
  }

  for (const selector of selectors) {
    const code = await runOne([selector]);
    if (code !== 0) {
      console.warn(
        `[chain] ${selector} exited with code ${code}; continuing to next selector anyway`,
      );
    }
  }

  // Final retry pass for anything that errored along the way.
  console.log("\n=========== final retry pass ===========\n");
  await runOne(["--retry-failures"]);
};

void main().catch((error) => {
  console.error("[chain] failure:", error);
  process.exit(1);
});
