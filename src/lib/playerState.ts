import type { FormDraft } from "./catalogs";

export type ModelId = "claude" | "gemini";

export type PromptSettings = {
  stage1: string; // задание и заметки
  stage2: string; // запрос на изображение
  stage3: string; // генерация изображения
};

export const DEFAULT_PROMPTS: PromptSettings = { stage1: "", stage2: "", stage3: "" };

const PARAMS_KEY = "player.params";
const USER_KEY = "player.user";
const MODEL_KEY = "player.model";
const PROMPTS_KEY = "player.prompts";

export function saveParams(params: FormDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PARAMS_KEY, JSON.stringify(params));
}

export function loadParams(): FormDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PARAMS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FormDraft;
  } catch {
    return null;
  }
}

export function loadUser(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(USER_KEY) ?? "";
}
export function saveUser(v: string) {
  if (typeof window !== "undefined") localStorage.setItem(USER_KEY, v);
}

export function loadModel(): ModelId {
  if (typeof window === "undefined") return "claude";
  return (localStorage.getItem(MODEL_KEY) as ModelId) || "claude";
}
export function saveModel(v: ModelId) {
  if (typeof window !== "undefined") localStorage.setItem(MODEL_KEY, v);
}

export function loadPrompts(): PromptSettings {
  if (typeof window === "undefined") return DEFAULT_PROMPTS;
  const raw = localStorage.getItem(PROMPTS_KEY);
  if (!raw) return DEFAULT_PROMPTS;
  try {
    return { ...DEFAULT_PROMPTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROMPTS;
  }
}
export function savePrompts(v: PromptSettings) {
  if (typeof window !== "undefined") localStorage.setItem(PROMPTS_KEY, JSON.stringify(v));
}
