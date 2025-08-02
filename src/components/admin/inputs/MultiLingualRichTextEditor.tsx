import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RichTextEditor from "./RichTextEditor";

interface MultiLingualRichTextEditorProps {
  id: string;
  label: string;
  value: Record<string, string>;
  onChange: (lang: string, value: string) => void;
  placeholder?: string;
}

const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "ar", name: "العربية" },
];

const MultiLingualRichTextEditor = ({ id, label, value, onChange, placeholder }: MultiLingualRichTextEditorProps) => {
  return (
    <div>
      <Label htmlFor={`${id}-en`}>{label}</Label>
      <Tabs defaultValue="en" className="w-full mt-1">
        <TabsList className="grid w-full grid-cols-3">
          {languages.map(lang => (
            <TabsTrigger key={lang.code} value={lang.code}>{lang.name}</TabsTrigger>
          ))}
        </TabsList>
        {languages.map(lang => (
          <TabsContent key={lang.code} value={lang.code} className="mt-0">
            <RichTextEditor
              value={value[lang.code] || ""}
              onChange={(html) => onChange(lang.code, html)}
              placeholder={placeholder}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MultiLingualRichTextEditor;