import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  children: string;
}

const MarkdownRenderer = ({ children }: MarkdownRendererProps) => {
  return (
    <div className="prose dark:prose-invert prose-lg max-w-none prose-img:rounded-xl prose-img:shadow-lg prose-a:text-blue-600 hover:prose-a:text-blue-500 dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;