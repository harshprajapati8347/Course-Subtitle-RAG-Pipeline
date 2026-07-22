/** A discovered lesson subtitle file, with metadata parsed from folder names. */
export interface LessonFile {
  course: string;
  courseSlug: string;
  module: string;
  moduleOrder: number;
  lesson: string;
  lessonOrder: number;
  filePath: string;
}
