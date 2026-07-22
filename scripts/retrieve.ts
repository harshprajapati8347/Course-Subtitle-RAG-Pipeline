import "dotenv/config";
import { retrieveTopChunks } from "@/lib/retrieval/pipeline";

/**
 * CLI entry point for the Phase 3 retrieval pipeline.
 * Usage: npm run retrieve -- "<question>" [courseSlug]
 */
async function main(): Promise<void> {
  const [question, courseSlug] = process.argv.slice(2);
  if (!question) {
    throw new Error('Usage: npm run retrieve -- "<question>" [courseSlug]');
  }

  const result = await retrieveTopChunks(question, { courseSlug });

  console.log(`Original question: ${result.originalQuestion}`);
  console.log(`Rewritten query:   ${result.rewrittenQuery}`);
  console.log("Expanded queries:");
  result.expandedQueries.forEach((query) => console.log(`  - ${query}`));

  console.log(`\nTop ${result.chunks.length} chunks (after rerank):`);
  result.chunks.forEach((chunk, i) => {
    console.log(
      `\n${i + 1}. [score: ${chunk.score.toFixed(4)}] ${chunk.metadata.lesson} (${chunk.metadata.module})`
    );
    console.log(`   ${chunk.text.slice(0, 200)}...`);
  });
}

main().catch((error) => {
  console.error("Retrieval failed:", error);
  process.exitCode = 1;
});
