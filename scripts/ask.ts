import "dotenv/config";
import { retrieveTopChunks } from "@/lib/retrieval/pipeline";
import { generateGroundedAnswer } from "@/lib/generation/pipeline";
import { formatTimestamp } from "@/lib/utils";

/**
 * CLI entry point for the full retrieval + generation flow (Phases 3 & 4).
 * Usage: npm run ask -- "<question>" [courseSlug]
 */
async function main(): Promise<void> {
  const [question, courseSlug] = process.argv.slice(2);
  if (!question) {
    throw new Error('Usage: npm run ask -- "<question>" [courseSlug]');
  }

  const { chunks } = await retrieveTopChunks(question, { courseSlug });
  const result = await generateGroundedAnswer(question, chunks);

  console.log(`Question: ${result.question}\n`);
  console.log(`Answer:\n${result.answer}\n`);

  console.log(`Citation validation: ${result.validation.isValid ? "valid" : "INVALID"}`);
  if (result.validation.invalidIndexes.length > 0) {
    console.log(`  Hallucinated marker(s): ${result.validation.invalidIndexes.join(", ")}`);
  }

  console.log(`\nSources cited (${result.citations.length}):`);
  result.citations.forEach((citation) => {
    const { course, module, lesson, startMs, endMs } = citation.metadata;
    console.log(
      `  [${citation.index}] ${course} > ${module} > ${lesson} (${formatTimestamp(startMs)}-${formatTimestamp(endMs)})`
    );
  });
}

main().catch((error) => {
  console.error("Ask failed:", error);
  process.exitCode = 1;
});
