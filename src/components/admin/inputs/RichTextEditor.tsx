import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { RichTextEditorToolbar } from "./RichTextEditorToolbar";
import { useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-gray-100 dark:bg-gray-800 text-sm rounded-md p-4 my-4 overflow-x-auto',
          },
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none prose-sm sm:prose-base min-h-[250px] w-full rounded-b-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const editorElement = editor.view.dom;

    const handleAiUpdate = (event: Event) => {
      if ('detail' in event && event.detail && typeof event.detail.value === 'string') {
        const customEvent = event as CustomEvent<{ value: string }>;
        // Use editor commands to update content, which is the correct way for Tiptap
        editor.chain().focus().setContent(customEvent.detail.value, true).run();
      }
    };

    editorElement.addEventListener('ai-update', handleAiUpdate);

    return () => {
      editorElement.removeEventListener('ai-update', handleAiUpdate);
    };
  }, [editor]);

  return (
    <div className="flex flex-col justify-stretch">
      <RichTextEditorToolbar editor={editor} />
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
};

export default RichTextEditor;