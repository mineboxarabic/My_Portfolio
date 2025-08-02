import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { getTranslatedText, Translatable } from "@/utils/translations";

interface AboutData {
  id: string;
  title: Translatable;
  content: Translatable;
  image_url: string | null;
}

const About = () => {
  const { t, i18n } = useTranslation();
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const isRTL = i18n.dir() === 'rtl';

  useEffect(() => {
    fetchAboutData();
  }, []);

  // Re-fetch when language changes to ensure proper display
  useEffect(() => {
    if (aboutData) {
      // Force a re-render when language changes
      setAboutData({ ...aboutData });
    }
  }, [i18n.language]);

  const fetchAboutData = async () => {
    try {
      const { data, error } = await supabase
        .from("about_me")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setAboutData(data);
    } catch (error) {
      console.error("Failed to fetch about data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="about" className="py-20 px-4 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading about section...</p>
        </div>
      </section>
    );
  }

  if (!aboutData) {
    return (
      <section id="about" className="py-20 px-4 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className={`text-4xl font-bold text-gray-900 dark:text-white mb-4 ${isRTL ? 'font-arabic' : ''}`}>
            {t('about.title')}
          </h2>
          <p className={`text-lg text-gray-600 dark:text-gray-300 ${isRTL ? 'font-arabic' : ''}`}>
            {t('about.noInfo')}
          </p>
        </div>
      </section>
    );
  }

  // Get the translated title and content
  const translatedTitle = getTranslatedText(aboutData.title, i18n.language);
  const translatedContent = getTranslatedText(aboutData.content, i18n.language);

  // Fallback to translation keys if no content is available
  const displayTitle = translatedTitle || t('about.title');
  const displayContent = translatedContent || t('about.noInfo');

  return (
    <section id="about" className="py-20 px-4 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <h2 className={`text-4xl font-bold text-center text-gray-900 dark:text-white mb-16 ${isRTL ? 'font-arabic' : ''}`}>
          {displayTitle}
        </h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className={`${isRTL ? 'md:order-2' : 'order-2 md:order-1'}`}>
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className={`text-lg text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap ${isRTL ? 'text-right font-arabic' : ''}`}>
                  {displayContent}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className={`${isRTL ? 'md:order-1' : 'order-1 md:order-2'} flex justify-center`}>
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <img
                src={aboutData.image_url || "/placeholder.svg"}
                alt="Profile"
                className="relative w-80 h-80 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-xl group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;