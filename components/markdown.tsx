"use client";

import { memo, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CheckIcon, CopyIcon } from "@/components/icons";

const components: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),

  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,

  // Numeric-only tables read much better with tabular figures.
  td: ({ children }) => (
    <td className="tabular-nums">{children}</td>
  ),
};

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  function copy(event: React.MouseEvent<HTMLButtonElement>) {
    const pre = event.currentTarget.parentElement?.querySelector("pre");
    const text = pre?.textContent ?? "";
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="group/code relative">
      <pre>{children}</pre>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-lg border border-rule bg-raised text-faint opacity-0 transition-all hover:text-ink group-hover/code:opacity-100"
      >
        {copied ? (
          <CheckIcon size={13} className="text-positive" />
        ) : (
          <CopyIcon size={13} />
        )}
      </button>
    </div>
  );
}

function MarkdownImpl({ children }: { children: string }) {
  return (
    <div className="prose-lumen">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Streaming re-renders this on every character, so skip the work whenever the
 * text hasn't actually changed.
 */
export const Markdown = memo(
  MarkdownImpl,
  (prev, next) => prev.children === next.children
);
