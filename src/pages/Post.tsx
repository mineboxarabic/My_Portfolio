import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { getTranslatedText, Translatable } from "@/utils/translations";
import Navigation from "@/components/Navigation";
import DarkModeToggle from "@/components/DarkModeToggle";
import Footer from "@/components/Footer";
import HtmlRenderer from "@/components/HtmlRenderer";
import Seo from "@/components/Seo";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Post {
  id: string;
  title: Translatable;
  excerpt: Translatable;
  content: Translatable;
  slug: string;
  featured_image_url: string | null;
  published_at: string;
}

const Post = () => {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  const fetchPost = async (postSlug: string) => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", postSlug)
        .single();

      if (error) throw error;
      setPost(data as Post);
    } catch (error) {
      console.error("Failed to fetch post:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading post...</div>;
  }

  if (!post) {
    return <div className="min-h-screen flex items-center justify-center">Post not found.</div>;
  }

  const translatedTitle = getTranslatedText(post.title, i18n.language);
  const translatedExcerpt = getTranslatedText(post.excerpt, i18n.language);
  const translatedContent = getTranslatedText(post.content, i18n.language);

  return (
    <>
      <Seo 
        title={translatedTitle} 
        description={translatedExcerpt} 
        imageUrl={post.featured_image_url}
        slug={post.slug}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <DarkModeToggle />
        <main className="pt-24 pb-16 px-4">
          <article className="max-w-4xl mx-auto">
            <header className="mb-12">
              <Button asChild variant="ghost" className="mb-8">
                <Link to="/blog">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Blog
                </Link>
              </Button>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                {translatedTitle}
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                Published on {format(new Date(post.published_at), 'MMMM d, yyyy')}
              </p>
            </header>

            {post.featured_image_url && (
              <img 
                src={post.featured_image_url} 
                alt={translatedTitle}
                className="w-full rounded-2xl shadow-xl mb-12"
              />
            )}

            <HtmlRenderer>
              {translatedContent}
            </HtmlRenderer>
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Post;