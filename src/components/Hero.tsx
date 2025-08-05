import { ChevronDown, Github, Linkedin, Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const Hero = () => {
  const { t, i18n } = useTranslation();
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const fullText = t('hero.title');
  const isRTL = i18n.dir() === 'rtl';

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [fullText]);

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, fullText]);

  const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  const downloadCV = () => {
    const cvPath = '/Yassin-YOUNES-cv.pdf';
    const link = document.createElement('a');
    link.href = cvPath;
    link.download = 'Yassin-YOUNES-CV.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const socialLinks = [
    { icon: Github, url: "https://github.com/yassinyounes", label: "GitHub" },
    { icon: Linkedin, url: "https://linkedin.com/in/yassinyounes", label: "LinkedIn" },
    { icon: Mail, url: "mailto:contact@yassin-younes.net", label: "Email" }
  ];

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className={`text-center px-4 animate-fade-in relative z-10 ${isRTL ? 'rtl:text-right' : ''}`}>
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-bold text-gray-900 dark:text-white mb-6 animate-slide-up">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {t('hero.name')}
            </span>
          </h1>
          <div className="h-8 md:h-10">
            <p className={`text-xl md:text-2xl text-gray-600 dark:text-gray-300 animate-slide-up animation-delay-200 ${isRTL ? 'font-arabic' : ''}`}>
              {displayText}
              <span className="animate-pulse">|</span>
            </p>
          </div>
        </div>
        
        <p className={`text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto animate-slide-up animation-delay-400 leading-relaxed ${isRTL ? 'font-arabic' : ''}`}>
          {t('hero.subtitle')}
        </p>

        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-slide-up animation-delay-600 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <Button
            onClick={scrollToProjects}
            size="lg"
            className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {t('hero.viewWork')}
            <ChevronDown className={`h-4 w-4 group-hover:translate-y-1 transition-transform duration-300 ${isRTL ? 'mr-2' : 'ms-2'}`} />
          </Button>
          
          <Button
            onClick={downloadCV}
            size="lg"
            variant="outline"
            className="group hover:scale-105 transition-all duration-300 border-2 border-green-500 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <Download className={`h-4 w-4 group-hover:translate-y-1 transition-transform duration-300 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('hero.downloadCV')}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="group hover:scale-105 transition-all duration-300 border-2"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('hero.getInTouch')}
          </Button>
        </div>

        <div className={`flex justify-center space-x-6 animate-slide-up animation-delay-800 ${isRTL ? 'space-x-reverse' : ''}`}>
          {socialLinks.map((social, index) => (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className="group hover:scale-110 transition-all duration-300 hover:bg-white/20 dark:hover:bg-gray-800/20"
              onClick={() => window.open(social.url, '_blank')}
            >
              <social.icon className="h-6 w-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
            </Button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;