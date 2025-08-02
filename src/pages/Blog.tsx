import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getTranslatedText, Translatable } from "@/utils/translations";
import Navigation from "@/components/Navigation";
import DarkModeToggle from "@/components/DarkModeToggle";
import Footer from "@/components/Footer";
import BlogViewToggle from "@/components/BlogViewToggle";
import { format } from "date-fns";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";

interface Post {
  id: string;
  title: Translatable;
  excerpt: Translatable;
  slug: string;
  featured_image_url: string | null;
  published_at: string;
}

const Blog = () => {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'grid' | 'list' | 'cards'>('cards');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false });

      if (error) throw error;
      setPosts(data as Post[]);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (slug: string) => {
    navigate(`/blog/${slug}`);
  };

  const ImagePlaceholder = ({ title }: { title: string }) => (
    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center rounded-lg">
      <div className="text-center p-4">
        <BookOpen className="h-12 w-12 text-blue-500 dark:text-blue-400 mx-auto mb-2 opacity-50" />
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium line-clamp-2">
          {title}
        </p>
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <Card
          key={post.id}
          className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-white dark:bg-gray-800"
          onClick={() => handlePostClick(post.slug)}
        >
          <div className="aspect-video overflow-hidden">
            {post.featured_image_url ? (
              <img 
                src={post.featured_image_url} 
                alt={getTranslatedText(post.title, i18n.language)} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
              />
            ) : (
              <ImagePlaceholder title={getTranslatedText(post.title, i18n.language)} />
            )}
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <Calendar className="h-3 w-3" />
              {format(new Date(post.published_at), 'MMM d, yyyy')}
            </div>
            <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {getTranslatedText(post.title, i18n.language)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">
              {getTranslatedText(post.excerpt, i18n.language)}
            </p>
            <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:gap-2 transition-all">
              {t('blog.readMore')}
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderCardsView = () => (
    <div className="space-y-8">
      {posts.map((post, index) => (
        <Card
          key={post.id}
          className={`group overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer bg-white dark:bg-gray-800 ${
            index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
          } lg:flex`}
          onClick={() => handlePostClick(post.slug)}
        >
          <div className="lg:w-1/2 aspect-video lg:aspect-auto overflow-hidden">
            {post.featured_image_url ? (
              <img 
                src={post.featured_image_url} 
                alt={getTranslatedText(post.title, i18n.language)} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <BookOpen className="h-16 w-16 text-blue-500 dark:text-blue-400 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    {getTranslatedText(post.title, i18n.language)}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="lg:w-1/2 p-8 flex flex-col justify-center">
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.published_at), 'MMMM d, yyyy')}
              </div>
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                5 min read
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {getTranslatedText(post.title, i18n.language)}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3">
              {getTranslatedText(post.excerpt, i18n.language)}
            </p>
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:gap-2 transition-all">
              {t('blog.readMore')}
              <ArrowRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card
          key={post.id}
          className="group transition-all duration-300 hover:shadow-lg cursor-pointer bg-white dark:bg-gray-800"
          onClick={() => handlePostClick(post.slug)}
        >
          <CardContent className="p-6">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-24 h-24 overflow-hidden rounded-lg">
                {post.featured_image_url ? (
                  <img 
                    src={post.featured_image_url} 
                    alt={getTranslatedText(post.title, i18n.language)} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center rounded-lg">
                    <BookOpen className="h-8 w-8 text-blue-500 dark:text-blue-400 opacity-50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(post.published_at), 'MMM d, yyyy')}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    5 min read
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {getTranslatedText(post.title, i18n.language)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
                  {getTranslatedText(post.excerpt, i18n.language)}
                </p>
                <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:gap-1 transition-all">
                  {t('blog.readMore')}
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'grid':
        return renderGridView();
      case 'list':
        return renderListView();
      case 'cards':
      default:
        return renderCardsView();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <DarkModeToggle />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('blog.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              {t('blog.subtitle')}
            </p>
            <div className="flex justify-center">
              <BlogViewToggle currentView={currentView} onViewChange={setCurrentView} />
            </div>
          </header>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No blog posts found</h3>
              <p className="text-gray-600 dark:text-gray-300">Check back later for new content!</p>
            </div>
          ) : (
            renderCurrentView()
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;