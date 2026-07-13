import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EvaluationPanel } from "./EvaluationPanel";
import type { FormDraft } from "@/lib/catalogs";
import type { ModelId } from "@/lib/playerState";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userName: string;
  model: ModelId;
  params: FormDraft | null;
  taskContent: string;
  teacherNotes: string;
};

export function EvaluationSheet({
  open,
  onOpenChange,
  userName,
  model,
  params,
  taskContent,
  teacherNotes,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Оценка</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6">
          <EvaluationPanel
            userName={userName}
            model={model}
            params={params}
            taskContent={taskContent}
            teacherNotes={teacherNotes}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
