import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

const Mermaid = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      mermaid.render(id, chart).then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      }).catch(err => {
        console.error("Mermaid rendering error:", err);
        if (ref.current) {
          ref.current.innerHTML = `<div class="text-red-500 text-xs">Erro ao renderizar diagrama: ${err.message}</div>`;
        }
      });
    }
  }, [chart]);

  return <div ref={ref} className="flex justify-center my-6 overflow-x-auto" />;
};

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Remove \ce commands that are not supported by default KaTeX without mhchem extension
  // Matches \ce{...} and \ce ...
  const cleanContent = content
    .replace(/\\ce\s*\{([^}]+)\}/g, '$1')
    .replace(/\\ce\s+([^\s$]+)/g, '$1')
    // Fix common missing backslashes or delimiters for Delta and rightarrow
    // If we see "rightarrow" or "Delta" not preceded by a backslash and not inside $...$
    .replace(/(?<![\\\$])rightarrow(?![^\$]*\$)/g, '$\\rightarrow$')
    .replace(/(?<![\\\$])Delta(?![^\$]*\$)/g, '$\\Delta$')
    // If we see "\rightarrow" or "\Delta" not inside $...$
    .replace(/(?<![\$])\\rightarrow(?![^\$]*\$)/g, '$\\rightarrow$')
    .replace(/(?<![\$])\\Delta(?![^\$]*\$)/g, '$\\Delta$');

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeRaw]}
      components={{
        table({ children, ...props }: any) {
          return (
            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse border border-slate-300 text-center" {...props}>
                {children}
              </table>
            </div>
          );
        },
        th({ children, ...props }: any) {
          return <th className="border border-slate-300 px-4 py-2 bg-slate-100 font-bold text-center" {...props}>{children}</th>;
        },
        td({ children, ...props }: any) {
          return <td className="border border-slate-300 px-4 py-2 text-center" {...props}>{children}</td>;
        },
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          if (!inline && match && match[1] === 'mermaid') {
            return <Mermaid chart={String(children).replace(/\n$/, '')} />;
          }
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }
      }}
    >
      {cleanContent}
    </ReactMarkdown>
  );
};
