import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Braces, Loader2, Maximize2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { PlayerToolbar } from "@/components/PlayerToolbar";
import { RegenerateDialog } from "@/components/RegenerateDialog";
import { EvaluationPanel } from "@/components/EvaluationPanel";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  DEFAULT_PROMPTS,
  loadModel,
  loadParams,
  loadPrompts,
  loadUser,
  saveModel,
  saveUser,
  type ModelId,
  type PromptSettings,
} from "@/lib/playerState";
import { TASK_FORMATS, type FormDraft, type TaskFormat } from "@/lib/catalogs";
import {
  generateImage,
  generateImageBrief,
  generateTask,
} from "@/lib/generation.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/player")({
  ssr: false,
  head: () => ({ meta: [{ title: "Плеер контента — стенд" }] }),
  component: PlayerPage,
});

type Stage = "idle" | "task" | "brief" | "image" | "done" | "error";

function PlayerPage() {
  const [userName, setUserName] = useState("");
  const [model, setModel] = useState<ModelId>("claude");
  const [prompts, setPrompts] = useState<PromptSettings>(DEFAULT_PROMPTS);
  const [params, setParams] = useState<FormDraft | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);

  const [stage, setStage] = useState<Stage>("idle");
  const [taskContent, setTaskContent] = useState("");
  const [taskTitle, setTaskTitle] = useState("");

  const [notesContent, setNotesContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [rawStage1, setRawStage1] = useState("");
  const [rawStage2, setRawStage2] = useState("");
  const [reqStage1, setReqStage1] = useState("");
  const [reqStage2, setReqStage2] = useState("");
  const [reqStage3, setReqStage3] = useState("");
  const [jsonOpen, setJsonOpen] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);
  const [costTask, setCostTask] = useState<number | null>(null);
  const [costBrief, setCostBrief] = useState<number | null>(null);
  const [costImage, setCostImage] = useState<number | null>(null);
  const [displayFormat, setDisplayFormat] = useState<string>("");
  const [lastFormatId, setLastFormatId] = useState<TaskFormat>("any");

  const genTask = useServerFn(generateTask);
  const genBrief = useServerFn(generateImageBrief);
  const genImage = useServerFn(generateImage);

  const startedRef = useRef(false);

  const runPipeline = useCallback(
    async (p: FormDraft, m: ModelId, pr: PromptSettings, overrides?: Partial<FormDraft> & { additionalRequest?: string }) => {
      setStageError(null);
      setTaskContent("");
      setTaskTitle("");
      setNotesContent("");
      setImageUrl(null);
      setRawStage1("");
      setRawStage2("");
      setReqStage1("");
      setReqStage2("");
      setReqStage3("");
      setCostTask(null);
      setCostBrief(null);
      setCostImage(null);
      const effective: FormDraft = { ...p, ...(overrides ?? {}) };
      setLastFormatId(effective.format);
      try {
        setStage("task");
        const t = await genTask({
          data: {
            systemPrompt: pr.stage1,
            model: m,
            subject: effective.subject,
            grade: effective.grade,
            topic: effective.topic,
            format: TASK_FORMATS.find((f) => f.id === effective.format)?.label ?? "любой",
            additionalRequest: effective.additionalRequest,
          },
        });
        setTaskContent(t.task);
        setTaskTitle(t.title ?? "");
        setNotesContent(t.notes);
        setRawStage1(t.raw ?? "");
        setReqStage1(t.request ?? "");
        const cTask = t.usage?.cost ?? null;
        setCostTask(cTask);
        // If user selected "any", surface AI-returned task_format
        const chosenLabel =
          effective.format === "any"
            ? (t.taskFormat || "Мотивирующее задание")
            : (TASK_FORMATS.find((f) => f.id === effective.format)?.label ?? "");
        setDisplayFormat(chosenLabel);

        let briefText = "";
        let finalImageUrl: string | null = null;
        let cBrief: number | null = null;
        let cImage: number | null = null;

        if (effective.withIllustration) {
          setStage("brief");
          const b = await genBrief({
            data: {
              systemPrompt: pr.stage2,
              subject: effective.subject,
              grade: effective.grade,
              topic: effective.topic,
              taskFormat: chosenLabel || "любой",
              studentTask: t.task,
            },
          });
          briefText = b.brief ?? "";
          setRawStage2(briefText);
          setReqStage2(b.request ?? "");
          cBrief = b.usage?.cost ?? null;
          setCostBrief(cBrief);

          setStage("image");
          const img = await genImage({
            data: {
              systemPrompt: pr.stage3,
              imageBrief: b.brief,
              additionalRequest: effective.additionalRequest,
            },
          });
          setReqStage3(img.request ?? "");
          finalImageUrl = img.imageUrl;
          setImageUrl(finalImageUrl);
          cImage = img.usage?.cost ?? null;
          setCostImage(cImage);
        }

        setStage("done");

        const total =
          (cTask ?? 0) + (cBrief ?? 0) + (cImage ?? 0);

        // Auto-save the generation
        try {
          await supabase.from("generations" as never).insert({
            user_name: loadUser() || null,
            model: m,
            params: effective as unknown as Record<string, unknown>,
            task_format: t.taskFormat || null,
            task_title: t.title || null,
            task_content: t.task,
            teacher_notes: t.notes,
            raw_stage1: t.raw ?? null,
            image_brief: briefText || null,
            image_url: finalImageUrl,
            cost_task: cTask,
            cost_brief: cBrief,
            cost_image: cImage,
            cost_total: total || null,
            tokens_task: t.usage ?? null,
            tokens_brief: null,
            tokens_image: null,
          } as never);
        } catch (saveErr) {
          console.error("Failed to save generation", saveErr);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setStageError(msg);
        setStage("error");
        toast.error("Ошибка генерации", { description: msg.slice(0, 200) });
      }
    },
    [genTask, genBrief, genImage],
  );

  useEffect(() => {
    setUserName(loadUser());
    const m = loadModel();
    const pr = loadPrompts();
    const p = loadParams();
    setModel(m);
    setPrompts(pr);
    setParams(p);
    if (p && !startedRef.current) {
      startedRef.current = true;
      void runPipeline(p, m, pr);
    }
  }, [runPipeline]);

  const handleRegenerate = (opts: { format: TaskFormat; withIllustration: boolean; additionalRequest: string }) => {
    if (!params) return;
    setRegenOpen(false);
    const wrapped = [
      "Сгенерируй новое задание по тем же параметрам в указанном формате. Тему, предмет и параллели сохрани. Соблюдай структуру формата из системного промпта.",
      "",
      "Организацию работы (индивидуально, в парах или в группах) определи самостоятельно по выбранному формату задания, возрасту и содержанию. Встрой это в инструкцию ученику, не выводи отдельным полем.",
      "",
      `Дополнительный запрос: ${opts.additionalRequest || "—"}`,
      "",
      "Режим: перегенерация",
      "",
      "Предыдущее задание используй только как контекст, при необходимости измени формат.",
    ].join("\n");
    void runPipeline(params, model, prompts, { ...opts, additionalRequest: wrapped });
  };

  const formatLabel =
    displayFormat ||
    TASK_FORMATS.find((f) => f.id === (lastFormatId ?? params?.format))?.label ||
    "";
  const busy = stage === "task" || stage === "brief" || stage === "image";
  const totalCost =
    (costTask ?? 0) + (costBrief ?? 0) + (costImage ?? 0);
  const anyCost = costTask != null || costBrief != null || costImage != null;
  const fmtUsd = (v: number) =>
    v >= 0.01 ? `$${v.toFixed(3)}` : `$${v.toFixed(4)}`;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        userName={userName}
        onUserChange={(v) => { setUserName(v); saveUser(v); }}
      />

      <PlayerToolbar />

      <main className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="min-w-0">
            <div className="mb-4 flex items-center gap-4 border-b border-border/60 pb-4 text-sm">
              <span className="text-muted-foreground">{params?.subject || "Предмет"}</span>
              <span className="text-muted-foreground">
                {params?.grade ? `${params.grade} параллель` : "Параллель"}
              </span>
            </div>

            <h1 className="mb-6 text-3xl font-semibold text-foreground">
              {params?.topic || taskTitle || "Тема задания"}
            </h1>

            <div className="relative rounded-2xl border-2 border-primary/40 bg-card p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--surface-lavender)] px-3 py-1 text-xs font-medium text-primary">
                  Мотивирующее задание
                </span>
                {formatLabel && (
                  <span className="rounded-full bg-[var(--surface-lavender)] px-3 py-1 text-xs font-medium text-primary">
                    {formatLabel}
                  </span>
                )}

                {anyCost && (
                  <span
                    className="ml-auto rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                    title={`Задание: ${fmtUsd(costTask ?? 0)} • Бриф: ${fmtUsd(costBrief ?? 0)} • Картинка: ${fmtUsd(costImage ?? 0)}`}
                  >
                    Стоимость: {fmtUsd(totalCost)}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${anyCost ? "" : "ml-auto"} gap-2 rounded-lg text-muted-foreground hover:bg-muted`}
                  onClick={() => setJsonOpen(true)}
                  disabled={!rawStage1 && !rawStage2}
                >
                  <Braces className="h-4 w-4" />
                  Показать чистый JSON
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-lg text-muted-foreground hover:bg-muted"
                  onClick={() => setRegenOpen(true)}
                  disabled={busy}
                >
                  <RefreshCw className="h-4 w-4" />
                  Перегенерировать
                </Button>
              </div>

              {imageUrl && (
                <div className="relative mb-4 group">
                  <img
                    src={imageUrl}
                    alt="Иллюстрация к заданию"
                    className="w-full cursor-zoom-in rounded-xl border border-border/60"
                    onClick={() => setImageOpen(true)}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute right-2 top-2 h-8 w-8 rounded-lg opacity-90 shadow"
                    onClick={() => setImageOpen(true)}
                    aria-label="Открыть на весь экран"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {stage === "task" && <StageLoader label="Генерирую задание и заметки…" />}
              {stage === "brief" && taskContent && (
                <>
                  <MarkdownContent content={taskContent} />
                  <StageLoader label="Составляю бриф иллюстрации…" />
                </>
              )}
              {stage === "image" && taskContent && (
                <>
                  <MarkdownContent content={taskContent} />
                  <StageLoader label="Рисую иллюстрацию…" />
                </>
              )}
              {(stage === "done" || stage === "error") && taskContent && (
                <MarkdownContent content={taskContent} />
              )}
              {stage === "error" && !taskContent && (
                <p className="text-sm text-destructive">{stageError}</p>
              )}
              {stage === "idle" && !params && (
                <p className="text-sm text-muted-foreground">
                  Задайте параметры на главной, чтобы запустить генерацию.
                </p>
              )}
            </div>
          </section>

          <aside className="min-w-0">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Заметки для учителя</h2>
              {notesContent ? (
                <MarkdownContent content={notesContent} />
              ) : stage === "task" ? (
                <StageLoader label="Ожидание…" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Заметки появятся после генерации задания.
                </p>
              )}
            </div>
          </aside>
        </div>
      </main>

      <RegenerateDialog
        key={`regen-${lastFormatId}-${regenOpen}`}
        open={regenOpen}
        onOpenChange={setRegenOpen}
        defaultFormat={lastFormatId}
        defaultWithIllustration={params?.withIllustration ?? true}
        onSubmit={handleRegenerate}
      />

      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="max-w-[95vw] border-0 bg-black/95 p-2 sm:max-w-[95vw]">
          <VisuallyHidden>
            <DialogTitle>Иллюстрация к заданию</DialogTitle>
          </VisuallyHidden>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Иллюстрация к заданию"
              className="mx-auto max-h-[90vh] w-auto max-w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <DialogContent className="max-w-4xl">
          <DialogTitle>Дата-контракт по этапам</DialogTitle>
          <Tabs defaultValue="s1-in" className="mt-4">
            <TabsList className="flex h-auto flex-wrap justify-start gap-1">
              <TabsTrigger value="s1-in">1 · Вход</TabsTrigger>
              <TabsTrigger value="s1-out">1 · Выход</TabsTrigger>
              <TabsTrigger value="s2-in">2 · Вход</TabsTrigger>
              <TabsTrigger value="s2-out">2 · Выход</TabsTrigger>
              <TabsTrigger value="s3-in">3 · Вход</TabsTrigger>
              <TabsTrigger value="s3-out">3 · Выход</TabsTrigger>
            </TabsList>
            <div className="mt-4 max-h-[70vh] overflow-y-auto">
              <TabsContent value="s1-in">
                <JsonBlock label="Запрос к модели этапа 1 (system + user + схема)" value={reqStage1} />
              </TabsContent>
              <TabsContent value="s1-out">
                <JsonBlock label="Ответ этапа 1 — задание и заметки" value={rawStage1} />
              </TabsContent>
              <TabsContent value="s2-in">
                <JsonBlock label="Запрос к модели этапа 2 (system + user + схема)" value={reqStage2} />
              </TabsContent>
              <TabsContent value="s2-out">
                <JsonBlock label="Ответ этапа 2 — бриф на картинку" value={rawStage2} />
              </TabsContent>
              <TabsContent value="s3-in">
                <JsonBlock label="Запрос к модели этапа 3 (финальный промпт с брифом)" value={reqStage3} />
              </TabsContent>
              <TabsContent value="s3-out">
                <JsonBlock label="Ответ этапа 3 — ссылка на изображение" value={imageUrl ?? ""} />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StageLoader({ label }: { label: string }) {
  return (
    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function formatMaybeJson(s: string) {
  const trimmed = (s ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  if (!trimmed) return "";
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return trimmed;
  }
}

function JsonBlock({ label, value }: { label: string; value: string }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{label}</h3>
      <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground">
{formatMaybeJson(value) || "— пусто —"}
      </pre>
    </section>
  );
}
