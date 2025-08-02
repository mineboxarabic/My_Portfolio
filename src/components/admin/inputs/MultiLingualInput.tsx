import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface MultiLingualInputProps {
  id: string;
  label: string;
  value: Record<string, string>;
  onChange: (lang: string, value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
];

const MultiLingualInput = ({ id, label, value, onChange, placeholder, required }: MultiLingualInputProps) => {
  return (
    <div className="border rounded-lg p-4 bg-gray-50/50 dark:bg-gray-900/20 space-y-3">
      <div className="flex items-center justify-between border-b pb-2 mb-3">
        <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
          3 Languages
        </div>
      </div>
      
      <div className="grid gap-3">
        {languages.map(lang => (
          <div key={lang.code} className="bg-white dark:bg-gray-950 border rounded-md p-3 shadow-sm">
            <Label 
              htmlFor={`${id}-${lang.code}`}
              className="text-sm font-medium flex items-center gap-2 mb-2"
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-gray-700 dark:text-gray-300">{lang.name}</span>
              {lang.code === 'en' && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                  Primary
                </span>
              )}
            </Label>
            <Input
              id={`${id}-${lang.code}`}
              value={value[lang.code] || ""}
              onChange={(e) => onChange(lang.code, e.target.value)}
              placeholder={placeholder ? `${placeholder}...` : `Enter ${lang.name} text...`}
              required={lang.code === 'en' && required}
              className={`${lang.code === 'ar' ? 'text-right' : 'text-left'} transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiLingualInput;