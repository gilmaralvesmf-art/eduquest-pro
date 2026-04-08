import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
});

const Mermaid = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    if (ref.current && chart) {
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      
      // Clear previous content
      ref.current.innerHTML = '<div class="flex items-center justify-center p-4 text-slate-400 text-xs animate-pulse">Renderizando diagrama...</div>';

      // Fix Mermaid syntax: wrap node labels in quotes if they contain special chars
      // This handles cases like A[C(s) + H2] which cause parse errors in Mermaid
      const fixedChart = chart.replace(/([a-zA-Z0-9_-]+)(\[|\(|\{)([^\]\)\}"\n]+)(\]|\)|\})/g, (match, nodeId, open, label, close) => {
        // If label contains special chars (like parens, plus, math symbols) and isn't already quoted
        if (/[()+$+\-*/=]/.test(label)) {
          return `${nodeId}${open}"${label}"${close}`;
        }
        return match;
      });

      mermaid.render(id, fixedChart).then(({ svg }) => {
        if (isMounted && ref.current) {
          ref.current.innerHTML = svg;
          // Ensure SVG takes full width and is responsive
          const svgElement = ref.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.display = 'block';
            svgElement.style.margin = '0 auto';
          }
        }
      }).catch(err => {
        console.error("Mermaid rendering error:", err);
        if (isMounted && ref.current) {
          ref.current.innerHTML = `<div class="p-4 border border-red-200 bg-red-50 text-red-600 text-xs rounded-lg">
            <strong>Erro no diagrama:</strong> ${err.message}
            <pre class="mt-2 text-[10px] overflow-auto max-h-24">${fixedChart}</pre>
          </div>`;
        }
      });
    }
    return () => { isMounted = false; };
  }, [chart]);

  return <div ref={ref} className="flex justify-center my-8 bg-white p-4 rounded-xl border border-slate-100 shadow-sm overflow-x-auto" />;
};

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // If the content looks like a mermaid chart but isn't wrapped in code blocks, wrap it
  let processedContent = content;
  if (
    (content.includes('graph ') || content.includes('pie') || content.includes('sequenceDiagram') || content.includes('xychart-beta')) && 
    !content.includes('```mermaid')
  ) {
    processedContent = `\`\`\`mermaid\n${content}\n\`\`\``;
  }

  // Remove \ce commands that are not supported by default KaTeX without mhchem extension
  const cleanContent = processedContent
    .replace(/\\ce\s*\{([^}]+)\}/g, '$1')
    .replace(/\\ce\s+([^\s$]+)/g, '$1')
    // Fix broken table syntax (double pipes or missing newlines)
    .replace(/\s*\|\|\s*/g, '|\n|')
    // Fix common missing backslashes for symbols
    .replace(/(?<!\\)Delta/g, '\\Delta')
    .replace(/(?<!\\)rightarrow/g, '\\rightarrow')
    .replace(/(?<!\\)textkJ/g, '\\text{kJ}')
    .replace(/(?<!\\)circ/g, '\\circ')
    // Ensure symbols are wrapped in $ if they aren't already
    // We look for \Delta, \rightarrow, etc. that are NOT inside $...$
    .replace(/(?<![\$])(\\Delta|\\rightarrow|\\text\{kJ\}|\\circ)(?![^\$]*\$)/g, '$$$1$');

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
