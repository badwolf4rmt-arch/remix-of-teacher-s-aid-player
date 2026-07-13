import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerHeader } from "@/components/PlayerHeader";
import { PlayerToolbar } from "@/components/PlayerToolbar";
import { BottomActions } from "@/components/BottomActions";
import { RegenerateDialog } from "@/components/RegenerateDialog";
import { EvaluationSheet } from "@/components/EvaluationSheet";
import { MarkdownContent } from "@/components/MarkdownContent";
import { DEMO_NOTES, DEMO_TASK } from "@/lib/demoContent";
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
import { TASK_FORMATS, type FormDraft } from "@/lib/catalogs";

export const Route = createFileRoute("/player")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Плеер контента — стенд" }],
  }),
  component: PlayerPage,
});

function PlayerPage() {
  const [userName, setUserName] = useState("");
  const [model, setModel] = useState<ModelId>("claude");
  const [prompts, setPrompts] = useState<PromptSettings>(DEFAULT_PROMPTS);
  const [params, setParams] = useState<FormDraft | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);

  useEffect(() => {
    setUserName(loadUser());
    setModel(loadModel());
    setPrompts(loadPrompts());
    setParams(loadParams());
  }, []);

  const formatLabel = TASK_FORMATS.find((f) => f.id === params?.format)?.label || "Кейс";

  return (
    <div className="min-h-screen bg-background">
      <PlayerHeader
        userName={userName}
        onUserChange={(v) => {
          setUserName(v);
          saveUser(v);
        }}
        model={model}
        onModelChange={(v) => {
          setModel(v);
          saveModel(v);
        }}
        prompts={prompts}
        onPromptsChange={setPrompts}
        onOpenEvaluation={() => setEvalOpen(true)}
      />

      <PlayerToolbar />

      <main className="mx-auto max-w-[1400px] px-8 py-8 pb-32">
        <div className="mb-4 flex items-center gap-4 border-b border-border/60 pb-4 text-sm">
          <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            {params?.subject || "Предмет"} <span>⌄</span>
          </button>
          <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            {params?.grade ? `${params.grade} параллель` : "Параллель"} <span>⌄</span>
          </button>
        </div>

        <h1 className="mb-6 text-3xl font-semibold text-foreground">
          {params?.topic || "Тема задания"}
        </h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="relative rounded-2xl border-2 border-primary/40 bg-card p-6 shadow-sm">
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
              >
                <RefreshCw className="h-4 w-4" />
                Перегенерировать
              </Button>
            </div>

            <MarkdownContent content={DEMO_TASK} />
          </section>

          <aside>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Заметки для учителя</h2>
            <div className="border-t border-border/60 pt-4">
              <MarkdownContent content={DEMO_NOTES} />
            </div>
          </aside>
        </div>
      </main>

      <BottomActions />

      <RegenerateDialog
        open={regenOpen}
        onOpenChange={setRegenOpen}
        defaultFormat={params?.format ?? ""}
        defaultWithIllustration={params?.withIllustration ?? true}
      />

      <EvaluationSheet
        open={evalOpen}
        onOpenChange={setEvalOpen}
        userName={userName}
        model={model}
        params={params}
        taskContent={DEMO_TASK}
        teacherNotes={DEMO_NOTES}
      />
    </div>
  );
}
