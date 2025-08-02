import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { getTranslatedText, Translatable } from "@/utils/translations";
import { useTranslation } from "react-i18next";
import MultiLingualInput from "./inputs/MultiLingualInput";
import MultiLingualTextarea from "./inputs/MultiLingualTextarea";
import ImageUpload from "./inputs/ImageUpload";

interface AboutMe {
  id: string;
  title: Translatable;
  content: Translatable;
  image_url: string | null;
}

const emptyTranslatable = { en: "", fr: "", ar: "" };

const AboutManager = () => {
  const { i18n } = useTranslation();
  const [aboutData, setAboutData] = useState<AboutMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: { ...emptyTranslatable },
    content: { ...emptyTranslatable },
    image_url: "",
  });

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const { data, error } = await supabase
        .from("about_me")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setAboutData(data);
        const titleData = typeof data.title === 'object' && data.title !== null 
          ? data.title 
          : { en: data.title || "", fr: "", ar: "" };
        
        const contentData = typeof data.content === 'object' && data.content !== null 
          ? data.content 
          : { en: data.content || "", fr: "", ar: "" };

        setFormData({
          title: { ...emptyTranslatable, ...titleData },
          content: { ...emptyTranslatable, ...contentData },
          image_url: data.image_url || "",
        });
      }
    } catch (error) {
      showError("Failed to fetch about data");
    } finally {
      setLoading(false);
    }
  };

  const handleFormDataChange = (field: 'title' | 'content', lang: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const dataToSave = {
      title: formData.title,
      content: formData.content,
      image_url: formData.image_url || null,
    };

    try {
      if (aboutData) {
        const { error } = await supabase
          .from("about_me")
          .update(dataToSave)
          .eq("id", aboutData.id);
        
        if (error) throw error;
        showSuccess("About section updated successfully!");
      } else {
        const { error } = await supabase
          .from("about_me")
          .insert([dataToSave]);
        
        if (error) throw error;
        showSuccess("About section created successfully!");
      }
      
      fetchAboutData();
    } catch (error) {
      showError("Failed to save about data");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading about data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">About Me Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit About Section</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <MultiLingualInput
              id="title"
              label="Title"
              value={formData.title}
              onChange={(lang, value) => handleFormDataChange('title', lang, value)}
              placeholder="About Me"
              required
            />

            <ImageUpload
              bucket="about-me-images"
              label="Profile Image"
              currentImageUrl={formData.image_url}
              onUploadSuccess={(url) => setFormData({ ...formData, image_url: url })}
              onRemove={() => setFormData({ ...formData, image_url: "" })}
            />

            <MultiLingualTextarea
              id="content"
              label="Content"
              value={formData.content}
              onChange={(lang, value) => handleFormDataChange('content', lang, value)}
              placeholder="Write about yourself..."
              required
              rows={10}
            />

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {formData.image_url && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <img
                src={formData.image_url}
                alt="Profile preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-3">
                  {getTranslatedText(formData.title, i18n.language)}
                </h3>
                <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {getTranslatedText(formData.content, i18n.language)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AboutManager;