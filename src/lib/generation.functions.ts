import { createServerFn } from "@tanstack/react-start";
import { buildBriefBlock } from "./generation.server";


const OR_URL = "https://openrouter.ai/api/v1/chat/completions";

type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost?: number;
};

async function callOpenRouter(body: Record<string, unknown>) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("Missing OPENROUTER_API_KEY");
  const r = await fetch(OR_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://lovable.dev",
      "X-Title": "Motivation Task Stand",
    },
    body: JSON.stringify({ ...body, usage: { include: true } }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`OpenRouter ${r.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

function extractUsage(res: unknown): Usage {
  const u = (res as { usage?: Usage })?.usage ?? {};
  return {
    prompt_tokens: u.prompt_tokens,
    completion_tokens: u.completion_tokens,
    total_tokens: u.total_tokens,
    cost: typeof u.cost === "number" ? u.cost : undefined,
  };
}

type GenTaskInput = {
  systemPrompt: string;
  model: "claude" | "gemini";
  subject: string;
  grade: string;
  topic: string;
  format: string;
  additionalRequest: string;
};

export const generateTask = createServerFn({ method: "POST" })
  .inputValidator((d: GenTaskInput) => d)
  .handler(async ({ data }) => {
    const model =
      data.model === "gemini" ? "google/gemini-2.5-flash" : "anthropic/claude-sonnet-4.5";
    const formatLabel = data.format || "";
    const sys = data.systemPrompt
      .replaceAll("{{subject}}", data.subject)
      .replaceAll("{{grades}}", data.grade)
      .replaceAll("{{grade}}", data.grade)
      .replaceAll("{{topic}}", data.topic)
      .replaceAll("{{title}}", data.topic)
      .replaceAll("{{taskFormat}}", formatLabel)
      .replaceAll("{{teacherRequest}}", data.additionalRequest || "")
      .replaceAll("{{additionalRequest}}", data.additionalRequest || "");
    const userMsg = [
      `Предмет: ${data.subject}`,
      `Параллели: ${data.grade}`,
      `Тема: ${data.topic}`,
      `Формат задания: ${formatLabel || "не указан — выбери сам"}`,
      `Важно учесть: ${data.additionalRequest || "—"}`,
      "",
      "Сгенерируй задание строго по инструкции. Верни только JSON заданной схемы.",
    ].join("\n");
    const requestBody = {
      model,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "task_generation_output",
          strict: true,
          schema: {
            type: "object",
            properties: {
              task_format: { type: "string" },
              task: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                },
                required: ["title", "content"],
                additionalProperties: false,
              },
              teacher_notes: { type: "string" },
            },
            required: ["task_format", "task", "teacher_notes"],
            additionalProperties: false,
          },
        },
      },
    };
    const res = await callOpenRouter(requestBody);
    const full: string = res?.choices?.[0]?.message?.content ?? "";
    const cleaned = full.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    let task = "";
    let notes = "";
    let taskFormat = "";
    let title = "";
    try {
      const parsed = JSON.parse(cleaned);
      taskFormat = String(parsed.task_format ?? "").trim();
      title = String(parsed?.task?.title ?? "").trim();
      task = String(parsed?.task?.content ?? "").trim();
      notes = String(parsed?.teacher_notes ?? "").trim();
    } catch {
      const [t, n] = cleaned.split(/---TEACHER-NOTES---/i);
      task = (t || cleaned).trim();
      notes = (n || "").trim();
    }
    return {
      task: task || "_Модель вернула пустое задание._",
      notes: notes || "_Заметки для учителя не были возвращены моделью._",
      taskFormat,
      title,
      raw: full,
      request: JSON.stringify(requestBody, null, 2),
      usage: extractUsage(res),
    };
  });


type GenBriefInput = {
  systemPrompt: string;
  subject: string;
  grade: string;
  topic: string;
  taskFormat: string;
  studentTask: string;
};

export const generateImageBrief = createServerFn({ method: "POST" })
  .inputValidator((d: GenBriefInput) => d)
  .handler(async ({ data }) => {
    const sys = data.systemPrompt
      .replaceAll("{{subject}}", data.subject)
      .replaceAll("{{topic}}", data.topic)
      .replaceAll("{{grades}}", data.grade)
      .replaceAll("{{grade}}", data.grade)
      .replaceAll("{{title}}", data.topic)
      .replaceAll("{{taskFormat}}", data.taskFormat || "любой")
      .replaceAll("{{studentTask}}", data.studentTask);
    const strItem = {
      type: "object",
      properties: { item: { type: "string" } },
      required: ["item"],
      additionalProperties: false,
    } as const;
    const res = await callOpenRouter({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: "Сформируй imageBrief по инструкции. Верни только JSON." },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "image_brief",
          strict: true,
          schema: {
            type: "object",
            properties: {
              imageBrief: {
                type: "object",
                properties: {
                  imageType: { type: "string" },
                  imageTypeReason: { type: "string" },
                  peoplePolicy: { type: "string" },
                  mainScene: { type: "string" },
                  mainSubject: { type: "string" },
                  location: { type: "string" },
                  atmosphere: { type: "string" },
                  mustShow: { type: "array", items: strItem },
                  mustNotShow: { type: "array", items: strItem },
                  motivationGoal: { type: "string" },
                },
                required: [
                  "imageType",
                  "imageTypeReason",
                  "peoplePolicy",
                  "mainScene",
                  "mainSubject",
                  "location",
                  "atmosphere",
                  "mustShow",
                  "mustNotShow",
                  "motivationGoal",
                ],
                additionalProperties: false,
              },
              imageRequest: {
                type: "object",
                properties: { content: { type: "string" } },
                required: ["content"],
                additionalProperties: false,
              },
            },
            required: ["imageBrief", "imageRequest"],
            additionalProperties: false,
          },
        },
      },
    });
    const content: string = res?.choices?.[0]?.message?.content ?? "{}";
    return { brief: content.trim(), usage: extractUsage(res) };
  });


type GenImageInput = {
  systemPrompt: string;
  imageBrief: string;
  additionalRequest: string;
};

export const generateImage = createServerFn({ method: "POST" })
  .inputValidator((d: GenImageInput) => d)
  .handler(async ({ data }) => {
    const briefBlock = buildBriefBlock(data.imageBrief);
    const prompt = data.systemPrompt
      .replaceAll("{{imageBrief}}", briefBlock)
      .replaceAll("{{additionalRequest}}", data.additionalRequest || "—");

    const res = await callOpenRouter({
      model: "google/gemini-3.1-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    });
    const msg = res?.choices?.[0]?.message ?? {};
    const images: Array<{ image_url?: { url?: string } }> = msg.images ?? [];
    const url = images[0]?.image_url?.url;
    if (!url) {
      throw new Error("Модель не вернула изображение. " + (msg.content || "").slice(0, 300));
    }
    return { imageUrl: url, usage: extractUsage(res) };
  });
