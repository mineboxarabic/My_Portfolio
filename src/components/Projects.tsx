import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink, Star, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { getTranslatedText, Translatable } from "@/utils/translations";

interface Project {
  id: string;
  name: Translatable;
  description: Translatable;
  tech_stack: string[];
  github_url: string | null;
  live_url: string | null;
  thumbnail_url: string | null;
  stars: number;
  featured: boolean;
}

const Projects = () => {
  const { t, i18n } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [visibleProjects, setVisibleProjects] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isRTL = i18n.dir() === 'rtl';

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleProjects(prev => new Set([...prev, index]));
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '50px 0px -50px 0px'
      }
    );

    const projectElements = document.querySelectorAll('.project-card');
    projectElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [projects]);

  if (loading) {
    return (
      <section id="projects" className="py-20 px-4 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading projects...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="py-20 px-4 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-16 ${isRTL ? 'rtl:text-right' : ''}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('projects.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('projects.subtitle')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <Card 
              key={project.id}
              data-index={index}
              className={`project-card group relative overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 cursor-pointer ${
                visibleProjects.has(index) ? 'visible' : ''
              } ${project.featured ? 'ring-2 ring-blue-500/20' : ''}`}
              style={{ 
                animationDelay: `${index * 150}ms`,
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)'
              }}
              onClick={() => navigate(`/project/${project.id}`)}
            >
              <div className="absolute top-4 flex items-center gap-2 z-10" style={{ [isRTL ? 'left' : 'right']: '1rem' }}>
                {project.featured && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    <Star className="w-3 h-3 me-1" />
                    {t('projects.featured')}
                  </Badge>
                )}
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-2 py-1">
                  <Star className="w-3 h-3 me-1" />
                  {project.stars}
                </div>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {project.thumbnail_url && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={project.thumbnail_url}
                    alt={getTranslatedText(project.name, i18n.language)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="sm" className="bg-white/90 text-gray-900 hover:bg-white">
                      <Eye className="w-4 h-4 me-2" />
                      {t('projects.viewDetails')}
                    </Button>
                  </div>
                </div>
              )}
              
              <CardHeader className="relative z-10">
                <CardTitle className={`text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {getTranslatedText(project.name, i18n.language)}
                </CardTitle>
                <CardDescription className={`text-gray-600 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {getTranslatedText(project.description, i18n.language)}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <div className={`flex flex-wrap gap-2 mb-6 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                  {project.tech_stack.map((tech, techIndex) => (
                    <Badge 
                      key={techIndex} 
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:scale-105 transition-transform duration-200 cursor-default"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
                
                <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {project.github_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 group/btn hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.github_url!, '_blank');
                      }}
                    >
                      <Github className={`w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300 ${isRTL ? 'ml-2' : 'me-2'}`} />
                      {t('projects.code')}
                    </Button>
                  )}
                  {project.live_url && (
                    <Button 
                      size="sm" 
                      className="flex-1 group/btn bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.live_url!, '_blank');
                      }}
                    >
                      <ExternalLink className={`w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300 ${isRTL ? 'ml-2' : 'me-2'}`} />
                      {t('projects.liveDemo')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;