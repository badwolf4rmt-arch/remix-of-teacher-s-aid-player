import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { normalizeMarkdownMath } from "@/lib/normalizeMarkdownMath";
import { cn } from "@/lib/utils";

type Props = { content: string; className?: string };

const remarkPlugins = [remarkGfm, remarkBreaks, remarkMath];
const rehypePlugins = [rehypeRaw, rehypeKatex];

export function MarkdownContent({ content, className }: Props) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-foreground",
        "[&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2",
        "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2",
        "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2",
        "[&_p]:my-2 [&_p]:leading-relaxed",
        "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2",
        "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2",
        "[&_li]:my-1",
        "[&_strong]:font-semibold",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm",
        "[&_hr]:my-4 [&_hr]:border-border",
        "[&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        "[&_details]:my-4 [&_details]:rounded-xl [&_details]:border [&_details]:border-primary/30 [&_details]:bg-[var(--surface-lavender,theme(colors.muted.DEFAULT))]/40 [&_details]:px-4 [&_details]:py-2",
        "[&_details[open]]:bg-[var(--surface-lavender,theme(colors.muted.DEFAULT))]/60",
        "[&_details>summary]:cursor-pointer [&_details>summary]:list-none [&_details>summary]:py-2 [&_details>summary]:font-semibold [&_details>summary]:text-primary [&_details>summary]:select-none [&_details>summary]:flex [&_details>summary]:items-center [&_details>summary]:gap-2",
        "[&_details>summary::-webkit-details-marker]:hidden",
        "[&_details>summary::before]:content-['▸'] [&_details>summary::before]:text-primary [&_details>summary::before]:transition-transform",
        "[&_details[open]>summary::before]:rotate-90",
        "[&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
        {normalizeMarkdownMath(content)}
      </ReactMarkdown>
    </div>
  );
}
