import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Maximize2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { PlayerToolbar } from "@/components/PlayerToolbar";
import { RegenerateDialog } from "@/components/RegenerateDialog";
import { EvaluationPanel } from "@/components/EvaluationPanel";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  const [notesContent, setNotesContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  const genTask = useServerFn(generateTask);
  const genBrief = useServerFn(generateImageBrief);
  const genImage = useServerFn(generateImage);

  const startedRef = useRef(false);

  const runPipeline = useCallback(
    async (p: FormDraft, m: ModelId, pr: PromptSettings, overrides?: Partial<FormDraft> & { additionalRequest?: string }) => {
      setStageError(null);
      setTaskContent("");
      setNotesContent("");
      setImageUrl(null);
      const effective: FormDraft = { ...p, ...(overrides ?? {}) };
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
        setNotesContent(t.notes);

        if (!effective.withIllustration) {
          setStage("done");
          return;
        }

        setStage("brief");
        const b = await genBrief({
          data: {
            systemPrompt: pr.stage2,
            subject: effective.subject,
            grade: effective.grade,
            topic: effective.topic,
            taskFormat: TASK_FORMATS.find((f) => f.id === effective.format)?.label ?? "любой",
            studentTask: t.task,
          },
        });

        setStage("image");
        const img = await genImage({
          data: {
            systemPrompt: pr.stage3,
            imageBrief: b.brief,
            additionalRequest: effective.additionalRequest,
          },
        });
        setImageUrl(img.imageUrl);
        setStage("done");
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
    void runPipeline(params, model, prompts, opts);
  };

  const formatLabel = TASK_FORMATS.find((f) => f.id === params?.format)?.label || "Кейс";
  const busy = stage === "task" || stage === "brief" || stage === "image";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        userName={userName}
        onUserChange={(v) => { setUserName(v); saveUser(v); }}
        model={model}
        onModelChange={(v) => { setModel(v); saveModel(v); }}
        prompts={prompts}
        onPromptsChange={setPrompts}
      />

      <PlayerToolbar />

      <main className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,2fr)_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <EvaluationPanel
              userName={userName}
              model={model}
              params={params}
              taskContent={taskContent}
              teacherNotes={notesContent}
            />
          </aside>

          <section className="min-w-0">
            <div className="mb-4 flex items-center gap-4 border-b border-border/60 pb-4 text-sm">
              <span className="text-muted-foreground">{params?.subject || "Предмет"}</span>
              <span className="text-muted-foreground">
                {params?.grade ? `${params.grade} параллель` : "Параллель"}
              </span>
            </div>

            <h1 className="mb-6 text-3xl font-semibold text-foreground">
              {params?.topic || "Тема задания"}
            </h1>

            <div className="relative rounded-2xl border-2 border-primary/40 bg-card p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--surface-lavender)] px-3 py-1 text-xs font-medium text-primary">
                  Мотивирующее задание
                </span>
                <span className="rounded-full bg-[var(--surface-lavender)] px-3 py-1 text-xs font-medium text-primary">
                  {formatLabel}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto gap-2 rounded-lg text-muted-foreground hover:bg-muted"
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
        open={regenOpen}
        onOpenChange={setRegenOpen}
        defaultFormat={params?.format || "any"}
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
