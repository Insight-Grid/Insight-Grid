import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Or any other style

export function MarkdownRenderer({ markdown }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={dracula}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

export function CodeOutputRenderer({ outputs }) {
  if (!outputs || outputs.length === 0) return null;

  return (
    <div className="notebook-output">
      {outputs.map((output, index) => {
        if (output.output_type === 'stream') {
          return <pre key={index} className="stream-output">{output.text.join('')}</pre>;
        } else if (output.output_type === 'display_data' || output.output_type === 'execute_result') {
          // Handle different mime types
          if (output.data && output.data['text/html']) {
            // WARNING: Use with caution. Sanitize HTML if source is untrusted.
            return <div key={index} dangerouslySetInnerHTML={{ __html: output.data['text/html'].join('') }} className="html-output" />;
          } else if (output.data && output.data['image/png']) {
            return <img key={index} src={`data:image/png;base64,${output.data['image/png']}`} alt="Output" className="image-output" />;
          } else if (output.data && output.data['text/plain']) {
            return <pre key={index} className="plain-text-output">{output.data['text/plain'].join('')}</pre>;
          }
        } else if (output.output_type === 'error') {
          return (
            <pre key={index} style={{ color: 'var(--error-color)' }} className="error-output">
              {output.ename}: {output.evalue}
              {output.traceback.join('')}
            </pre>
          );
        }
        return null;
      })}
    </div>
  );
}

// And a component to render the entire notebook
export function JupyterNotebookContentViewer({ notebookJson }) {
    if (!notebookJson || !notebookJson.cells) {
      return <div className="notebook-content-viewer-empty">No notebook content to display.</div>;
    }
  
    return (
      <div className="jupyter-notebook-content-viewer">
        {notebookJson.cells.map((cell, index) => {
          if (cell.cell_type === 'markdown') {
            return (
              <div key={index} className="notebook-cell markdown-cell">
                <MarkdownRenderer markdown={cell.source.join('')} />
              </div>
            );
          } else if (cell.cell_type === 'code') {
            return (
              <div key={index} className="notebook-cell code-cell">
                <div className="code-input">
                  {/* Assuming notebookJson.metadata.kernelspec.language exists for highlighting */}
                  <MarkdownRenderer markdown={`\`\`\`${notebookJson.metadata?.kernelspec?.language || 'python'}\n${cell.source.join('')}\n\`\`\``} />
                </div>
                <CodeOutputRenderer outputs={cell.outputs} />
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }