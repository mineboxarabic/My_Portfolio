import { useState, useEffect, useRef } from "react";
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
  const navRef = useRef<HTMLElement>(null);
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

    const handleResize = () => {
      // Close mobile menu on resize to prevent issues
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [navItems, location.pathname, isMobileMenuOpen]);

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
            className={`relative px-2 lg:px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap ${
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
          className={`relative px-2 lg:px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap ${
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
            className={`block w-full text-base font-medium rounded-lg transition-all duration-300 px-4 py-3 min-h-[44px] flex items-center ${
              isRTL ? 'text-right' : 'text-left'
            } ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700'
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
          className={`block w-full text-base font-medium rounded-lg transition-all duration-300 px-4 py-3 min-h-[44px] flex items-center ${
            isRTL ? 'text-right' : 'text-left'
          } ${
            isActive
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700'
          }`}
        >
          {item.name}
        </button>
      );
    });
  };

  return (
    <>
      <nav 
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-gray-700' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className={`flex items-center justify-between h-14 sm:h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div 
              className={`font-bold text-lg sm:text-xl text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 ${isRTL ? 'order-3' : ''}`}
              onClick={() => handleNavClick({ name: 'Home', type: 'scroll', href: 'hero' })}
            >
              YY
            </div>

            <div className={`hidden lg:flex items-center space-x-6 lg:space-x-8 ${isRTL ? 'space-x-reverse order-1' : ''}`}>
              {renderDesktopNavItems()}
              <LanguageSwitcher />
            </div>

            <div className={`lg:hidden flex items-center gap-2 ${isRTL ? 'order-2' : ''}`}>
              <LanguageSwitcher />
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 z-50 relative"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 animate-slide-down shadow-lg">
            <div className="px-3 py-3 sm:px-4 sm:py-4 space-y-2">
              {renderMobileNavItems()}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;