import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PlayerHeader } from "@/components/PlayerHeader";
import { EvaluationPanel } from "@/components/EvaluationPanel";
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
import type { FormDraft } from "@/lib/catalogs";

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

  useEffect(() => {
    setUserName(loadUser());
    setModel(loadModel());
    setPrompts(loadPrompts());
    setParams(loadParams());
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
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
      />

      <main className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <EvaluationPanel
              userName={userName}
              model={model}
              params={params}
              taskContent={DEMO_TASK}
              teacherNotes={DEMO_NOTES}
            />
          </aside>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Задание</h2>
            <MarkdownContent content={DEMO_TASK} />
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Заметки для учителя</h2>
            <MarkdownContent content={DEMO_NOTES} />
          </section>
        </div>
      </main>
    </div>
  );
}
