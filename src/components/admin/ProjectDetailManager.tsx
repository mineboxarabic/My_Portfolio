import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import MultiLingualInput from "./inputs/MultiLingualInput";
import MultiLingualTextarea from "./inputs/MultiLingualTextarea";
import { Translatable } from "@/utils/translations";
import ImageUpload from "./inputs/ImageUpload";
import MultiImageUpload from "./inputs/MultiImageUpload";

interface Project {
  id: string;
  name: Translatable;
}

interface KeyFeature {
  title: Translatable;
  description: Translatable;
  icon: string;
  image_url: string;
}

interface ImpactStat {
  metric: Translatable;
  value: string;
  description: Translatable;
}

interface ProjectDetail {
  id: string;
  hero_image_url: string;
  tagline: Translatable;
  problem_statement: Translatable;
  project_goal: Translatable;
  your_role: Translatable;
  design_decisions: Translatable;
  before_after_images: string[];
  key_features: KeyFeature[];
  challenges: Translatable;
  solutions: Translatable;
  impact_stats: ImpactStat[];
  lessons_learned: Translatable;
  future_improvements: Translatable;
  video_demo_url: string;
}

interface ProjectDetailManagerProps {
  projectId: string;
  onBack: () => void;
}

const emptyTranslatable = { en: "", fr: "", ar: "" };

const getSafeTranslatable = (field: any): Translatable => {
    if (typeof field === 'object' && field !== null && !Array.isArray(field)) {
        return { ...emptyTranslatable, ...field };
    }
    if (typeof field === 'string') {
        return { ...emptyTranslatable, en: field };
    }
    return { ...emptyTranslatable };
};

