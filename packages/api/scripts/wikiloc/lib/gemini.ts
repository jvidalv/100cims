import { z } from "zod";

const CandidateSchema = z.object({
  content: z
    .object({
      parts: z.array(z.object({ text: z.string() })).optional(),
    })
    .optional(),
  finishReason: z.string().optional(),
});

const ResponseSchema = z.object({
  candidates: z.array(CandidateSchema).min(1),
});

export type GeminiTextClient = {
  generateJson(args: { system: string; user: string }): Promise<unknown>;
};

export const createGeminiTextClient = (params: {
  readonly apiKey: string;
  readonly model: string;
}): GeminiTextClient => {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(params.model)}:generateContent`;
  return {
    async generateJson({ system, user }) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": params.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: {
            temperature: 0.3,
            // 5 trails × 3 languages × ~120 words ≈ 2.7k tokens for the
            // description rewrite; smaller for title rewrites. 8000 is well
            // under any pricing tier yet leaves headroom for JSON structure.
            maxOutputTokens: 8000,
            responseMimeType: "application/json",
            // Thinking tokens come out of the same budget as the visible
            // output. For structured rewrites we don't need reasoning, just
            // language transformation. Disable to keep token use predictable.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Gemini ${String(response.status)} ${response.statusText}: ${body.slice(0, 500)}`,
        );
      }
      const raw: unknown = await response.json();
      const parsed = ResponseSchema.safeParse(raw);
      if (!parsed.success) {
        throw new Error(
          `Gemini response did not match expected shape: ${parsed.error.message}`,
        );
      }
      const candidate = parsed.data.candidates[0];
      if (candidate === undefined) {
        throw new Error("Gemini returned no candidates");
      }
      const parts = candidate.content?.parts ?? [];
      const text = parts.map((p) => p.text).join("").trim();
      const finishReason = candidate.finishReason ?? "UNKNOWN";
      if (finishReason !== "STOP") {
        throw new Error(
          `Gemini truncated reply (finishReason=${finishReason}, ` +
            `text="${text.slice(0, 200)}…")`,
        );
      }
      if (text.length === 0) {
        throw new Error("Gemini returned empty text with STOP");
      }
      try {
        return JSON.parse(text) as unknown;
      } catch (error) {
        throw new Error(
          `Gemini returned non-JSON despite responseMimeType=application/json: ${
            error instanceof Error ? error.message : String(error)
          }; got: ${text.slice(0, 500)}`,
        );
      }
    },
  };
};
