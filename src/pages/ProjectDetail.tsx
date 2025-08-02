import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Github, ExternalLink, Play, Star, ChevronDown, Target, User, Lightbulb, Zap, TrendingUp, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import DarkModeToggle from "@/components/DarkModeToggle";
import Footer from "@/components/Footer";
import { getTranslatedText, Translatable } from "@/utils/translations";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface KeyFeature {
  title: Translatable;
  description: Translatable;
  icon: string | null;
  image_url: string | null;
}

interface ImpactStat {
  metric: Translatable;
  value: string;
  description: Translatable;
}

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

interface Details {
  hero_image_url: string | null;
  tagline: Translatable;
  problem_statement: Translatable;
  project_goal: Translatable;
  your_role: Translatable;
  design_decisions: Translatable;
  before_after_images: string[] | null;
  key_features: KeyFeature[] | null;
  challenges: Translatable;
  solutions: Translatable;
  impact_stats: ImpactStat[] | null;
  lessons_learned: Translatable;
  future_improvements: Translatable;
  video_demo_url: string | null;
}

type FullProject = Project & Details;

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [project, setProject] = useState<FullProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProject(id);
    }
  }, [id]);

  const fetchProject = async (projectId: string) => {
    try {
      const { data: basicProject, error: basicError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (basicError) throw basicError;

      const { data: detailsData, error: detailsError } = await supabase
        .from("project_details")
        .select("*")
        .eq("id", projectId)
        .single();

      if (detailsError && detailsError.code !== 'PGRST116') {
        throw detailsError;
      }

      const combinedProject: FullProject = {
        ...basicProject,
        hero_image_url: detailsData?.hero_image_url || basicProject.thumbnail_url,
        tagline: detailsData?.tagline || null,
        problem_statement: detailsData?.problem_statement || null,
        project_goal: detailsData?.project_goal || null,
        your_role: detailsData?.your_role || null,
        design_decisions: detailsData?.design_decisions || null,
        before_after_images: detailsData?.before_after_images || null,
        key_features: detailsData?.key_features || null,
        challenges: detailsData?.challenges || null,
        solutions: detailsData?.solutions || null,
        impact_stats: detailsData?.impact_stats || null,
        lessons_learned: detailsData?.lessons_learned || null,
        future_improvements: detailsData?.future_improvements || null,
        video_demo_url: detailsData?.video_demo_url || null,
      };

      setProject(combinedProject);
    } catch (error) {
      console.error("Failed to fetch project:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">{t('projectDetail.loading')}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{t('projectDetail.projectNotFound')}</h1>
          <Button onClick={() => navigate("/")} size="lg">{t('projectDetail.goBackHome')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      <DarkModeToggle />
      
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-8 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 me-2" />
            {t('projectDetail.backToPortfolio')}
          </Button>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent leading-tight">
                    {getTranslatedText(project.name, i18n.language)}
                  </h1>
                  {project.featured && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 text-sm">
                      <Star className="w-4 h-4 me-1" />
                      {t('projects.featured')}
                    </Badge>
                  )}
                </div>
                
                {project.tagline && (
                  <p className="text-2xl text-gray-600 dark:text-gray-300 font-light leading-relaxed">
                    {getTranslatedText(project.tagline, i18n.language)}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                {project.live_url && (
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => window.open(project.live_url!, '_blank')}
                  >
                    <ExternalLink className="w-5 h-5 me-2" />
                    {t('projectDetail.viewLiveDemo')}
                  </Button>
                )}
                {project.github_url && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 px-8 py-4 text-lg font-semibold"
                    onClick={() => window.open(project.github_url!, '_blank')}
                  >
                    <Github className="w-5 h-5 me-2" />
                    {t('projectDetail.viewCode')}
                  </Button>
                )}
                {project.video_demo_url && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 px-8 py-4 text-lg font-semibold"
                    onClick={() => window.open(project.video_demo_url!, '_blank')}
                  >
                    <Play className="w-5 h-5 me-2" />
                    {t('projectDetail.watchDemo')}
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('projectDetail.builtWith')}</h3>
                <div className="flex flex-wrap gap-3">
                  {project.tech_stack.map((tech, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="px-4 py-2 text-sm font-medium bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform duration-200"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              {project.hero_image_url && (
                <div className="relative group">
                  <div className="absolute -inset-6 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-300"></div>
                  <img
                    src={project.hero_image_url}
                    alt={getTranslatedText(project.name, i18n.language)}
                    className="relative w-full rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {(project.problem_statement || project.project_goal || project.your_role) && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              {t('projectDetail.projectOverview')}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {project.problem_statement && (
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-red-600 dark:text-red-400">
                      <Target className="w-6 h-6" />
                      {t('projectDetail.theChallenge')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {getTranslatedText(project.problem_statement, i18n.language)}
                    </p>
                  </CardContent>
                </Card>
              )}
              {project.project_goal && (
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-green-600 dark:text-green-400">
                      <Zap className="w-6 h-6" />
                      {t('projectDetail.theSolution')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {getTranslatedText(project.project_goal, i18n.language)}
                    </p>
                  </CardContent>
                </Card>
              )}
              {project.your_role && (
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                      <User className="w-6 h-6" />
                      {t('projectDetail.myRole')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {getTranslatedText(project.your_role, i18n.language)}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      {project.key_features && project.key_features.length > 0 && (
        <section className="py-16 px-4 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              {t('projectDetail.keyFeatures')}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {project.key_features.map((feature, index) => (
                <Card key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      {feature.icon && (
                        <span className="text-3xl">{feature.icon}</span>
                      )}
                      <span className="text-gray-900 dark:text-white">{getTranslatedText(feature.title, i18n.language)}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {getTranslatedText(feature.description, i18n.language)}
                    </p>
                    {feature.image_url && (
                      <img
                        src={feature.image_url}
                        alt={getTranslatedText(feature.title, i18n.language)}
                        className="w-full rounded-lg shadow-md"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {project.impact_stats && project.impact_stats.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              {t('projectDetail.projectImpact')}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {project.impact_stats.map((stat, index) => (
                <Card key={index} className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {getTranslatedText(stat.metric, i18n.language)}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300">
                      {getTranslatedText(stat.description, i18n.language)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 px-4 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            {t('projectDetail.projectDetails')}
          </h2>

          {project.design_decisions && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-purple-600 dark:text-purple-400">
                      <div className="flex items-center gap-3">
                        <Lightbulb className="w-6 h-6" />
                        {t('projectDetail.designAndUx')}
                      </div>
                      <ChevronDown className="w-5 h-5" />
                    </CardTitle>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0">
                  <CardContent className="p-6">
                    <MarkdownRenderer>
                      {getTranslatedText(project.design_decisions, i18n.language)}
                    </MarkdownRenderer>
                    {project.before_after_images && project.before_after_images.length > 0 && (
                      <div className="grid md:grid-cols-2 gap-6 mt-6">
                        {project.before_after_images.map((imageUrl, index) => (
                          <img
                            key={index}
                            src={imageUrl}
                            alt={`Design ${index + 1}`}
                            className="w-full rounded-lg shadow-lg"
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}

          {(project.challenges || project.solutions) && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-orange-600 dark:text-orange-400">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-6 h-6" />
                        {t('projectDetail.challengesAndSolutions')}
                      </div>
                      <ChevronDown className="w-5 h-5" />
                    </CardTitle>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 space-y-4">
                  {project.challenges && (
                    <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0">
                      <CardHeader>
                        <CardTitle className="text-red-600 dark:text-red-400 text-lg">{t('projectDetail.challengesFaced')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MarkdownRenderer>
                          {getTranslatedText(project.challenges, i18n.language)}
                        </MarkdownRenderer>
                      </CardContent>
                    </Card>
                  )}
                  {project.solutions && (
                    <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0">
                      <CardHeader>
                        <CardTitle className="text-green-600 dark:text-green-400 text-lg">{t('projectDetail.solutionsImplemented')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MarkdownRenderer>
                          {getTranslatedText(project.solutions, i18n.language)}
                        </MarkdownRenderer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {(project.lessons_learned || project.future_improvements) && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6" />
                        {t('projectDetail.lessonsAndFuture')}
                      </div>
                      <ChevronDown className="w-5 h-5" />
                    </CardTitle>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 space-y-4">
                  {project.lessons_learned && (
                    <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0">
                      <CardHeader>
                        <CardTitle className="text-purple-600 dark:text-purple-400 text-lg">{t('projectDetail.lessonsLearned')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MarkdownRenderer>
                          {getTranslatedText(project.lessons_learned, i18n.language)}
                        </MarkdownRenderer>
                      </CardContent>
                    </Card>
                  )}
                  {project.future_improvements && (
                    <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0">
                      <CardHeader>
                        <CardTitle className="text-blue-600 dark:text-blue-400 text-lg">{t('projectDetail.futureImprovements')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MarkdownRenderer>
                          {getTranslatedText(project.future_improvements, i18n.language)}
                        </MarkdownRenderer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProjectDetail;