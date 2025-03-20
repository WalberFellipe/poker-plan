'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useEffect, useState } from 'react';

export function LanguageProvider({
  children,
  messages
}: {
  children: React.ReactNode;
  messages: Record<string, string>;
}) {
  const [locale, setLocale] = useState('pt');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') || 'pt';
    setLocale(savedLocale);
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
} 