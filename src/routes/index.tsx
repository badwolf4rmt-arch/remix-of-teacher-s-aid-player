import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  loadUser,
  saveParams,
  saveUser,
} from "@/lib/playerState";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: ParamsPage,
});

const MAX_NOTE = 300;

function RequiredMark() {
  return <span className="text-destructive">*</span>;
}

function ParamsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormDraft>(DEFAULT_FORM);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setUserName(loadUser());
  }, []);

  const canSubmit = !!(form.subject.trim() && form.grade.trim() && form.topic.trim());

  const update = (p: Partial<FormDraft>) => setForm((f) => ({ ...f, ...p }));
  const inputCls =
    "h-11 rounded-xl border-0 bg-[var(--surface-lavender)] px-4 text-sm text-foreground shadow-none focus-visible:ring-2 focus-visible:ring-primary/40";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        userName={userName}
        onUserChange={(v) => { setUserName(v); saveUser(v); }}
      />

      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl rounded-3xl bg-card p-8 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Мотивирующее задание</h1>
          <button
            type="button"
            onClick={() => setForm(DEFAULT_FORM)}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Сбросить"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Предмет
                <RequiredMark />
              </Label>
              <Select value={form.subject} onValueChange={(v) => update({ subject: v })}>
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Выберите" />
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

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Параллель
                <RequiredMark />
              </Label>
              <Select value={form.grade} onValueChange={(v) => update({ grade: v })}>
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Класс" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_CATALOG.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Тема задания
              <RequiredMark />
            </Label>
            <Input
              className={inputCls}
              placeholder="Например, Теорема Пифагора"
              value={form.topic}
              onChange={(e) => update({ topic: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Switch
              checked={form.withIllustration}
              onCheckedChange={(v) => update({ withIllustration: v })}
            />
            <span className="text-sm text-foreground">Добавить иллюстрацию</span>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Формат задания</Label>
            <Select
              value={form.format}
              onValueChange={(v) => update({ format: v as TaskFormat })}
            >
              <SelectTrigger className={inputCls}>
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

          <div className="space-y-2">
            <Label className="text-sm font-medium">Важно учесть</Label>
            <div className="relative">
              <Textarea
                rows={4}
                maxLength={MAX_NOTE}
                value={form.additionalRequest}
                onChange={(e) => update({ additionalRequest: e.target.value })}
                placeholder="Например, особенности группы, акценты, ограничение по времени…"
                className="resize-none rounded-xl border-0 bg-[var(--surface-lavender)] px-4 py-3 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground">
                {form.additionalRequest.length}/{MAX_NOTE}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="h-12 rounded-xl bg-[var(--surface-lavender)] text-foreground hover:bg-[var(--surface-lavender)]/80"
              onClick={() => setForm(DEFAULT_FORM)}
            >
              Отменить
            </Button>
            <Button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                saveParams(form);
                navigate({ to: "/player" });
              }}
              className={cn(
                "h-12 rounded-xl text-white",
                canSubmit
                  ? "bg-primary hover:bg-primary/90"
                  : "bg-[var(--surface-lavender)] text-muted-foreground",
              )}
            >
              Сгенерировать
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
