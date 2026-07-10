function isInsideMathDelimiters(source: string, start: number, end: number): boolean {
  const before = source[start - 1];
  const after = source[end];
  return before === "$" || after === "$";
}

export function normalizeMarkdownMath(content: string): string {
  if (!content.trim()) return content;

  let result = content;

  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner: string) => `$${inner.trim()}$`);
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner: string) => `$$\n${inner.trim()}\n$$`);

  result = result.replace(/\(([^()\n]*\\[a-zA-Z@][^()\n]*)\)/g, (match, inner, offset) => {
    if (isInsideMathDelimiters(result, offset, offset + match.length)) return match;
    return `$${inner.trim()}$`;
  });

  result = result.replace(
    /(?<![$\\])(\d+)\^\\circ(?!\$)/g,
    (_, value: string) => `$${value}^\\circ$`,
  );

  return result;
}
