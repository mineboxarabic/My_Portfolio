import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import MultiLingualInput from "./inputs/MultiLingualInput";
import { getTranslatedText, Translatable } from "@/utils/translations";
import { useTranslation } from "react-i18next";

interface Skill {
  id: string;
  category: Translatable;
  name: Translatable;
  level: number;
  color: string;
}

const emptyTranslatable = { en: "", fr: "", ar: "" };

const SkillsManager = () => {
  const { i18n } = useTranslation();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    category: { ...emptyTranslatable },
    name: { ...emptyTranslatable },
    level: 50,
    color: "from-blue-500 to-cyan-500",
  });

  const colorOptions = [
    { value: "from-blue-500 to-cyan-500", label: "Blue to Cyan" },
    { value: "from-green-500 to-emerald-500", label: "Green to Emerald" },
    { value: "from-purple-500 to-pink-500", label: "Purple to Pink" },
    { value: "from-red-500 to-orange-500", label: "Red to Orange" },
    { value: "from-yellow-500 to-amber-500", label: "Yellow to Amber" },
  ];

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
      showError("Failed to fetch skills");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: { ...emptyTranslatable },
      name: { ...emptyTranslatable },
      level: 50,
      color: "from-blue-500 to-cyan-500",
    });
    setEditingSkill(null);
    setIsCreating(false);
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      category: typeof skill.category === 'object' && skill.category !== null ? skill.category : { en: skill.category || '' },
      name: typeof skill.name === 'object' && skill.name !== null ? skill.name : { en: skill.name || '' },
      level: skill.level,
      color: skill.color,
    });
    setIsCreating(false);
  };
  
  const handleFormDataChange = (field: 'name' | 'category', lang: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...(typeof prev[field] === 'object' ? prev[field] : {}),
        [lang]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSkill) {
        const { error } = await supabase
          .from("skills")
          .update(formData)
          .eq("id", editingSkill.id);
        
        if (error) throw error;
        showSuccess("Skill updated successfully!");
      } else {
        const { error } = await supabase
          .from("skills")
          .insert([formData]);
        
        if (error) throw error;
        showSuccess("Skill created successfully!");
      }
      
      fetchSkills();
      resetForm();
    } catch (error) {
      showError("Failed to save skill");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) return;

    try {
      const { error } = await supabase
        .from("skills")
        .delete()
        .eq("id", id);

      if (error) throw error;
      showSuccess("Skill deleted successfully!");
      fetchSkills();
    } catch (error) {
      showError("Failed to delete skill");
    }
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    const categoryName = getTranslatedText(skill.category, i18n.language) || "Uncategorized";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  if (loading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Skills Management</h2>
        <Button
          onClick={() => setIsCreating(true)}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Skill
        </Button>
      </div>

      {(isCreating || editingSkill) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSkill ? "Edit Skill" : "Create New Skill"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiLingualInput
                  id="category"
                  label="Category"
                  value={formData.category}
                  onChange={(lang, value) => handleFormDataChange('category', lang, value)}
                  placeholder="Frontend, Backend, etc."
                  required
                />
                <MultiLingualInput
                  id="name"
                  label="Skill Name"
                  value={formData.name}
                  onChange={(lang, value) => handleFormDataChange('name', lang, value)}
                  placeholder="React, Node.js, etc."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Skill Level (%)</Label>
                  <Input
                    id="level"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color Theme</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit">
                  {editingSkill ? "Update" : "Create"} Skill
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {Object.entries(groupedSkills).map(([category, categorySkills]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categorySkills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium">{getTranslatedText(skill.name, i18n.language)}</span>
                        <Badge variant="outline">{skill.level}%</Badge>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 bg-gradient-to-r ${skill.color} rounded-full`}
                          style={{ width: `${skill.level}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(skill)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(skill.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SkillsManager;