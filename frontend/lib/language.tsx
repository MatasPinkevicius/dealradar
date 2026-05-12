'use client'

import { createContext, useContext, useState } from 'react'

type Language = 'lt' | 'en'

const translations = {
  lt: {
    nav_dashboard: 'Atidaryti skydelį',
    hero_badge: '🇱🇹 Lietuva • Gyvi rinkos duomenys',
    hero_title: 'Rask neįvertintus automobilius',
    hero_title_highlight: 'greičiau nei kiti',
    hero_desc: 'DealRadar nuskaito autoplius.lt ir įvertina kiekvieną skelbimą pagal realius rinkos duomenis. Gauk pranešimą kai atsiranda geras pasiūlymas — kol kiti dar nespėjo.',
    hero_btn_dashboard: 'Žiūrėti pasiūlymus',
    hero_btn_telegram: 'Gauti Telegram pranešimus',
    stats_listings: 'Skelbimai stebimi',
    stats_scoring: 'Rinkos vertinimas',
    stats_free: 'Nemokama beta versija',
    how_title: 'Kaip tai veikia',
    how_1_title: 'Nuskaitome rinką',
    how_1_desc: 'DealRadar automatiškai nuskaito autoplius.lt ir renka visus naudotų automobilių skelbimus Lietuvoje.',
    how_2_title: 'Vertiname kiekvieną automobilį',
    how_2_desc: 'Kiekvienas skelbimas lyginamas su panašiais automobiliais — tas pats modelis, metai, rida, kuro tipas — ir įvertinamas 0-100.',
    how_3_title: 'Gauni pranešimą',
    how_3_desc: 'Kai atsiranda puikus pasiūlymas atitinkantis jūsų kriterijus, gausite Telegram pranešimą iš karto.',
    alert_title: 'Kaip atrodo pranešimas',
    alert_desc: 'Realūs pasiūlymai siunčiami tiesiai į jūsų Telegram',
    cta_title: 'Pasiruošęs rasti savo kitą automobilį?',
    cta_desc: 'Nemokama beta versijos metu. Nereikia kredito kortelės.',
    cta_btn: 'Žiūrėti pasiūlymus',
    footer: 'DealRadar · Lietuva',
    // Dashboard
    dash_title: 'DealRadar',
    dash_subtitle: 'Lietuvos naudotų automobilių žvalgyba',
    dash_search: 'Ieškoti pagal markę, modelį, miestą...',
    dash_min_score: 'Min. įvertis:',
    dash_sort: 'Rūšiuoti pagal:',
    dash_sort_score: 'Pasiūlymo įvertis',
    dash_sort_price: 'Kaina',
    dash_sort_year: 'Metai',
    dash_sort_mileage: 'Rida',
    dash_col_car: 'Automobilis',
    dash_col_year: 'Metai',
    dash_col_mileage: 'Rida',
    dash_col_price: 'Kaina',
    dash_col_est: 'Rinkos vertė',
    dash_col_market: 'vs Rinka',
    dash_col_score: 'Įvertis',
    dash_col_location: 'Miestas',
    dash_loading: 'Kraunama...',
    dash_no_results: 'Nėra skelbimai pagal jūsų filtrus.',
    dash_view: 'Žiūrėti',
    score_great: 'Puikus pasiūlymas',
    score_good: 'Geras pasiūlymas',
    score_fair: 'Vidutinė kaina',
    score_over: 'Per brangu',
    dash_shown: 'skelbimai rodomi',
    dash_body_type: 'Kėbulo tipas',
    dash_all_body: 'Visi tipai',
    dash_all_fuel: 'Visi kurai',
    dash_all_gearbox: 'Visos pavarų dėžės',
    dash_all_scores: 'Visi balai',
    dash_score_label: 'Balas',
    dash_col_body: 'Kėbulas',
    score_50: 'Balas 50+',
    score_60: 'Balas 60+',
    score_70: 'Balas 70+',
    score_80: 'Balas 80+',
  },
  en: {
    nav_dashboard: 'Open Dashboard',
    hero_badge: '🇱🇹 Lithuania • Live market data',
    hero_title: 'Find undervalued cars',
    hero_title_highlight: 'before anyone else does',
    hero_desc: 'DealRadar scans autoplius.lt and scores every listing against real market data. Get instant alerts when a great deal appears — before dealers snap it up.',
    hero_btn_dashboard: 'View live deals',
    hero_btn_telegram: 'Get Telegram alerts',
    stats_listings: 'Listings tracked',
    stats_scoring: 'Market scoring',
    stats_free: 'Free during beta',
    how_title: 'How it works',
    how_1_title: 'We scan the market',
    how_1_desc: 'DealRadar automatically scrapes autoplius.lt and collects every used car listing in Lithuania.',
    how_2_title: 'We score every car',
    how_2_desc: 'Each listing is compared against similar cars — same model, year, mileage, fuel type — and scored 0-100.',
    how_3_title: 'You get alerted',
    how_3_desc: 'When a great deal appears that matches your criteria, you get a Telegram notification instantly.',
    alert_title: 'What an alert looks like',
    alert_desc: 'Real deals sent directly to your Telegram',
    cta_title: 'Ready to find your next deal?',
    cta_desc: 'Free during beta. No credit card required.',
    cta_btn: 'View live deals',
    footer: 'DealRadar · Lithuania',
    // Dashboard
    dash_title: 'DealRadar',
    dash_subtitle: 'Lithuania used car intelligence',
    dash_search: 'Search brand, model, location...',
    dash_min_score: 'Min score:',
    dash_sort: 'Sort by:',
    dash_sort_score: 'Deal score',
    dash_sort_price: 'Price',
    dash_sort_year: 'Year',
    dash_sort_mileage: 'Mileage',
    dash_col_car: 'Car',
    dash_col_year: 'Year',
    dash_col_mileage: 'Mileage',
    dash_col_price: 'Price',
    dash_col_est: 'Est. value',
    dash_col_market: 'vs Market',
    dash_col_score: 'Score',
    dash_col_location: 'Location',
    dash_loading: 'Loading listings...',
    dash_no_results: 'No listings match your filters.',
    dash_view: 'View',
    score_great: 'Great deal',
    score_good: 'Good deal',
    score_fair: 'Fair price',
    score_over: 'Overpriced',
    dash_shown: 'listings shown',
    dash_body_type: 'Body type',
    dash_all_body: 'All types',
    dash_all_fuel: 'All fuel',
    dash_all_gearbox: 'All gearbox',
    dash_all_scores: 'All scores',
    dash_score_label: 'Score',
    dash_col_body: 'Body',
    score_50: 'Score 50+',
    score_60: 'Score 60+',
    score_70: 'Score 70+',
    score_80: 'Score 80+',
  }
}

const LanguageContext = createContext<{
  lang: Language
  setLang: (l: Language) => void
  t: typeof translations.lt
}>({
  lang: 'lt',
  setLang: () => {},
  t: translations.lt,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('lt')
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}