"use client"

import React from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'

export const LanguageSwitcher = () => {
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const t = useTranslations('Common')

    const toggleLanguage = (newLocale: 'en' | 'ro') => {
        if (newLocale !== locale) {
            router.replace(pathname, { locale: newLocale })
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger nativeButton={true}
                render={<Button variant="outline" size="icon" aria-label={t('english')}>
                    <Globe className="h-4 w-4" />
                </Button>}>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                    value={locale}
                    onValueChange={(val) => toggleLanguage(val as 'en' | 'ro')}
                >
                    <DropdownMenuRadioItem value="en">
                        {t('english')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="ro">
                        {t('romanian')}
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
