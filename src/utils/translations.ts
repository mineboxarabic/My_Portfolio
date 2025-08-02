export type Translatable = Record<string, string> | string | null | undefined;

/**
 * Gets the translated text from a JSONB field.
 * It handles both the new object format and the old string format for backward compatibility.
 * @param field The field which can be a JSONB object or a string.
 * @param lang The current language code (e.g., 'en', 'fr').
 * @returns The translated string or an empty string.
 */
export const getTranslatedText = (field: Translatable, lang: string): string => {
  if (!field) {
    return "";
  }
  // Handle old format (plain string) for backward compatibility
  if (typeof field === 'string') {
    return field;
  }
  // Handle new format (JSONB object)
  // Return the text for the current language, or fallback to English, or return empty string.
  return field[lang] || field['en'] || '';
};