import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import type { Language } from '@/store/useAppStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Globe, Check } from 'lucide-react';
import i18n from '@/i18n';

const LANGUAGES: { code: Language; label: string; native: string; flag: string }[] = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useAppStore();
  const { t } = useTranslation();

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  const handleChange = (code: Language) => {
    setLanguage(code);
    i18n.changeLanguage(code);
    localStorage.setItem('busnow_language', code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="gap-2 h-9 px-3 hover:bg-white/10 text-sm font-medium"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{current.flag} {current.native}</span>
          <span className="sm:hidden">{current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-strong border-white/10 w-48">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          {t('language')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className="flex items-center justify-between cursor-pointer hover:bg-white/8 gap-2"
          >
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.native}</span>
            </span>
            {language === lang.code && (
              <Check className="h-3.5 w-3.5 text-brand" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
