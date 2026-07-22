import "dotenv/config";
import { runPipeline } from "@/lib/pipeline/run";
import { formatTimestamp } from "@/lib/utils";

/**
 * CLI entry point for the full LangGraph-orchestrated pipeline (Phase 5).
 * Usage: npm run pipeline -- "<question>" [courseSlug]
 */
async function main(): Promise<void> {
  const [question, courseSlug] = process.argv.slice(2);
  if (!question) {
    throw new Error('Usage: npm run pipeline -- "<question>" [courseSlug]');
  }

  const result = await runPipeline(question, { courseSlug });

  if (!result.guard?.passed) {
    console.log(`Blocked by input guard: ${result.guard?.reason}`);
    return;
  }

  console.log(`Question:        ${result.question}`);
  console.log(`Rewritten query: ${result.rewrittenQuery}`);
  console.log("Expanded queries:");
  result.expandedQueries?.forEach((query) => console.log(`  - ${query}`));

  console.log(`\nAnswer (after ${result.retryCount} generation attempt(s)):\n${result.answer}\n`);

  console.log(`Citation validation: ${result.validation?.isValid ? "valid" : "INVALID"}`);
  if (result.validation && result.validation.invalidIndexes.length > 0) {
    console.log(`  Hallucinated marker(s): ${result.validation.invalidIndexes.join(", ")}`);
  }

  console.log(`\nSources cited (${result.citations?.length ?? 0}):`);
  result.citations?.forEach((citation) => {
    const { course, module, lesson, startMs, endMs } = citation.metadata;
    console.log(
      `  [${citation.index}] ${course} > ${module} > ${lesson} (${formatTimestamp(startMs)}-${formatTimestamp(endMs)})`
    );
  });
}

main().catch((error) => {
  console.error("Pipeline run failed:", error);
  process.exitCode = 1;
});
