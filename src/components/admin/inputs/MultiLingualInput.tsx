import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MultiLingualInputProps {
  id: string;
  label: string;
  value: Record<string, string>;
  onChange: (lang: string, value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "ar", name: "العربية" },
];

const MultiLingualInput = ({ id, label, value, onChange, placeholder, required }: MultiLingualInputProps) => {
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
            <Input
              id={`${id}-${lang.code}`}
              value={value[lang.code] || ""}
              onChange={(e) => onChange(lang.code, e.target.value)}
              placeholder={placeholder}
              required={lang.code === 'en' && required}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MultiLingualInput;