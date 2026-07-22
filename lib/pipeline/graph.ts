import { StateGraph, START, END } from "@langchain/langgraph";
import { PipelineStateAnnotation, type PipelineState } from "@/lib/pipeline/state";
import { guardNode } from "@/lib/pipeline/nodes/guard";
import { rewriteNode } from "@/lib/pipeline/nodes/rewrite";
import { expandNode } from "@/lib/pipeline/nodes/expand";
import { retrieveNode } from "@/lib/pipeline/nodes/retrieve";
import { rerankNode } from "@/lib/pipeline/nodes/rerank";
import { contextNode } from "@/lib/pipeline/nodes/context";
import { generateNode } from "@/lib/pipeline/nodes/generate";
import { validateNode } from "@/lib/pipeline/nodes/validate";

/** Max total generation attempts (1 initial + retries) before giving up on fixing invalid citations. */
const MAX_GENERATION_ATTEMPTS = 3;

/**
 * Node names are suffixed with `Node` so they never collide with the
 * identically-named state channels they populate (e.g. `guard`, the
 * state field, vs `guardNode`, the node that sets it).
 */

/** Blocked questions skip straight to END instead of entering the retrieval/generation flow. */
function routeAfterGuard(state: PipelineState): "rewriteNode" | typeof END {
  return state.guard?.passed ? "rewriteNode" : END;
}

/** Loops back to generate when citations are hallucinated, up to a fixed attempt cap. */
function routeAfterValidate(state: PipelineState): "generateNode" | typeof END {
  const isValid = state.validation?.isValid ?? true;
  const attempts = state.retryCount ?? 0;
  return !isValid && attempts < MAX_GENERATION_ATTEMPTS ? "generateNode" : END;
}

function buildPipelineGraph() {
  return new StateGraph(PipelineStateAnnotation)
    .addNode("guardNode", guardNode)
    .addNode("rewriteNode", rewriteNode)
    .addNode("expandNode", expandNode)
    .addNode("retrieveNode", retrieveNode)
    .addNode("rerankNode", rerankNode)
    .addNode("contextNode", contextNode)
    .addNode("generateNode", generateNode)
    .addNode("validateNode", validateNode)
    .addEdge(START, "guardNode")
    .addConditionalEdges("guardNode", routeAfterGuard)
    .addEdge("rewriteNode", "expandNode")
    .addEdge("expandNode", "retrieveNode")
    .addEdge("retrieveNode", "rerankNode")
    .addEdge("rerankNode", "contextNode")
    .addEdge("contextNode", "generateNode")
    .addEdge("generateNode", "validateNode")
    .addConditionalEdges("validateNode", routeAfterValidate)
    .compile();
}

let compiledGraph: ReturnType<typeof buildPipelineGraph> | null = null;

/** Returns the compiled LangGraph pipeline, built lazily once and reused across calls. */
export function getPipelineGraph() {
  if (!compiledGraph) {
    compiledGraph = buildPipelineGraph();
  }
  return compiledGraph;
}
