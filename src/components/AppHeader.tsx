import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  userName: string;
  onUserChange: (v: string) => void;
};

export function AppHeader({ userName, onUserChange }: Props) {
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
        </div>
      </div>
    </header>
  );
}
