import { createServerFn } from "@tanstack/react-start";

const OR_URL = "https://openrouter.ai/api/v1/chat/completions";

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
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`OpenRouter ${r.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
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
      data.model === "gemini" ? "google/gemini-2.5-pro" : "anthropic/claude-sonnet-4.5";
    const userMsg = [
      `Предмет: ${data.subject}`,
      `Класс/параллель: ${data.grade}`,
      `Тема: ${data.topic}`,
      `Формат задания: ${data.format || "любой"}`,
      `Дополнительный контекст: ${data.additionalRequest || "—"}`,
    ].join("\n");
    const res = await callOpenRouter({
      model,
      messages: [
        { role: "system", content: data.systemPrompt },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    });
    const full: string = res?.choices?.[0]?.message?.content ?? "";
    // Strip accidental code fences
    const cleaned = full.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    let task = "";
    let notes = "";
    let taskFormat = "";
    try {
      const parsed = JSON.parse(cleaned);
      taskFormat = String(parsed.task_format ?? "").trim();
      task = String(parsed?.task?.content ?? "").trim();
      notes = String(parsed?.teacher_notes ?? "").trim();
    } catch {
      // Fallback: legacy split
      const [t, n] = cleaned.split(/---TEACHER-NOTES---/i);
      task = (t || cleaned).trim();
      notes = (n || "").trim();
    }
    return {
      task: task || "_Модель вернула пустое задание._",
      notes: notes || "_Заметки для учителя не были возвращены моделью._",
      taskFormat,
      raw: full,
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
      .replaceAll("{{grade}}", data.grade)
      .replaceAll("{{title}}", data.topic)
      .replaceAll("{{taskFormat}}", data.taskFormat || "любой")
      .replaceAll("{{studentTask}}", data.studentTask);
    const res = await callOpenRouter({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: "Сформируй imageBrief по инструкции. Верни только JSON." },
      ],
      response_format: { type: "json_object" },
    });
    const content: string = res?.choices?.[0]?.message?.content ?? "{}";
    return { brief: content.trim() };
  });

type GenImageInput = {
  systemPrompt: string;
  imageBrief: string;
  additionalRequest: string;
};

export const generateImage = createServerFn({ method: "POST" })
  .inputValidator((d: GenImageInput) => d)
  .handler(async ({ data }) => {
    const prompt = data.systemPrompt
      .replaceAll("{{imageBrief}}", data.imageBrief)
      .replaceAll("{{additionalRequest}}", data.additionalRequest || "—");
    const res = await callOpenRouter({
      model: "google/gemini-3.1-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    });
    const msg = res?.choices?.[0]?.message ?? {};
    // OpenRouter returns generated images in message.images[].image_url.url as data URL
    const images: Array<{ image_url?: { url?: string } }> = msg.images ?? [];
    const url = images[0]?.image_url?.url;
    if (!url) {
      throw new Error("Модель не вернула изображение. " + (msg.content || "").slice(0, 300));
    }
    return { imageUrl: url };
  });
