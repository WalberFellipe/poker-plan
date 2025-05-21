'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from 'react'
import { Globe } from 'lucide-react'
import * as Flags from 'country-flag-icons/react/3x2'

const languages = [
  { 
    code: 'pt', 
    name: 'Português', 
    flag: <Flags.BR className="h-4 w-6" /> 
  },
  { 
    code: 'en', 
    name: 'English', 
    flag: <Flags.US className="h-4 w-6" /> 
  }
]

export function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const [currentLocale, setCurrentLocale] = useState('pt')

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') || 'pt'
    setCurrentLocale(savedLocale)
  }, [])

  const handleLanguageChange = (locale: string) => {
    localStorage.setItem('locale', locale)
    setCurrentLocale(locale)
    const newPathname = pathname?.replace(/^\/[^\/]+/, `/${locale}`)
    router.push(newPathname || '/')
  }

  return (
    <Select value={currentLocale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[150px]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map(lang => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 