type BriefItem = string | { item?: string } | Record<string, unknown>;

function itemsToLines(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return (arr as BriefItem[])
    .map((el) => {
      if (typeof el === "string") return el.trim();
      if (el && typeof el === "object") {
        const values = Object.values(el).filter((v) => typeof v === "string") as string[];
        return values.join(" ").trim();
      }
      return "";
    })
    .filter(Boolean);
}

/**
 * Normalizes the stage-2 output (JSON with imageBrief + imageRequest)
 * into a readable block that is injected into the stage-3 prompt.
 */
export function buildBriefBlock(raw: string): string {
  const cleaned = (raw ?? "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return cleaned;
  }
  const brief = (parsed.imageBrief ?? parsed) as Record<string, unknown>;
  const request = parsed.imageRequest as { content?: string } | undefined;
  const str = (k: string) => String(brief[k] ?? "").trim();

  const lines = [
    `imageType: ${str("imageType")}`,
    `imageTypeReason: ${str("imageTypeReason")}`,
    `peoplePolicy: ${str("peoplePolicy")}`,
    `mainScene: ${str("mainScene")}`,
    `mainSubject: ${str("mainSubject")}`,
    `location: ${str("location") || "—"}`,
    `atmosphere: ${str("atmosphere")}`,
    "mustShow:",
    ...itemsToLines(brief.mustShow).map((l) => `- ${l}`),
    "mustNotShow:",
    ...itemsToLines(brief.mustNotShow).map((l) => `- ${l}`),
    `motivationGoal: ${str("motivationGoal")}`,
  ];

  const content = (request?.content ?? "").trim();
  if (content) {
    lines.push("", "imageRequest.content:", content);
  }
  return lines.join("\n");
}
