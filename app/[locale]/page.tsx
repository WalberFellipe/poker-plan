import { Button } from "@/components/ui/button"
import { useTranslations } from 'next-intl'
import Link from "next/link"

export default function Home() {
  const t = useTranslations('home')

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 md:px-6 space-y-10">
          <div className="container flex flex-col items-center text-center justify-self-center space-y-8">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
                {t('hero.title')}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t('hero.subtitle')}
              </p>
              <p className="text-xl text-muted-foreground">
                {t('hero.subtitle2')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-md">
              <Button size="lg" className="w-full" asChild>
                <Link href="/room/create">
                  {t('hero.createRoom')}
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full">
                {t('hero.joinRoom')}
              </Button>
            </div>
          </div>

          {/* Feature Grid */}
          {/* <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {['realtime', 'customization', 'statistics'].map((feature) => (
                <div key={feature} className="p-6 rounded-lg border bg-card">
                  <h3 className="text-xl font-semibold mb-2">
                    {t(`features.${feature}.title`)}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(`features.${feature}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div> */}
        </section>
      </main>
    </div>
  )
}
