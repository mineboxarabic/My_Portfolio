import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { getTranslatedText, Translatable } from "@/utils/translations";

interface Skill {
  id: string;
  category: Translatable;
  name: Translatable;
  level: number;
  color: string;
}

const Skills = () => {
  const { t, i18n } = useTranslation();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [visibleSkills, setVisibleSkills] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const isRTL = i18n.dir() === 'rtl';

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error("Failed to fetch skills:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    const categoryName = getTranslatedText(skill.category, i18n.language) || t('skills.uncategorized');
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const skillCategories = Object.entries(groupedSkills).map(([category, categorySkills]) => ({
    category,
    skills: categorySkills,
    color: categorySkills[0]?.color || "from-blue-500 to-cyan-500"
  }));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setTimeout(() => {
              setVisibleSkills(prev => [...prev, index]);
            }, index * 200);
          }
        });
      },
      { threshold: 0.1 }
    );

    const skillElements = document.querySelectorAll('.skill-category');
    skillElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [skillCategories]);

  if (loading) {
    return (
      <section id="skills" className="py-20 px-4 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading skills...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="skills" className="py-20 px-4 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-16 ${isRTL ? 'rtl:text-right' : ''}`}>
          <h2 className={`text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 ${isRTL ? 'font-arabic' : ''}`}>
            {t('skills.title')}
          </h2>
          <p className={`text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto ${isRTL ? 'font-arabic' : ''}`}>
            {t('skills.subtitle')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {skillCategories.map((category, categoryIndex) => (
            <Card
              key={category.category}
              data-index={categoryIndex}
              className={`skill-category group bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-500 ${
                visibleSkills.includes(categoryIndex) ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-8'
              }`}
            >
              <CardContent className="p-6">
                <h3 className={`text-2xl font-bold mb-6 ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} ${category.color} bg-clip-text text-transparent ${isRTL ? 'text-right' : ''}`}>
                  {category.category}
                </h3>
                <div className="space-y-4">
                  {category.skills.map((skill, skillIndex) => (
                    <div key={skill.id} className="group/skill">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-medium text-gray-700 dark:text-gray-300 group-hover/skill:text-gray-900 dark:group-hover/skill:text-white transition-colors duration-200 ${isRTL ? 'text-right' : ''}`}>
                          {getTranslatedText(skill.name, i18n.language)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {skill.level}%
                        </span>
                      </div>
                      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden ${isRTL ? 'flex justify-end' : ''}`}>
                        <div
                          className={`h-2 ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} ${skill.color} rounded-full transition-all duration-1000 ease-out ${
                            visibleSkills.includes(categoryIndex) ? 'animate-pulse' : ''
                          }`}
                          style={{
                            width: visibleSkills.includes(categoryIndex) ? `${skill.level}%` : '0%',
                            transitionDelay: `${skillIndex * 100}ms`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;