const ProjectDetailManager = ({ projectId, onBack }: ProjectDetailManagerProps) => {
  const [project, setProject] = useState<Project | null>(null);
  const [details, setDetails] = useState<Partial<ProjectDetail>>({
    hero_image_url: "",
    tagline: { ...emptyTranslatable },
    problem_statement: { ...emptyTranslatable },
    project_goal: { ...emptyTranslatable },
    your_role: { ...emptyTranslatable },
    design_decisions: { ...emptyTranslatable },
    before_after_images: [],
    key_features: [],
    challenges: { ...emptyTranslatable },
    solutions: { ...emptyTranslatable },
    impact_stats: [],
    lessons_learned: { ...emptyTranslatable },
    future_improvements: { ...emptyTranslatable },
    video_demo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjectAndDetails();
  }, [projectId]);

  const fetchProjectAndDetails = async () => {
    setLoading(true);
    try {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, name")
        .eq("id", projectId)
        .single();
      if (projectError) throw projectError;
      setProject(projectData);

      const { data: detailsData, error: detailsError } = await supabase
        .from("project_details")
        .select("*")
        .eq("id", projectId)
        .single();
      if (detailsError && detailsError.code !== 'PGRST116') throw detailsError;

      if (detailsData) {
        setDetails({
          ...detailsData,
          tagline: getSafeTranslatable(detailsData.tagline),
          problem_statement: getSafeTranslatable(detailsData.problem_statement),
          project_goal: getSafeTranslatable(detailsData.project_goal),
          your_role: getSafeTranslatable(detailsData.your_role),
          design_decisions: getSafeTranslatable(detailsData.design_decisions),
          challenges: getSafeTranslatable(detailsData.challenges),
          solutions: getSafeTranslatable(detailsData.solutions),
          lessons_learned: getSafeTranslatable(detailsData.lessons_learned),
          future_improvements: getSafeTranslatable(detailsData.future_improvements),
          key_features: (detailsData.key_features || []).map((f: any) => ({
            ...f,
            title: getSafeTranslatable(f.title),
            description: getSafeTranslatable(f.description),
          })),
          impact_stats: (detailsData.impact_stats || []).map((s: any) => ({
            ...s,
            metric: getSafeTranslatable(s.metric),
            description: getSafeTranslatable(s.description),
          })),
        });
      }
    } catch (error) {
      showError("Failed to fetch project details");
    } finally {
      setLoading(false);
    }
  };

  const handleDetailChange = (field: keyof Omit<ProjectDetail, 'id' | 'before_after_images' | 'key_features' | 'impact_stats'>, lang: string, value: string) => {
    setDetails(prev => {
      const currentField = prev[field];
      const baseObject = typeof currentField === 'object' && currentField !== null && !Array.isArray(currentField)
        ? currentField
        : {};
      
      return {
        ...prev,
        [field]: {
          ...baseObject,
          [lang]: value,
        },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("project_details")
        .upsert({ id: projectId, ...details });
      if (error) throw error;
      showSuccess("Project details saved successfully!");
    } catch (error) {
      showError("Failed to save project details");
    } finally {
      setSaving(false);
    }
  };

  const addKeyFeature = () => setDetails(prev => ({ ...prev, key_features: [...(prev.key_features || []), { title: {...emptyTranslatable}, description: {...emptyTranslatable}, icon: "", image_url: "" }] }));
  const removeKeyFeature = (index: number) => setDetails(prev => ({ ...prev, key_features: prev.key_features?.filter((_, i) => i !== index) }));
  const updateKeyFeature = (index: number, field: 'title' | 'description', lang: string, value: string) => {
    setDetails(prev => ({ ...prev, key_features: prev.key_features?.map((f, i) => {
      if (i !== index) return f;
      const currentField = f[field];
      const baseObject = typeof currentField === 'object' && currentField !== null && !Array.isArray(currentField) ? currentField : {};
      return { ...f, [field]: { ...baseObject, [lang]: value } };
    })}));
  };
  const updateKeyFeatureField = (index: number, field: 'icon' | 'image_url', value: string) => {
    setDetails(prev => ({ ...prev, key_features: prev.key_features?.map((f, i) => i === index ? { ...f, [field]: value } : f) }));
  };

  const addImpactStat = () => setDetails(prev => ({ ...prev, impact_stats: [...(prev.impact_stats || []), { metric: {...emptyTranslatable}, value: "", description: {...emptyTranslatable} }] }));
  const removeImpactStat = (index: number) => setDetails(prev => ({ ...prev, impact_stats: prev.impact_stats?.filter((_, i) => i !== index) }));
  const updateImpactStat = (index: number, field: 'metric' | 'description', lang: string, value: string) => {
    setDetails(prev => ({ ...prev, impact_stats: prev.impact_stats?.map((s, i) => {
      if (i !== index) return s;
      const currentField = s[field];
      const baseObject = typeof currentField === 'object' && currentField !== null && !Array.isArray(currentField) ? currentField : {};
      return { ...s, [field]: { ...baseObject, [lang]: value } };
    })}));
  };
  const updateImpactStatField = (index: number, field: 'value', value: string) => {
    setDetails(prev => ({ ...prev, impact_stats: prev.impact_stats?.map((s, i) => i === index ? { ...s, [field]: value } : s) }));
  };

  if (loading) return <div className="text-center py-8">Loading project details...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="outline" onClick={onBack} className="mb-4">← Back to Projects</Button>
          <h2 className="text-2xl font-bold">Edit Project Details: {getSafeTranslatable(project?.name).en}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to={`/project/${projectId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Project
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex items-center"><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save All Changes"}</Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hero">Hero & Overview</TabsTrigger>
          <TabsTrigger value="features">Features & Design</TabsTrigger>
          <TabsTrigger value="challenges">Challenges & Impact</TabsTrigger>
          <TabsTrigger value="reflection">Reflection</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>Hero Section</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                bucket="project-images"
                label="Hero Image"
                currentImageUrl={details.hero_image_url}
                onUploadSuccess={(url) => setDetails(prev => ({ ...prev, hero_image_url: url }))}
                onRemove={() => setDetails(prev => ({ ...prev, hero_image_url: "" }))}
              />
              <MultiLingualInput id="tagline" label="Tagline" value={details.tagline as Translatable} onChange={(lang, val) => handleDetailChange('tagline', lang, val)} />
              <div><Label htmlFor="video_demo">Video Demo URL</Label><Input id="video_demo" value={details.video_demo_url || ""} onChange={(e) => setDetails(prev => ({ ...prev, video_demo_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Project Overview</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <MultiLingualTextarea id="problem" label="Problem Statement" value={details.problem_statement as Translatable} onChange={(lang, val) => handleDetailChange('problem_statement', lang, val)} rows={4} />
              <MultiLingualTextarea id="goal" label="Project Goal" value={details.project_goal as Translatable} onChange={(lang, val) => handleDetailChange('project_goal', lang, val)} rows={4} />
              <MultiLingualTextarea id="role" label="Your Role" value={details.your_role as Translatable} onChange={(lang, val) => handleDetailChange('your_role', lang, val)} rows={4} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>Design & UX Decisions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <MultiLingualTextarea id="design" label="Design Decisions" value={details.design_decisions as Translatable} onChange={(lang, val) => handleDetailChange('design_decisions', lang, val)} rows={6} />
              <MultiImageUpload
                bucket="project-images"
                label="Before/After Images"
                imageUrls={details.before_after_images || []}
                onUrlsChange={(urls) => setDetails(prev => ({ ...prev, before_after_images: urls }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><div className="flex justify-between items-center"><CardTitle>Key Features</CardTitle><Button onClick={addKeyFeature}><Plus className="w-4 h-4 mr-2" />Add Feature</Button></div></CardHeader>
            <CardContent className="space-y-4">{details.key_features?.map((feature, index) => (
              <Card key={index}><CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start"><h4 className="font-medium pt-2">Feature {index + 1}</h4><Button variant="outline" size="sm" onClick={() => removeKeyFeature(index)}><Trash2 className="w-4 h-4" /></Button></div>
                <MultiLingualInput id={`kf-title-${index}`} label="Title" value={feature.title as Translatable} onChange={(lang, val) => updateKeyFeature(index, 'title', lang, val)} />
                <MultiLingualTextarea id={`kf-desc-${index}`} label="Description" value={feature.description as Translatable} onChange={(lang, val) => updateKeyFeature(index, 'description', lang, val)} rows={3} />
                <div><Label>Icon (emoji or text)</Label><Input value={feature.icon} onChange={(e) => updateKeyFeatureField(index, 'icon', e.target.value)} placeholder="🔐" /></div>
                <ImageUpload
                  bucket="project-images"
                  label="Image (optional)"
                  currentImageUrl={feature.image_url}
                  onUploadSuccess={(url) => updateKeyFeatureField(index, 'image_url', url)}
                  onRemove={() => updateKeyFeatureField(index, 'image_url', "")}
                />
              </CardContent></Card>
            ))}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>Challenges & Solutions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <MultiLingualTextarea id="challenges" label="Challenges Faced" value={details.challenges as Translatable} onChange={(lang, val) => handleDetailChange('challenges', lang, val)} rows={6} />
              <MultiLingualTextarea id="solutions" label="Solutions Implemented" value={details.solutions as Translatable} onChange={(lang, val) => handleDetailChange('solutions', lang, val)} rows={6} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><div className="flex justify-between items-center"><CardTitle>Impact & Results</CardTitle><Button onClick={addImpactStat}><Plus className="w-4 h-4 mr-2" />Add Stat</Button></div></CardHeader>
            <CardContent className="space-y-4">{details.impact_stats?.map((stat, index) => (
              <Card key={index}><CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start"><h4 className="font-medium pt-2">Stat {index + 1}</h4><Button variant="outline" size="sm" onClick={() => removeImpactStat(index)}><Trash2 className="w-4 h-4" /></Button></div>
                <MultiLingualInput id={`is-metric-${index}`} label="Metric" value={stat.metric as Translatable} onChange={(lang, val) => updateImpactStat(index, 'metric', lang, val)} />
                <MultiLingualTextarea id={`is-desc-${index}`} label="Description" value={stat.description as Translatable} onChange={(lang, val) => updateImpactStat(index, 'description', lang, val)} rows={2} />
                <div><Label>Value</Label><Input value={stat.value} onChange={(e) => updateImpactStatField(index, 'value', e.target.value)} placeholder="10,000+" /></div>
              </CardContent></Card>
            ))}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reflection" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle>Lessons & Future Improvements</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <MultiLingualTextarea id="lessons" label="Lessons Learned" value={details.lessons_learned as Translatable} onChange={(lang, val) => handleDetailChange('lessons_learned', lang, val)} rows={6} />
              <MultiLingualTextarea id="improvements" label="Future Improvements" value={details.future_improvements as Translatable} onChange={(lang, val) => handleDetailChange('future_improvements', lang, val)} rows={6} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetailManager;