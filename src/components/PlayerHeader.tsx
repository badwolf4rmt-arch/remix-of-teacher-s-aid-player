import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
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
import { savePrompts, type ModelId, type PromptSettings } from "@/lib/playerState";

type Props = {
  userName: string;
  onUserChange: (v: string) => void;
  model: ModelId;
  onModelChange: (v: ModelId) => void;
  prompts: PromptSettings;
  onPromptsChange: (v: PromptSettings) => void;
};

export function PlayerHeader({
  userName,
  onUserChange,
  model,
  onModelChange,
  prompts,
  onPromptsChange,
}: Props) {
  const [draft, setDraft] = useState(prompts);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-end gap-4 px-4 py-3">
        <Link to="/" className="text-sm font-semibold text-foreground hover:underline">
          ← К параметрам
        </Link>

        <div className="flex flex-col gap-1">
          <Label htmlFor="user" className="text-xs text-muted-foreground">
            Пользователь
          </Label>
          <Input
            id="user"
            className="h-9 w-52"
            placeholder="Ваше имя"
            value={userName}
            onChange={(e) => onUserChange(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Модель</Label>
          <Select value={model} onValueChange={(v) => onModelChange(v as ModelId)}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude">Claude</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto">
          <Sheet
            onOpenChange={(open) => {
              if (open) setDraft(prompts);
            }}
          >
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Настройки промптов
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
                    { key: "stage2", title: "Этап 2 — запрос на изображение" },
                    { key: "stage3", title: "Этап 3 — генерация изображения" },
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
