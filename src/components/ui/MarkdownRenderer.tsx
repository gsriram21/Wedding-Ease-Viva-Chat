import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headers
          h1: ({children}) => <h1 className="text-xl font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">{children}</h1>,
          h2: ({children}) => <h2 className="text-lg font-semibold text-gray-800 mb-2 mt-4">{children}</h2>,
          h3: ({children}) => <h3 className="text-base font-semibold text-gray-700 mb-2 mt-3">{children}</h3>,
          h4: ({children}) => <h4 className="text-sm font-semibold text-gray-700 mb-1 mt-3">{children}</h4>,
          h5: ({children}) => <h5 className="text-sm font-medium text-gray-600 mb-1 mt-2">{children}</h5>,
          h6: ({children}) => <h6 className="text-xs font-medium text-gray-600 mb-1 mt-2">{children}</h6>,
          
          // Paragraphs
          p: ({children}) => <p className="text-sm leading-relaxed mb-3 last:mb-0">{children}</p>,
          
          // Lists
          ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1 ml-2">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1 ml-2">{children}</ol>,
          li: ({children}) => <li className="text-sm leading-relaxed">{children}</li>,
          
          // Code - simplified approach
          code: ({children, className, ...props}) => {
            const isCodeBlock = className && className.includes('language-');
            return isCodeBlock ? (
              <code className="block bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre" {...props}>
                {children}
              </code>
            ) : (
              <code className="bg-gray-100 text-rose-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            );
          },
          
          // Pre blocks (for code blocks)
          pre: ({children}) => <pre className="mb-3">{children}</pre>,
          
          // Blockquotes
          blockquote: ({children}) => (
            <blockquote className="border-l-4 border-rose-200 pl-4 py-2 bg-rose-50/30 text-gray-700 italic mb-3 rounded-r-lg">
              {children}
            </blockquote>
          ),
          
          // Links
          a: ({children, href}) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-rose-600 hover:text-rose-700 underline decoration-rose-300 hover:decoration-rose-500 transition-colors"
            >
              {children}
            </a>
          ),
          
          // Tables
          table: ({children}) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border border-gray-200 rounded-lg text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({children}) => <thead className="bg-gray-50">{children}</thead>,
          tbody: ({children}) => <tbody className="divide-y divide-gray-200">{children}</tbody>,
          tr: ({children}) => <tr>{children}</tr>,
          th: ({children}) => <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">{children}</th>,
          td: ({children}) => <td className="px-3 py-2 text-gray-600">{children}</td>,
          
          // Emphasis
          strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
          em: ({children}) => <em className="italic text-gray-700">{children}</em>,
          
          // Strikethrough
          del: ({children}) => <del className="line-through text-gray-500">{children}</del>,
          
          // Horizontal rule
          hr: () => <hr className="border-0 border-t border-gray-200 my-4" />,
          
          // Line breaks
          br: () => <br className="mb-1" />,

          // Input checkboxes for task lists
          input: ({type, checked, ...props}) => 
            type === 'checkbox' ? (
              <input 
                type="checkbox" 
                checked={checked} 
                readOnly 
                className="mr-2 accent-rose-500"
                {...props}
              />
            ) : <input {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 