import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Star, Settings, Upload, Download, BrainCircuit, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import ProjectDetailManager from "./ProjectDetailManager";
import MultiLingualInput from "./inputs/MultiLingualInput";
import MultiLingualTextarea from "./inputs/MultiLingualTextarea";
import { getTranslatedText } from "@/utils/translations";
import { useTranslation } from "react-i18next";
import ImageUpload from "./inputs/ImageUpload";

type Translatable = Record<string, string>;

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

const emptyTranslatable = { en: "", fr: "", ar: "" };

const initialFormData = {
  name: { ...emptyTranslatable },
  description: { ...emptyTranslatable },
  tech_stack: "",
  github_url: "",
  live_url: "",
  thumbnail_url: "",
  stars: 0,
  featured: false,
};

const ProjectsManager = () => {
  const { i18n } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingDetails, setEditingDetails] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [isGenerationDialogOpen, setIsGenerationDialogOpen] = useState(false);

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      showError("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingProject(null);
    setIsCreating(false);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: { ...emptyTranslatable, ...(typeof project.name === 'object' ? project.name : { en: project.name }) },
      description: { ...emptyTranslatable, ...(typeof project.description === 'object' ? project.description : { en: project.description }) },
      tech_stack: project.tech_stack.join(", "),
      github_url: project.github_url || "",
      live_url: project.live_url || "",
      thumbnail_url: project.thumbnail_url || "",
      stars: project.stars,
      featured: project.featured,
    });
    setIsCreating(false);
  };

  const handleFormDataChange = (field: 'name' | 'description', lang: string, value: string) => {
    setFormData(prev => {
      const currentField = prev[field];
      const baseObject = typeof currentField === 'object' && currentField !== null
        ? currentField
        : {};

      return {
        ...prev,
        [field]: {
          ...baseObject,
          [lang]: value
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData = {
      name: formData.name,
      description: formData.description,
      tech_stack: formData.tech_stack.split(",").map(s => s.trim()),
      github_url: formData.github_url || null,
      live_url: formData.live_url || null,
      thumbnail_url: formData.thumbnail_url || null,
      stars: formData.stars,
      featured: formData.featured,
    };

    try {
      if (editingProject) {
        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", editingProject.id);
        
        if (error) throw error;
        showSuccess("Project updated successfully!");
      } else {
        const { error } = await supabase
          .from("projects")
          .insert([projectData]);
        
        if (error) throw error;
        showSuccess("Project created successfully!");
      }
      
      fetchProjects();
      resetForm();
    } catch (error) {
      showError("Failed to save project");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
      showSuccess("Project deleted successfully!");
      fetchProjects();
    } catch (error) {
      showError("Failed to delete project");
    }
  };

  const handleExport = async () => {
    try {
      const { data: projects, error: projectsError } = await supabase.from("projects").select("*");
      if (projectsError) throw projectsError;

      const { data: details, error: detailsError } = await supabase.from("project_details").select("*");
      if (detailsError) throw detailsError;

      const detailsMap = new Map(details.map(d => [d.id, d]));

      const exportData = projects.map(p => {
        const projectDetails = detailsMap.get(p.id);
        const { id, ...restOfDetails } = projectDetails || {};
        return {
          ...p,
          details: projectDetails ? restOfDetails : null,
        };
      });

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `portfolio_projects_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess("Projects exported successfully!");
    } catch (error) {
      showError("Failed to export projects.");
      console.error(error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          showError("Invalid file content.");
          return;
        }
        const importedData = JSON.parse(content);

        if (!Array.isArray(importedData)) {
          showError("Invalid JSON format. Expected an array of projects.");
          return;
        }

        const projectsToUpsert = [];
        const detailsToUpsert = [];

        for (const item of importedData) {
          const { details, ...projectData } = item;
          if (!projectData.id || !projectData.name || typeof projectData.name !== 'object') {
            console.warn("Skipping invalid project item:", item);
            continue;
          }
          projectsToUpsert.push(projectData);
          if (details) {
            detailsToUpsert.push({ id: projectData.id, ...details });
          }
        }

        if (projectsToUpsert.length > 0) {
          const { error: projectsError } = await supabase.from("projects").upsert(projectsToUpsert, { onConflict: 'id' });
          if (projectsError) throw projectsError;
        }

        if (detailsToUpsert.length > 0) {
          const { error: detailsError } = await supabase.from("project_details").upsert(detailsToUpsert, { onConflict: 'id' });
          if (detailsError) throw detailsError;
        }

        showSuccess(`${projectsToUpsert.length} projects imported successfully!`);
        fetchProjects();
      } catch (error) {
        showError("Failed to import projects. Check file format and console for details.");
        console.error(error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleGenerateProject = async () => {
    if (!generationPrompt) {
      showError("Please enter a prompt for your project.");
      return;
    }
    setIsGenerating(true);
    try {
      const { data: newProject, error } = await supabase.functions.invoke('generate-full-project', {
        body: { prompt: generationPrompt },
      });

      if (error) throw new Error(error.message);
      if (newProject.error) throw new Error(newProject.error);
      if (!newProject) throw new Error("AI generation failed to return project data.");
      
      showSuccess("New project generated! Please review and save.");
      
      await fetchProjects();
      
      handleEdit(newProject as Project);
      
      setIsGenerationDialogOpen(false);
      setGenerationPrompt("");

    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate project.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (editingDetails) {
    return (
      <ProjectDetailManager
        projectId={editingDetails}
        onBack={() => setEditingDetails(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">Loading projects...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects Management</h2>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            id="import-json"
            className="hidden"
            accept=".json"
            onChange={handleImport}
          />
          <Button asChild variant="outline">
            <Label htmlFor="import-json" className="cursor-pointer flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Label>
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isGenerationDialogOpen} onOpenChange={setIsGenerationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <BrainCircuit className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate New Project with AI</DialogTitle>
                <DialogDescription>
                  Describe your project idea. The AI will generate a name, description, tech stack, and a thumbnail image to get you started.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="prompt">Project Idea</Label>
                <Textarea
                  id="prompt"
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  placeholder="e.g., 'A real-time chat application using React, Socket.io, and a Node.js backend.'"
                  rows={4}
                  className="mt-1"
                />
              </div>
              <DialogFooter>
                <Button onClick={handleGenerateProject} disabled={isGenerating || !generationPrompt}>
                  {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : "Generate Project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => {
              setIsCreating(true);
              setEditingProject(null);
              setFormData(initialFormData);
            }}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>

      {(isCreating || editingProject) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProject ? "Edit Project" : "Create New Project"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <MultiLingualInput
                id="name"
                label="Project Name"
                value={formData.name}
                onChange={(lang, value) => handleFormDataChange('name', lang, value)}
                required
              />
              
              <ImageUpload
                bucket="project-images"
                label="Thumbnail Image"
                currentImageUrl={formData.thumbnail_url}
                onUploadSuccess={(url) => setFormData({ ...formData, thumbnail_url: url })}
                onRemove={() => setFormData({ ...formData, thumbnail_url: "" })}
              />

              <MultiLingualTextarea
                id="description"
                label="Description"
                value={formData.description}
                onChange={(lang, value) => handleFormDataChange('description', lang, value)}
                required
                rows={3}
              />

              <div>
                <Label htmlFor="tech_stack">Tech Stack (comma-separated)</Label>
                <Input
                  id="tech_stack"
                  value={formData.tech_stack}
                  onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                  placeholder="React, Node.js, MongoDB"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="github_url">GitHub URL</Label>
                  <Input
                    id="github_url"
                    value={formData.github_url}
                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                    placeholder="https://github.com/username/repo"
                  />
                </div>
                <div>
                  <Label htmlFor="live_url">Live URL</Label>
                  <Input
                    id="live_url"
                    value={formData.live_url}
                    onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                    placeholder="https://project-demo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stars">Stars</Label>
                  <Input
                    id="stars"
                    type="number"
                    value={formData.stars}
                    onChange={(e) => setFormData({ ...formData, stars: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                  />
                  <Label htmlFor="featured">Featured Project</Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit">
                  {editingProject ? "Update" : "Create"} Project
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{getTranslatedText(project.name, i18n.language)}</h3>
                    {project.featured && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    <Badge variant="outline">
                      <Star className="w-3 h-3 mr-1" />
                      {project.stars}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {getTranslatedText(project.description, i18n.language)}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.tech_stack.map((tech, index) => (
                      <Badge key={index} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  {project.thumbnail_url && (
                    <img
                      src={project.thumbnail_url}
                      alt={getTranslatedText(project.name, i18n.language)}
                      className="w-20 h-20 object-cover rounded border"
                    />
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDetails(project.id)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(project)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(project.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectsManager;