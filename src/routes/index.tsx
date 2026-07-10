import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_FORM,
  GRADE_CATALOG,
  SUBJECT_CATALOG,
  TASK_FORMATS,
  type FormDraft,
  type TaskFormat,
} from "@/lib/catalogs";
import { saveParams } from "@/lib/playerState";

export const Route = createFileRoute("/")({
  component: ParamsPage,
});

function ParamsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormDraft>(DEFAULT_FORM);
  const canSubmit = form.subject.trim() && form.grade.trim() && form.topic.trim();

  const update = (p: Partial<FormDraft>) => setForm((f) => ({ ...f, ...p }));

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-2xl font-semibold">Параметры задания</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Задайте вводные, затем откроется плеер контента.
        </p>

        <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Предмет *</Label>
              <Select value={form.subject} onValueChange={(v) => update({ subject: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Например, Математика" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {SUBJECT_CATALOG.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Класс *</Label>
              <Select value={form.grade} onValueChange={(v) => update({ grade: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Например, 7" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_CATALOG.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g} класс
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Тема *</Label>
            <Input
              placeholder="Например, Дроби"
              value={form.topic}
              onChange={(e) => update({ topic: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Новая тема</Label>
            <div className="inline-flex overflow-hidden rounded-full border">
              {[
                { v: true, label: "да" },
                { v: false, label: "нет" },
              ].map((opt, i) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => update({ isNewTopic: opt.v })}
                  className={`px-5 py-1.5 text-sm transition-colors ${
                    form.isNewTopic === opt.v
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-muted"
                  } ${i > 0 ? "border-l" : ""}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Формат задания</Label>
            <Select
              value={form.format}
              onValueChange={(v) => update({ format: v as TaskFormat })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Любой" />
              </SelectTrigger>
              <SelectContent>
                {TASK_FORMATS.map((f) => (
                  <SelectItem key={f.id || "any"} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Дополнительный запрос</Label>
            <Textarea
              rows={3}
              value={form.additionalRequest}
              onChange={(e) => update({ additionalRequest: e.target.value })}
              placeholder="Необязательно: пожелания к сложности, акцентам, контексту и т.д."
            />
          </div>

          <Button
            className="w-full"
            disabled={!canSubmit}
            onClick={() => {
              saveParams(form);
              navigate({ to: "/player" });
            }}
          >
            Открыть плеер
          </Button>
        </div>
      </div>
    </div>
  );
}
