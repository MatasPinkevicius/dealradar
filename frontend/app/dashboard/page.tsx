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
  location: string
  url: string
  image_url: string
}

export default function Dashboard() {
  const { lang, setLang, t } = useLang()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [minScore, setMinScore] = useState(60)
  const [sortBy, setSortBy] = useState('deal_score')
  const [maxPrice, setMaxPrice] = useState('')
  const [minYear, setMinYear] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [transmission, setTransmission] = useState('')

  useEffect(() => {
    fetchListings()
  }, [minScore, sortBy])

  async function fetchListings() {
    setLoading(true)

    let query = supabase
      .from('listings')
      .select('*')
      .not('deal_score', 'is', null)
      .gte('deal_score', minScore)
      .eq('is_active', true)
      .order(sortBy, { ascending: false })
      .limit(200)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching listings:', error)
    } else {
      setListings((data as Listing[]) || [])
    }
    setLoading(false)
  }

  const scoreColor = (score: number) => {
    if (score >= 75) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    if (score >= 40) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const scoreLabel = (score: number) => {
    if (score >= 75) return t.score_great
    if (score >= 60) return t.score_good
    if (score >= 40) return t.score_fair
    return t.score_over
  }

  const filtered = listings.filter(l => {
    if (search) {
      const s = search.toLowerCase()
      if (!l.brand?.toLowerCase().includes(s) &&
          !l.model?.toLowerCase().includes(s) &&
          !l.location?.toLowerCase().includes(s)) return false
    }
    if (maxPrice && l.price_eur > Number(maxPrice)) return false
    if (minYear && l.year < Number(minYear)) return false
    if (fuelType && l.fuel_type !== fuelType) return false
    if (transmission && l.transmission !== transmission) return false
    return true
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← DealRadar</Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t.dash_title}</h1>
              <p className="text-sm text-gray-500">{t.dash_subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{filtered.length} {t.dash_shown}</span>
            <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setLang('lt')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${lang === 'lt' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                🇱🇹 LT
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${lang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder={t.dash_search}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">{t.dash_min_score}</label>
            <select
              value={minScore}
              onChange={e => setMinScore(Number(e.target.value))}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none"
            >
              <option value={0}>All</option>
              <option value={50}>50+</option>
              <option value={60}>60+</option>
              <option value={70}>70+</option>
              <option value={80}>80+</option>
            </select>
          </div>
          <input
            type="number"
            placeholder="Max €"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Min year"
            value={minYear}
            onChange={e => setMinYear(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={fuelType}
            onChange={e => setFuelType(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm focus:outline-none"
          >
            <option value="">All fuel</option>
            <option value="Dyzelinas">Diesel</option>
            <option value="Benzinas">Petrol</option>
            <option value="Elektra">Electric</option>
            <option value="Hibridas">Hybrid</option>
          </select>
          <select
            value={transmission}
            onChange={e => setTransmission(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm focus:outline-none"
          >
            <option value="">All gearbox</option>
            <option value="Mechaninė">Manual</option>
            <option value="Automatinė">Automatic</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">{t.dash_sort}</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none"
            >
              <option value="deal_score">{t.dash_sort_score}</option>
              <option value="price_eur">{t.dash_sort_price}</option>
              <option value="year">{t.dash_sort_year}</option>
              <option value="mileage_km">{t.dash_sort_mileage}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">{t.dash_loading}</div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t.dash_col_car}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t.dash_col_year}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t.dash_col_mileage}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t.dash_col_price}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t.dash_col_est}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t.dash_col_market}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t.dash_col_score}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t.dash_col_location}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(listing => (
                  <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {listing.brand} {listing.model}
                      <div className="text-xs text-gray-400 font-normal">
                        {listing.fuel_type} · {listing.transmission}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{listing.year}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {listing.mileage_km ? `${listing.mileage_km.toLocaleString()} km` : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {listing.price_eur ? `€${listing.price_eur.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {listing.estimated_price ? `€${listing.estimated_price.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${listing.price_vs_median < 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {listing.price_vs_median > 0 ? '+' : ''}{listing.price_vs_median?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${scoreColor(listing.deal_score)}`}>
                        {listing.deal_score?.toFixed(0)} · {scoreLabel(listing.deal_score)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{listing.location || '—'}</td>
                    <td className="px-4 py-3">
                      <a href={listing.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">{t.dash_view}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">{t.dash_no_results}</div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}