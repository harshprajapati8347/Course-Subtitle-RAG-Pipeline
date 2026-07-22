import { NextResponse, type NextRequest } from "next/server";
import { runPipeline } from "@/lib/pipeline/run";
import type { AskRequest, AskResponse } from "@/types/api";

/** Runs the full LangGraph pipeline (Phase 5) for one question and returns a grounded, cited answer. */
export async function POST(request: NextRequest): Promise<NextResponse<AskResponse>> {
  const body = (await request.json()) as Partial<AskRequest>;
  const question = body.question?.trim();

  if (!question) {
    return NextResponse.json(
      { blocked: true, blockReason: "Question is required.", citations: [], isValidated: false },
      { status: 400 }
    );
  }

  try {
    const result = await runPipeline(question, { courseSlug: body.courseSlug });

    if (!result.guard?.passed) {
      return NextResponse.json({
        blocked: true,
        blockReason: result.guard?.reason ?? "Question was blocked.",
        citations: [],
        isValidated: false,
      });
    }

    return NextResponse.json({
      blocked: false,
      answer: result.answer ?? "",
      citations: result.citations ?? [],
      isValidated: result.validation?.isValid ?? false,
    });
  } catch (error) {
    console.error("Pipeline run failed:", error);
    return NextResponse.json(
      {
        blocked: true,
        blockReason: "Something went wrong while answering your question. Please try again.",
        citations: [],
        isValidated: false,
      },
      { status: 500 }
    );
  }
}
