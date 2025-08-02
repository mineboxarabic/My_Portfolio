import Navigation from "@/components/Navigation";
import DarkModeToggle from "@/components/DarkModeToggle";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <Seo 
        title={t('hero.name')}
        description={t('hero.subtitle')}
      />
      <Navigation />
      <DarkModeToggle />
      <Hero />
      <Projects />
      <About />
      <Skills />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;