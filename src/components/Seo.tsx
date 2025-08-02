import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SeoProps {
  title: string;
  description: string;
  imageUrl?: string | null;
  slug?: string;
}

const Seo = ({ title, description, imageUrl, slug }: SeoProps) => {
  const { i18n } = useTranslation();
  const siteUrl = window.location.origin;
  const pageUrl = slug ? `${siteUrl}/blog/${slug}` : siteUrl;

  const getPortfolioName = (lang: string) => {
    const langPrefix = lang.split('-')[0]; // Handles 'en-US' -> 'en'
    switch (langPrefix) {
      case 'fr':
        return "Mon Portfolio";
      case 'ar':
        return "ملفي الشخصي";
      case 'en':
      default:
        return "My Portfolio";
    }
  };

  const portfolioName = getPortfolioName(i18n.language);
  const fullTitle = `${title} | ${portfolioName}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={pageUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      {imageUrl && <meta property="twitter:image" content={imageUrl} />}
    </Helmet>
  );
};

export default Seo;