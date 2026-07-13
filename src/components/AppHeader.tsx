import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DEFAULT_PROMPTS, savePrompts, type ModelId, type PromptSettings } from "@/lib/playerState";

type Props = {
  userName: string;
  onUserChange: (v: string) => void;
  model: ModelId;
  onModelChange: (v: ModelId) => void;
  prompts: PromptSettings;
  onPromptsChange: (v: PromptSettings) => void;
};

export function AppHeader({
  userName,
  onUserChange,
  model,
  onModelChange,
  prompts,
  onPromptsChange,
}: Props) {
  const [draft, setDraft] = useState(prompts);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="flex items-center gap-4 px-6 py-3">
        <Link to="/" className="text-sm font-semibold text-foreground">
          Мотивирующее задание
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="user" className="text-xs text-muted-foreground">
              Пользователь
            </Label>
            <Input
              id="user"
              className="h-9 w-40 rounded-lg border-0 bg-[var(--surface-lavender)] text-sm shadow-none"
              placeholder="Ваше имя"
              value={userName}
              onChange={(e) => onUserChange(e.target.value)}
            />
          </div>

          <Select value={model} onValueChange={(v) => onModelChange(v as ModelId)}>
            <SelectTrigger className="h-9 w-32 rounded-lg border-0 bg-[var(--surface-lavender)] text-sm shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude">Claude</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
            </SelectContent>
          </Select>

          <Sheet onOpenChange={(open) => { if (open) setDraft(prompts); }}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-2 rounded-lg bg-[var(--surface-lavender)] text-foreground hover:bg-[var(--surface-lavender)]/80"
              >
                <Settings2 className="h-4 w-4" />
                Промпты
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
              <SheetHeader>
                <SheetTitle>Промпты</SheetTitle>
                <SheetDescription>
                  Тексты промптов, которые будут отправляться в модель на разных этапах.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6 px-4 pb-6">
                {(
                  [
                    { key: "stage1", title: "Этап 1 — задание и заметки" },
                    { key: "stage2", title: "Этап 2 — бриф на картинку" },
                    { key: "stage3", title: "Этап 3 — генерация картинки" },
                  ] as const
                ).map((s) => (
                  <div key={s.key} className="space-y-2">
                    <Label className="text-sm font-medium">{s.title}</Label>
                    <Textarea
                      rows={8}
                      value={draft[s.key]}
                      placeholder="Текст промпта…"
                      onChange={(e) => setDraft({ ...draft, [s.key]: e.target.value })}
                    />
                  </div>
                ))}

                <Button
                  className="w-full"
                  onClick={() => {
                    onPromptsChange(draft);
                    savePrompts(draft);
                  }}
                >
                  Сохранить
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
