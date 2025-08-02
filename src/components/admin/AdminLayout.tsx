import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, FolderOpen, User, Code, Settings, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import ProjectsManager from "./ProjectsManager";
import SkillsManager from "./SkillsManager";
import AboutManager from "./AboutManager";
import BlogManager from "./BlogManager";

const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState("projects");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showSuccess("Logged out successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Admin Panel
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => window.open("/", "_blank")}
                className="flex items-center"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                View Site
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="projects" className="flex items-center">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Projects
                </TabsTrigger>
                <TabsTrigger value="blog" className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Blog
                </TabsTrigger>
                <TabsTrigger value="skills" className="flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  Skills
                </TabsTrigger>
                <TabsTrigger value="about" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  About Me
                </TabsTrigger>
              </TabsList>

              <TabsContent value="projects" className="mt-6">
                <ProjectsManager />
              </TabsContent>

              <TabsContent value="blog" className="mt-6">
                <BlogManager />
              </TabsContent>

              <TabsContent value="skills" className="mt-6">
                <SkillsManager />
              </TabsContent>

              <TabsContent value="about" className="mt-6">
                <AboutManager />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminLayout;