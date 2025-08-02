import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import { useState } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { useTranslation } from "react-i18next";

const Contact = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      showError(t('contact.formError'));
      return;
    }

    showSuccess(t('contact.formSuccess'));
    setFormData({ name: '', email: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const socialLinks = [
    { icon: Github, label: "GitHub", url: "https://github.com/yassinyounes" },
    { icon: Linkedin, label: "LinkedIn", url: "https://linkedin.com/in/yassinyounes" },
    { icon: Twitter, label: "Twitter", url: "https://twitter.com/yassinyounes" },
    { icon: Mail, label: "Email", url: "mailto:yassin.younes@example.com" }
  ];

  return (
    <section id="contact" className="py-20 px-4 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <h2 className={`text-4xl font-bold text-center text-gray-900 dark:text-white mb-16 ${isRTL ? 'font-arabic' : ''}`}>
          {t('contact.title')}
        </h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div className={isRTL ? 'md:order-2' : ''}>
            <h3 className={`text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 ${isRTL ? 'text-right font-arabic' : ''}`}>
              {t('contact.subtitle')}
            </h3>
            <p className={`text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed ${isRTL ? 'text-right font-arabic' : ''}`}>
              {t('contact.description')}
            </p>
            <div className={`flex space-x-4 ${isRTL ? 'space-x-reverse justify-end' : ''}`}>
              {socialLinks.map((social, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="icon"
                  className="group hover:scale-110 transition-all duration-300 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  onClick={() => window.open(social.url, '_blank')}
                >
                  <social.icon className="h-5 w-5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                </Button>
              ))}
            </div>
          </div>
          <Card className={`bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300 ${isRTL ? 'md:order-1' : ''}`}>
            <CardHeader>
              <CardTitle className={`text-gray-900 dark:text-white ${isRTL ? 'text-right font-arabic' : ''}`}>
                {t('contact.formTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className={`text-gray-700 dark:text-gray-300 ${isRTL ? 'font-arabic' : ''}`}>
                    {t('contact.nameLabel')}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 ${isRTL ? 'text-right' : ''}`}
                    placeholder={t('contact.namePlaceholder')}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
                <div>
                  <Label htmlFor="email" className={`text-gray-700 dark:text-gray-300 ${isRTL ? 'font-arabic' : ''}`}>
                    {t('contact.emailLabel')}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 ${isRTL ? 'text-right' : ''}`}
                    placeholder={t('contact.emailPlaceholder')}
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="message" className={`text-gray-700 dark:text-gray-300 ${isRTL ? 'font-arabic' : ''}`}>
                    {t('contact.messageLabel')}
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className={`mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 ${isRTL ? 'text-right' : ''}`}
                    placeholder={t('contact.messagePlaceholder')}
                    rows={4}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full group hover:scale-105 transition-transform duration-300"
                >
                  {t('contact.sendMessage')}
                  <Mail className={`h-4 w-4 group-hover:translate-x-1 transition-transform duration-300 ${isRTL ? 'mr-2 group-hover:-translate-x-1' : 'ms-2'}`} />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;