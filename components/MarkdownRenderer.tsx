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
  const lastChart = useRef<string>('');

  useEffect(() => {
    let isMounted = true;
    
    // Clean up chart content from common AI prefixes that break Mermaid
    let cleanChart = chart.trim();
    
    // Remove common AI prefixes and fix double keywords
    cleanChart = cleanChart
      .replace(/^(Diagrama|Gráfico|Chart|Diagram|Figura|Figure|Conteúdo Visual|Visual Content|Mermaid):\s*/i, '')
      .replace(/^graph\s+chart\s+/i, '')
      .replace(/^graph\s+TD\s+graph\s+TD/i, 'graph TD')
      .replace(/^graphchart/i, '')
      .replace(/^graph\s+xychart-beta/i, 'xychart-beta')
      .replace(/^chart\s+xychart-beta/i, 'xychart-beta')
      .replace(/^graph\s+pie/i, 'pie')
      .replace(/^graph\s+sequenceDiagram/i, 'sequenceDiagram');

    // If the chart hasn't changed, don't re-render to avoid flickering
    if (lastChart.current === cleanChart) return;
    const isFirstRender = lastChart.current === '';
    lastChart.current = cleanChart;

    if (ref.current && cleanChart) {
      const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
      
      // Remove loading text to avoid flicker
      // We just leave the container empty until the SVG is ready

      // Fix Mermaid syntax: wrap node labels in quotes if they contain special chars
      // Only apply to graph/flowchart, not xychart or pie
      let fixedChart = cleanChart;
      if (cleanChart.startsWith('graph') || cleanChart.startsWith('flowchart')) {
        fixedChart = cleanChart.replace(/([a-zA-Z0-9_-]+)(\[|\(|\{)([^\]\)\}"\n]+)(\]|\)|\})/g, (match, nodeId, open, label, close) => {
          if (/[()+$+\-*/=]/.test(label)) {
            return `${nodeId}${open}"${label}"${close}`;
          }
          return match;
        });
      }

      // Instead of clearing immediately, we'll render to a temporary div
      // to avoid the "flash" of empty content
      mermaid.render(id, fixedChart).then(({ svg }) => {
        if (isMounted && ref.current) {
          ref.current.innerHTML = svg;
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

  return <div ref={ref} className="flex justify-center my-8 bg-white p-4 rounded-xl border border-slate-100 shadow-sm overflow-x-auto min-h-[100px]" />;
};

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({ content }) => {
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
});
