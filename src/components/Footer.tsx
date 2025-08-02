import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="py-8 px-4 bg-gray-900 dark:bg-gray-950 text-white transition-colors duration-300">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-gray-400 dark:text-gray-500">
          {t('footer.copyright')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;