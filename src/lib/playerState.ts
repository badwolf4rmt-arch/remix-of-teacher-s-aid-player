import type { FormDraft } from "./catalogs";
import {
  DEFAULT_PROMPT_STAGE1,
  DEFAULT_PROMPT_STAGE2,
  DEFAULT_PROMPT_STAGE3,
} from "./defaultPrompts";

export type ModelId = "claude" | "gemini";

export type PromptSettings = {
  stage1: string;
  stage2: string;
  stage3: string;
};

export const DEFAULT_PROMPTS: PromptSettings = {
  stage1: DEFAULT_PROMPT_STAGE1,
  stage2: DEFAULT_PROMPT_STAGE2,
  stage3: DEFAULT_PROMPT_STAGE3,
};

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
    const stored = JSON.parse(raw) as Partial<PromptSettings>;
    return {
      stage1: stored.stage1?.trim() ? stored.stage1 : DEFAULT_PROMPTS.stage1,
      stage2: stored.stage2?.trim() ? stored.stage2 : DEFAULT_PROMPTS.stage2,
      stage3: stored.stage3?.trim() ? stored.stage3 : DEFAULT_PROMPTS.stage3,
    };
  } catch {
    return DEFAULT_PROMPTS;
  }
}
export function savePrompts(v: PromptSettings) {
  if (typeof window !== "undefined") localStorage.setItem(PROMPTS_KEY, JSON.stringify(v));
}
