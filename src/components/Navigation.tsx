import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

type NavItem = {
  name: string;
  type: 'scroll' | 'link';
  href: string;
};

const Navigation = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const isRTL = i18n.dir() === 'rtl';

  const navItems: NavItem[] = [
    { name: t('nav.home'), type: 'scroll', href: 'hero' },
    { name: t('nav.projects'), type: 'scroll', href: 'projects' },
    { name: t('nav.about'), type: 'scroll', href: 'about' },
    { name: t('nav.skills'), type: 'scroll', href: 'skills' },
    { name: t('nav.contact'), type: 'scroll', href: 'contact' },
    { name: t('nav.blog'), type: 'link', href: '/blog' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      if (location.pathname !== '/') {
        setActiveSection('');
        return;
      }

      const sections = navItems.filter(item => item.type === 'scroll').map(item => item.href);
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      
      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navItems, location.pathname]);

  const handleNavClick = (item: NavItem) => {
    setIsMobileMenuOpen(false);
    if (item.type === 'scroll') {
      if (location.pathname !== '/') {
        navigate('/', { state: { scrollTo: item.href } });
      } else {
        const element = document.getElementById(item.href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  useEffect(() => {
    if (location.state?.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location.state]);

  const renderDesktopNavItems = () => {
    return navItems.map((item) => {
      if (item.type === 'link') {
        const isActive = location.pathname.startsWith(item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 ${
              isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {item.name}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 animate-pulse"></div>
            )}
          </Link>
        );
      }
      // item.type === 'scroll'
      const isActive = activeSection === item.href;
      return (
        <button
          key={item.name}
          onClick={() => handleNavClick(item)}
          className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 ${
            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {item.name}
          {isActive && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 animate-pulse"></div>
          )}
        </button>
      );
    });
  };

  const renderMobileNavItems = () => {
    return navItems.map((item) => {
      if (item.type === 'link') {
        const isActive = location.pathname.startsWith(item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block w-full text-base font-medium rounded-md transition-all duration-300 px-3 py-2 ${
              isRTL ? 'text-right' : 'text-left'
            } ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {item.name}
          </Link>
        );
      }
      // item.type === 'scroll'
      const isActive = activeSection === item.href;
      return (
        <button
          key={item.name}
          onClick={() => handleNavClick(item)}
          className={`block w-full text-base font-medium rounded-md transition-all duration-300 px-3 py-2 ${
            isRTL ? 'text-right' : 'text-left'
          } ${
            isActive
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          {item.name}
        </button>
      );
    });
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-gray-700' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className={`flex items-center justify-between h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div 
              className={`font-bold text-xl text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 ${isRTL ? 'order-3' : ''}`}
              onClick={() => handleNavClick({ name: 'Home', type: 'scroll', href: 'hero' })}
            >
              YY
            </div>

            <div className={`hidden md:flex items-center space-x-8 ${isRTL ? 'space-x-reverse order-1' : ''}`}>
              {renderDesktopNavItems()}
              <LanguageSwitcher />
            </div>

            <div className={`md:hidden flex items-center gap-2 ${isRTL ? 'order-2' : ''}`}>
              <LanguageSwitcher />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 animate-slide-down">
            <div className="px-4 py-2 space-y-1">
              {renderMobileNavItems()}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;