import { readdir } from "fs/promises";
import path from "path";
import { parseModuleFolderName, parseLessonFolderName, slugify } from "@/lib/parser/metadata";
import type { LessonFile } from "@/types/course";

const SUBTITLE_EXTENSIONS = [".srt", ".vtt"];

async function listDirectories(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/** Finds the first subtitle file in a lesson folder, preferring .srt over .vtt. */
async function findSubtitleFile(lessonDir: string): Promise<string | null> {
  const entries = await readdir(lessonDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);

  for (const ext of SUBTITLE_EXTENSIONS) {
    const match = files.find((file) => file.toLowerCase().endsWith(ext));
    if (match) return path.join(lessonDir, match);
  }

  return null;
}

/** Lists course folder names available under the courses root directory. */
export async function listAvailableCourses(coursesRootDir: string): Promise<string[]> {
  return listDirectories(coursesRootDir);
}

/**
 * Walks `<coursesRootDir>/<courseName>/<module>/<lesson>/` and returns one
 * entry per lesson that has a parseable subtitle file. Lesson folders
 * without a .srt/.vtt file are skipped.
 */
export async function discoverLessons(
  coursesRootDir: string,
  courseName: string,
): Promise<LessonFile[]> {
  const courseDir = path.join(coursesRootDir, courseName);
  const moduleFolders = await listDirectories(courseDir);
  const lessons: LessonFile[] = [];

  for (let moduleIndex = 0; moduleIndex < moduleFolders.length; moduleIndex++) {
    const moduleFolder = moduleFolders[moduleIndex];
    const moduleMeta = parseModuleFolderName(moduleFolder, moduleIndex + 1);
    const moduleDir = path.join(courseDir, moduleFolder);
    const lessonFolders = await listDirectories(moduleDir);

    for (let lessonIndex = 0; lessonIndex < lessonFolders.length; lessonIndex++) {
      const lessonFolder = lessonFolders[lessonIndex];
      const lessonDir = path.join(moduleDir, lessonFolder);
      const filePath = await findSubtitleFile(lessonDir);
      if (!filePath) continue;

      const lessonMeta = parseLessonFolderName(lessonFolder, lessonIndex + 1);
      lessons.push({
        course: courseName,
        courseSlug: slugify(courseName),
        module: moduleMeta.title,
        moduleOrder: moduleMeta.order,
        lesson: lessonMeta.title,
        lessonOrder: lessonMeta.order,
        filePath,
      });
    }
  }

  return lessons;
}
