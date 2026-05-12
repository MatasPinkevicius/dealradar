'use client'

import Link from 'next/link'
import { useLang, LanguageProvider } from '@/lib/language'

function LandingContent() {
  const { lang, setLang, t } = useLang()

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📡</span>
          <span className="font-bold text-xl tracking-tight">DealRadar</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-lg p-1">
            <button
              onClick={() => setLang('lt')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${lang === 'lt' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              🇱🇹 LT
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${lang === 'en' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              🇬🇧 EN
            </button>
          </div>
          <Link href="/dashboard" className="bg-white text-gray-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
            {t.nav_dashboard}
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-8 py-24 text-center">
        <div className="inline-block bg-green-500/10 text-green-400 text-sm font-medium px-3 py-1 rounded-full mb-6 border border-green-500/20">
          {t.hero_badge}
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
          {t.hero_title}<br />
          <span className="text-green-400">{t.hero_title_highlight}</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t.hero_desc}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard" className="bg-green-500 hover:bg-green-400 text-gray-950 font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
            {t.hero_btn_dashboard}
          </Link>
          <a href="https://t.me/your_bot_username" className="border border-gray-700 hover:border-gray-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
            {t.hero_btn_telegram}
          </a>
        </div>
      </section>

      <section className="border-y border-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-8 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-green-400">4,000+</div>
            <div className="text-gray-400 mt-1">{t.stats_listings}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-400">Live</div>
            <div className="text-gray-400 mt-1">{t.stats_scoring}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-400">Free</div>
            <div className="text-gray-400 mt-1">{t.stats_free}</div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-8 py-24">
        <h2 className="text-3xl font-bold text-center mb-16">{t.how_title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="font-semibold text-lg mb-2">{t.how_1_title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t.how_1_desc}</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="font-semibold text-lg mb-2">{t.how_2_title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t.how_2_desc}</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="text-3xl mb-4">🔔</div>
            <h3 className="font-semibold text-lg mb-2">{t.how_3_title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t.how_3_desc}</p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-8 pb-24">
        <h2 className="text-3xl font-bold text-center mb-4">{t.alert_title}</h2>
        <p className="text-gray-400 text-center mb-12">{t.alert_desc}</p>
        <div className="max-w-sm mx-auto bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-xl">📡</div>
            <div>
              <div className="font-semibold">DealRadar</div>
              <div className="text-xs text-gray-500">just now</div>
            </div>
          </div>
          <div className="text-sm leading-relaxed space-y-1">
            <div>🚗 <span className="font-semibold">BMW 320d 2017</span></div>
            <div>💰 <span className="font-semibold text-green-400">€8,500</span> (est. market: €11,200)</div>
            <div>📉 <span className="font-semibold text-green-400">24% below market</span></div>
            <div>⭐ Deal score: <span className="font-semibold">89/100</span></div>
            <div>📍 Vilnius</div>
            <div>🛣 145,000 km · Diesel · Auto</div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-800 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">{t.cta_title}</h2>
        <p className="text-gray-400 mb-8">{t.cta_desc}</p>
        <Link href="/dashboard" className="bg-green-500 hover:bg-green-400 text-gray-950 font-semibold px-8 py-4 rounded-xl text-lg transition-colors inline-block">
          {t.cta_btn}
        </Link>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        {t.footer} · {new Date().getFullYear()}
      </footer>
    </main>
  )
}

export default function LandingPage() {
  return <LandingContent />
}