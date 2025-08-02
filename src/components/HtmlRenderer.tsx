import DOMPurify from 'dompurify';

interface HtmlRendererProps {
  children: string;
}

const HtmlRenderer = ({ children }: HtmlRendererProps) => {
  // Sanitize the HTML content to prevent XSS attacks
  const sanitizedHtml = DOMPurify.sanitize(children, {
    USE_PROFILES: { html: true },
  });

  return (
    <div
      className="prose dark:prose-invert prose-lg max-w-none prose-img:rounded-xl prose-img:shadow-lg prose-a:text-blue-600 hover:prose-a:text-blue-500 dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default HtmlRenderer;