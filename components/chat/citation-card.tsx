import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/utils";
import type { Citation } from "@/types/generation";

/** A small card showing where a `[n]` citation marker in an answer came from. */
export function CitationCard({ citation }: { citation: Citation }) {
  const { course, module, lesson, startMs, endMs } = citation.metadata;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
      <Badge variant="secondary" className="mt-0.5">
        {citation.index}
      </Badge>
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-foreground">{lesson}</span>
        <span className="text-xs text-muted-foreground">
          {course} · {module} · {formatTimestamp(startMs)}–{formatTimestamp(endMs)}
        </span>
      </div>
    </div>
  );
}
