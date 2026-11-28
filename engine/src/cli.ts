import { analyzeUrl, AnalyzeError } from "./analyze.ts";

export async function main() {
  const inputUrl = process.argv[2];

  if (inputUrl === undefined) {
    process.exitCode = 1;
    return console.error("Missing URL. Usage: node src/cli.ts <url>");
  }

  try {
    const result = await analyzeUrl(inputUrl);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    process.exitCode = 1;
    console.error(error instanceof AnalyzeError ? error.message : `Error: ${error}`);
  }
}

if (import.meta.main) await main();
