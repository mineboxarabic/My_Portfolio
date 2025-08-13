import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, RefreshCw, Loader2, BrainCircuit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import MultiLingualInput from "./inputs/MultiLingualInput";
import MultiLingualTextarea from "./inputs/MultiLingualTextarea";
import { getTranslatedText, Translatable } from "@/utils/translations";
import { useTranslation } from "react-i18next";
import MultiLingualRichTextEditor from "./inputs/MultiLingualRichTextEditor";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "./inputs/ImageUpload";

interface Post {
  id: string;
  title: Translatable;
  excerpt: Translatable;
  content: Translatable;
  slug: string;
  featured_image_url: string | null;
  published_at: string | null;
}

const emptyTranslatable = { en: "", fr: "", ar: "" };

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const BlogManager = () => {
  const { i18n } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [generationTopic, setGenerationTopic] = useState("");

  const [formData, setFormData] = useState({
    title: { ...emptyTranslatable },
    excerpt: { ...emptyTranslatable },
    content: { ...emptyTranslatable },
    slug: "",
    featured_image_url: "",
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      showError("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: { ...emptyTranslatable },
      excerpt: { ...emptyTranslatable },
      content: { ...emptyTranslatable },
      slug: "",
      featured_image_url: "",
    });
    setEditingPost(null);
    setIsCreating(false);
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setFormData({
      title: typeof post.title === 'object' ? post.title : { en: post.title || '' },
      excerpt: typeof post.excerpt === 'object' ? post.excerpt : { en: post.excerpt || '' },
      content: typeof post.content === 'object' ? post.content : { en: post.content || '' },
      slug: post.slug || slugify(getTranslatedText(post.title, 'en')),
      featured_image_url: post.featured_image_url || "",
    });
    setIsCreating(true);
  };

  const handleFormDataChange = (field: 'title' | 'excerpt' | 'content', lang: string, value: string) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: {
          ...prev[field],
          [lang]: value
        }
      };
      if (field === 'title' && lang === 'en' && !editingPost && value) {
        newFormData.slug = slugify(value);
      }
      return newFormData;
    });
  };

  const handleSave = async (publish: boolean) => {
    let finalSlug = formData.slug;
    if (!finalSlug) {
      const englishTitle = formData.title.en;
      if (englishTitle) {
        finalSlug = slugify(englishTitle);
      } else {
        showError("Please provide a title or slug");
        return;
      }
    }

    const postData = {
      ...formData,
      slug: finalSlug,
      featured_image_url: formData.featured_image_url || null,
      published_at: publish ? new Date().toISOString() : (editingPost?.published_at || null),
    };

    try {
      if (editingPost) {
        const { error } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", editingPost.id);
        if (error) throw error;
        showSuccess("Post updated successfully!");
      } else {
        const { error } = await supabase
          .from("posts")
          .insert([postData]);
        if (error) throw error;
        showSuccess("Post created successfully!");
      }
      fetchPosts();
      resetForm();
    } catch (error) {
      showError(`Failed to save post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
      showSuccess("Post deleted successfully!");
      fetchPosts();
    } catch (error) {
      showError("Failed to delete post");
    }
  };

  const fixEmptySlugs = async () => {
    try {
      const postsWithEmptySlugs = posts.filter(post => !post.slug);
      
      for (const post of postsWithEmptySlugs) {
        const englishTitle = getTranslatedText(post.title, 'en');
        if (englishTitle) {
          const newSlug = slugify(englishTitle);
          const { error } = await supabase
            .from("posts")
            .update({ slug: newSlug })
            .eq("id", post.id);
          
          if (error) throw error;
        }
      }
      
      if (postsWithEmptySlugs.length > 0) {
        showSuccess(`Fixed ${postsWithEmptySlugs.length} posts with empty slugs`);
        fetchPosts();
      } else {
        showSuccess("All posts already have slugs");
      }
    } catch (error) {
      showError("Failed to fix empty slugs");
    }
  };

  const handleGeneratePost = async () => {
    if (!generationTopic) {
      showError("Please enter a topic.");
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-post', {
        body: { topic: generationTopic },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      resetForm();
      setFormData({
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        slug: slugify(data.title.en),
        featured_image_url: data.featured_image_url,
      });
      
      setIsCreating(true);
      setEditingPost(null);
      setGenerationTopic("");
      setShowPromptInput(false);
      showSuccess("Blog post generated! Please review and save.");

    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate blog post.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading posts...</div>;

  if (isCreating || editingPost) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{editingPost ? "Edit Post" : "Create New Post"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MultiLingualInput id="title" label="Post Title" value={formData.title} onChange={(lang, val) => handleFormDataChange('title', lang, val)} required />
          <div>
            <Label htmlFor="slug">URL Slug</Label>
            <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })} required />
            <p className="text-sm text-gray-500 mt-1">URL will be: /blog/{formData.slug}</p>
          </div>
          <ImageUpload
            bucket="blog-images"
            label="Featured Image"
            currentImageUrl={formData.featured_image_url}
            onUploadSuccess={(url) => setFormData({ ...formData, featured_image_url: url })}
            onRemove={() => setFormData({ ...formData, featured_image_url: "" })}
          />
          <MultiLingualTextarea id="excerpt" label="Excerpt (Short Summary)" value={formData.excerpt} onChange={(lang, val) => handleFormDataChange('excerpt', lang, val)} required rows={3} />
          <MultiLingualRichTextEditor
            id="content"
            label="Content"
            value={formData.content}
            onChange={(lang, val) => handleFormDataChange('content', lang, val)}
            placeholder="Start writing your blog post here..."
          />
          <div className="flex space-x-2">
            <Button onClick={() => handleSave(true)}>
              {editingPost?.published_at ? 'Update Post' : 'Publish'}
            </Button>
            <Button variant="secondary" onClick={() => handleSave(false)}>Save as Draft</Button>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Blog Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fixEmptySlugs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Fix Empty Slugs
          </Button>
          <Button variant="outline" onClick={() => setShowPromptInput(!showPromptInput)}>
            <BrainCircuit className="h-4 w-4 mr-2" />
            Generate Post with AI
          </Button>
          <Button onClick={() => { resetForm(); setIsCreating(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Post
          </Button>
        </div>
      </div>
      
      {showPromptInput && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate Blog Post with AI</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter a detailed topic or prompt, and the AI will write a complete, multi-language blog post with a featured image for you.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">Blog Post Topic/Prompt</Label>
                <Textarea
                  id="topic"
                  value={generationTopic}
                  onChange={(e) => setGenerationTopic(e.target.value)}
                  placeholder="e.g., 'A detailed blog post about the future of web development, focusing on AI, WebAssembly, and serverless architecture. The tone should be informative but accessible to a non-technical audience.'"
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleGeneratePost}
                  disabled={isGenerating || !generationTopic}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowPromptInput(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{getTranslatedText(post.title, i18n.language)}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Badge variant={post.published_at ? "default" : "secondary"}>
                    {post.published_at ? "Published" : "Draft"}
                  </Badge>
                  <span>Slug: /blog/{post.slug || "EMPTY"}</span>
                  {!post.slug && <Badge variant="destructive">No Slug</Badge>}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(post)}><Edit className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(post.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BlogManager;