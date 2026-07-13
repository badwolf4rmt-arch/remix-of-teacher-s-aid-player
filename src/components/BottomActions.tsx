import { Sparkles, Type as TypeIcon, HelpCircle } from "lucide-react";

export function BottomActions() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-card px-3 py-2 shadow-xl">
        <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted">
          <TypeIcon className="h-4 w-4 text-muted-foreground" />
          Текст
        </button>
        <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          Вопрос
        </button>
        <button className="flex items-center gap-2 rounded-xl bg-[var(--surface-lavender)] px-3 py-2 text-sm text-foreground hover:bg-[var(--surface-lavender)]/80">
          <Sparkles className="h-4 w-4 text-primary" />
          ИИ-помощник
          <span className="ml-1 flex items-center gap-1 text-primary">
            <Sparkles className="h-3 w-3 fill-current" />5
          </span>
        </button>
      </div>
    </div>
  );
}
