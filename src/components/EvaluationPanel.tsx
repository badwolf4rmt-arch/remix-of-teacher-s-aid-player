import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  EVALUATION_CRITERIA,
  SCORE_LEVELS,
  type CriterionId,
} from "@/lib/demoContent";
import type { FormDraft } from "@/lib/catalogs";
import type { ModelId } from "@/lib/playerState";

type Scores = Partial<Record<CriterionId, number>>;

type Props = {
  userName: string;
  model: ModelId;
  params: FormDraft | null;
  taskContent: string;
  teacherNotes: string;
};

const toneClasses: Record<string, string> = {
  bad: "text-red-600 data-[active=true]:bg-red-50 data-[active=true]:ring-red-400",
  "mid-bad": "text-orange-600 data-[active=true]:bg-orange-50 data-[active=true]:ring-orange-400",
  "mid-good": "text-sky-600 data-[active=true]:bg-sky-50 data-[active=true]:ring-sky-400",
  good: "text-green-700 data-[active=true]:bg-green-50 data-[active=true]:ring-green-500",
};

export function EvaluationPanel({ userName, model, params, taskContent, teacherNotes }: Props) {
  const [markupOk, setMarkupOk] = useState(true);
  const [scores, setScores] = useState<Scores>({});
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const complete = EVALUATION_CRITERIA.every((c) => scores[c.id]);
  const canSubmit = complete && stars > 0 && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    const { error } = await supabase.from("evaluations").insert({
      user_name: userName || null,
      model,
      params: params as never,
      markup_ok: markupOk,
      scores: scores as never,
      overall_stars: stars,
      comment: comment || null,
      task_content: taskContent,
      teacher_notes: teacherNotes,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Не удалось сохранить оценку", { description: error.message });
      return;
    }
    toast.success("Оценка сохранена");
    setScores({});
    setStars(0);
    setComment("");
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Ваша оценка</h2>

      <label className="mb-5 flex items-center gap-2 text-sm">
        <Checkbox checked={markupOk} onCheckedChange={(v) => setMarkupOk(v === true)} />
        <span>Разметка в порядке</span>
      </label>

      <div className="space-y-3">
        {EVALUATION_CRITERIA.map((c) => (
          <div key={c.id} className="grid grid-cols-1 gap-2">
            <span className="text-sm text-foreground">{c.label}</span>
            <div className="grid grid-cols-4 overflow-hidden rounded-full border">
              {SCORE_LEVELS.map((lvl, idx) => {
                const active = scores[c.id] === lvl.value;
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    data-active={active}
                    onClick={() => setScores((s) => ({ ...s, [c.id]: lvl.value }))}
                    className={cn(
                      "px-2 py-1.5 text-xs font-medium transition-colors",
                      idx > 0 && "border-l",
                      "data-[active=true]:ring-2 data-[active=true]:ring-inset",
                      toneClasses[lvl.tone],
                    )}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <span className="mb-2 block text-sm">Общее впечатление</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              aria-label={`${n} звёзд`}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  n <= stars ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <Textarea
        className="mt-4"
        placeholder="Комментарий"
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <Button className="mt-4 w-full" disabled={!canSubmit} onClick={submit}>
        {submitting ? "Отправка..." : "Отправить"}
      </Button>
    </div>
  );
}
