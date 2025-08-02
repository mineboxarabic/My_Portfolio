import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MultiLingualTextareaProps {
  id: string;
  label: string;
  value: Record<string, string>;
  onChange: (lang: string, value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "ar", name: "العربية" },
];

const MultiLingualTextarea = ({ id, label, value, onChange, placeholder, required, rows = 3 }: MultiLingualTextareaProps) => {
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
          <TabsContent key={lang.code} value={lang.code}>
            <Textarea
              id={`${id}-${lang.code}`}
              value={value[lang.code] || ""}
              onChange={(e) => onChange(lang.code, e.target.value)}
              placeholder={placeholder}
              required={lang.code === 'en' && required}
              rows={rows}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MultiLingualTextarea;