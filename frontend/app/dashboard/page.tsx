'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/language'
import Link from 'next/link'

interface Listing {
  id: number
  brand: string
  model: string
  year: number
  mileage_km: number
  price_eur: number
  estimated_price: number
  price_vs_median: number
  deal_score: number
  comparable_count: number
  fuel_type: string
  transmission: string
  body_type: string
  location: string
  url: string
  image_url: string
}

const PAGE_SIZE = 100

export default function Dashboard() {
  const { lang, setLang, t } = useLang()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [minScore, setMinScore] = useState(60)
  const [sortBy, setSortBy] = useState('deal_score')
  const [sortAsc, setSortAsc] = useState(false)
  const [maxPrice, setMaxPrice] = useState('')
  const [minYear, setMinYear] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [transmission, setTransmission] = useState('')
  const [bodyType, setBodyType] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    setPage(0)
    fetchListings(0)
  }, [minScore, sortBy, sortAsc, fuelType, transmission, bodyType, maxPrice, minYear])

  useEffect(() => {
    fetchListings(page)
  }, [page])

  async function fetchListings(pageNum: number) {
    setLoading(true)

    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' })
      .not('deal_score', 'is', null)
      .gte('deal_score', minScore)
      .eq('is_active', true)
      .in('body_type', [
        'Sedanas', 'Universalas', 'Hečbekas',
        'Visureigis / Krosoveris', 'Vienatūris',
        'Kupė (Coupe)', 'Kabrioletas', 'Pikapas', 'Limuzinas'
      ])
      .order(sortBy, { ascending: sortAsc })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

    if (fuelType) query = query.eq('fuel_type', fuelType)
    if (transmission) query = query.eq('transmission', transmission)
    if (bodyType) query = query.eq('body_type', bodyType)
    if (maxPrice) query = query.lte('price_eur', Number(maxPrice))
    if (minYear) query = query.gte('year', Number(minYear))

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching listings:', error)
    } else {
      setListings((data as Listing[]) || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }

  const scoreColor = (score: number) => {
    if (score >= 75) return 'bg-green-500/20 text-green-400 border border-green-500/30'
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    if (score >= 40) return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
    return 'bg-red-500/20 text-red-400 border border-red-500/30'
  }

  const scoreLabel = (score: number) => {
    if (score >= 75) return t.score_great
    if (score >= 60) return t.score_good
    if (score >= 40) return t.score_fair
    return t.score_over
  }

  const filtered = listings.filter(l => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      l.brand?.toLowerCase().includes(s) ||
      l.model?.toLowerCase().includes(s) ||
      l.location?.toLowerCase().includes(s)
    )
  })

  const bodyTypeLabel = (val: string) => {
    if (lang === 'en') {
      const map: Record<string, string> = {
        'Sedanas': 'Sedan',
        'Universalas': 'Estate',
        'Hečbekas': 'Hatchback',
        'Visureigis / Krosoveris': 'SUV',
        'Vienatūris': 'MPV',
        'Kupė (Coupe)': 'Coupe',
        'Kabrioletas': 'Convertible',
        'Pikapas': 'Pickup',
        'Limuzinas': 'Limousine',
      }
      return map[val] || val
    }
    return val
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-xl">📡</span>
              <span className="font-bold text-lg tracking-tight">DealRadar</span>
            </Link>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400 text-sm">{t.dash_subtitle}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              <span className="text-green-400 font-semibold">{totalCount}</span> {t.dash_shown}
            </span>
            <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1">
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
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder={t.dash_search}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
          />
          <select
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
          >
            <option value={0}>{lang === 'lt' ? 'Visi balai' : 'All scores'}</option>
            <option value={50}>{lang === 'lt' ? 'Balas 50+' : 'Score 50+'}</option>
            <option value={60}>{lang === 'lt' ? 'Balas 60+' : 'Score 60+'}</option>
            <option value={70}>{lang === 'lt' ? 'Balas 70+' : 'Score 70+'}</option>
            <option value={80}>{lang === 'lt' ? 'Balas 80+' : 'Score 80+'}</option>
          </select>
          <input
            type="number"
            placeholder={lang === 'lt' ? 'Maks €' : 'Max €'}
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
          />
          <input
            type="number"
            placeholder={lang === 'lt' ? 'Min metai' : 'Min year'}
            value={minYear}
            onChange={e => setMinYear(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
          />
          <select
            value={fuelType}
            onChange={e => setFuelType(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
          >
            <option value="">{lang === 'lt' ? 'Visi kurai' : 'All fuel'}</option>
            <option value="Dyzelinas">{lang === 'lt' ? 'Dyzelinas' : 'Diesel'}</option>
            <option value="Benzinas">{lang === 'lt' ? 'Benzinas' : 'Petrol'}</option>
            <option value="Elektra">{lang === 'lt' ? 'Elektra' : 'Electric'}</option>
            <option value="Hibridas">{lang === 'lt' ? 'Hibridas' : 'Hybrid'}</option>
          </select>
          <select
            value={transmission}
            onChange={e => setTransmission(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
          >
            <option value="">{lang === 'lt' ? 'Visos pavarų dėžės' : 'All gearbox'}</option>
            <option value="Mechaninė">{lang === 'lt' ? 'Mechaninė' : 'Manual'}</option>
            <option value="Automatinė">{lang === 'lt' ? 'Automatinė' : 'Automatic'}</option>
          </select>
          <select
            value={bodyType}
            onChange={e => setBodyType(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
          >
            <option value="">{lang === 'lt' ? 'Visi kėbulai' : 'All body types'}</option>
            <option value="Sedanas">{lang === 'lt' ? 'Sedanas' : 'Sedan'}</option>
            <option value="Universalas">{lang === 'lt' ? 'Universalas' : 'Estate'}</option>
            <option value="Hečbekas">{lang === 'lt' ? 'Hečbekas' : 'Hatchback'}</option>
            <option value="Visureigis / Krosoveris">{lang === 'lt' ? 'Visureigis' : 'SUV'}</option>
            <option value="Vienatūris">{lang === 'lt' ? 'Vienatūris' : 'MPV'}</option>
            <option value="Kupė (Coupe)">{lang === 'lt' ? 'Kupė' : 'Coupe'}</option>
            <option value="Kabrioletas">{lang === 'lt' ? 'Kabrioletas' : 'Convertible'}</option>
            <option value="Pikapas">{lang === 'lt' ? 'Pikapas' : 'Pickup'}</option>
          </select>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">{lang === 'lt' ? 'Rūšiuoti:' : 'Sort:'}</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            >
              <option value="deal_score">{lang === 'lt' ? 'Balas' : 'Score'}</option>
              <option value="price_eur">{t.dash_sort_price}</option>
              <option value="year">{t.dash_sort_year}</option>
              <option value="mileage_km">{t.dash_sort_mileage}</option>
            </select>
            <button
              onClick={() => setSortAsc(a => !a)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              {sortAsc ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-500">{t.dash_loading}</div>
        ) : (
          <>
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-800">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">{t.dash_col_car}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">{lang === 'lt' ? 'Kėbulas' : 'Body'}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">{t.dash_col_year}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">{t.dash_col_mileage}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">{t.dash_col_price}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">{t.dash_col_est}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">{t.dash_col_market}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">{lang === 'lt' ? 'Balas' : 'Score'}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">{t.dash_col_location}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filtered.map(listing => (
                    <tr key={listing.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">
                        {listing.brand} {listing.model}
                        <div className="text-xs text-gray-500 font-normal mt-0.5">
                          {listing.fuel_type} · {listing.transmission}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {bodyTypeLabel(listing.body_type) || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{listing.year}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {listing.mileage_km ? `${listing.mileage_km.toLocaleString()} km` : '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {listing.price_eur ? `€${listing.price_eur.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {listing.estimated_price ? `€${listing.estimated_price.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${listing.price_vs_median < 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {listing.price_vs_median > 0 ? '+' : ''}{listing.price_vs_median?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${scoreColor(listing.deal_score)}`}>
                          <span className="font-bold">{listing.deal_score?.toFixed(0)}</span>
                          <span className="opacity-75">· {scoreLabel(listing.deal_score)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{listing.location || '—'}</td>
                      <td className="px-4 py-3">
                        <a href={listing.url} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 text-xs font-medium transition-colors">
                          {t.dash_view} →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  {t.dash_no_results}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">
                  {lang === 'lt' ? 'Puslapis' : 'Page'} {page + 1} {lang === 'lt' ? 'iš' : 'of'} {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ← {lang === 'lt' ? 'Ankstesnis' : 'Previous'}
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {lang === 'lt' ? 'Kitas' : 'Next'} →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}