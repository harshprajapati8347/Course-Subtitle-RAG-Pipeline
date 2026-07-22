import "dotenv/config";
import path from "path";
import { runIngestion } from "@/lib/ingestion/pipeline";
import { listAvailableCourses } from "@/lib/ingestion/discover";

/**
 * CLI entry point for ingestion.
 * Usage: npm run ingest -- "<course name>" [lessonLimit]
 * If no course name is given, the first course found under `courses/` is used.
 */
async function main(): Promise<void> {
  const coursesRootDir = path.join(process.cwd(), "courses");
  const [courseArg, lessonLimitArg] = process.argv.slice(2);

  const courseName =
    courseArg ?? (await listAvailableCourses(coursesRootDir))[0];
  if (!courseName) {
    throw new Error(`No course found under ${coursesRootDir}`);
  }

  const lessonLimit = lessonLimitArg ? parseInt(lessonLimitArg, 10) : undefined;

  console.log(
    `Ingesting course "${courseName}"${lessonLimit ? ` (limit: ${lessonLimit} lessons)` : ""}...`
  );

  const summary = await runIngestion({
    coursesRootDir,
    courseName,
    lessonLimit,
  });

  console.log("Ingestion complete:");
  console.log(`  Course slug:     ${summary.courseSlug}`);
  console.log(`  Lessons scanned: ${summary.totalLessons}`);
  console.log(`  Chunks indexed:  ${summary.totalChunks}`);
  if (summary.skippedLessons.length > 0) {
    console.log(
      `  Skipped lessons (no cues found): ${summary.skippedLessons.length}`
    );
    summary.skippedLessons.forEach((file) => console.log(`    - ${file}`));
  }
}

main().catch((error) => {
  console.error("Ingestion failed:", error);
  process.exitCode = 1;
});
