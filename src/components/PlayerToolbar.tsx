import {
  Bold,
  Italic,
  Underline,
  Type,
  Palette,
  Highlighter,
  Code2,
  Sigma,
  Braces,
  Hash,
  List,
  Play,
  Strikethrough,
  Superscript,
  Subscript,
  AlignLeft,
  Table,
  Image as ImageIcon,
  Link as LinkIcon,
  Smile,
  Minus,
} from "lucide-react";

const groups = [
  [Bold, Italic, Underline],
  [Type, Palette, Highlighter],
  [Code2, Sigma, Braces, Hash],
  [List, Play, Strikethrough, Superscript, Subscript, AlignLeft],
  [Table, ImageIcon, LinkIcon, Smile, Minus],
];

export function PlayerToolbar() {
  return (
    <div className="flex items-center gap-1 border-b border-border bg-card px-6 py-2 overflow-x-auto">
      <button
        type="button"
        className="flex h-8 items-center gap-1 rounded-md px-2 text-sm text-foreground hover:bg-muted"
      >
        Абзац
        <span className="text-muted-foreground">⌄</span>
      </button>
      <span className="mx-2 h-5 w-px bg-border" />
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center">
          {group.map((Icon, i) => (
            <button
              key={i}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-muted"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          {gi < groups.length - 1 && <span className="mx-2 h-5 w-px bg-border" />}
        </div>
      ))}
    </div>
  );
}
