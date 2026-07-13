import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { TASK_FORMATS, type TaskFormat } from "@/lib/catalogs";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultFormat?: TaskFormat;
  defaultWithIllustration?: boolean;
};

export function RegenerateDialog({
  open,
  onOpenChange,
  defaultFormat = "",
  defaultWithIllustration = true,
}: Props) {
  const [format, setFormat] = useState<TaskFormat>(defaultFormat);
  const [withIllustration, setWithIllustration] = useState(defaultWithIllustration);
  const [instructions, setInstructions] = useState("");

  const inputCls =
    "h-11 rounded-xl border-0 bg-[var(--surface-lavender)] px-4 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-primary/40";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg rounded-3xl border-0 bg-card p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-start justify-between">
          <DialogTitle className="text-2xl font-semibold text-foreground">
            Мотивирующее задание
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Формат задания</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as TaskFormat)}>
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

          <div className="flex items-center gap-3 pt-1">
            <Switch checked={withIllustration} onCheckedChange={setWithIllustration} />
            <span className="text-sm text-foreground">Добавить иллюстрацию</span>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Как нужно изменить задание</Label>
            <Textarea
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Повысить сложность, изменить формат работы, добавить примеры…"
              className="resize-none rounded-xl border-0 bg-[var(--surface-lavender)] px-4 py-3 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="h-12 rounded-xl bg-[var(--surface-lavender)] text-foreground hover:bg-[var(--surface-lavender)]/80"
              onClick={() => onOpenChange(false)}
            >
              Отменить
            </Button>
            <Button
              type="button"
              className="h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                toast.info("Генерация будет подключена к ИИ");
                onOpenChange(false);
              }}
            >
              Перегенерировать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
