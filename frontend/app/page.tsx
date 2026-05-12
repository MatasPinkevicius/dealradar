'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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

const scoreColor = (score: number) => {
  if (score >= 75) return 'bg-green-100 text-green-800'
  if (score >= 60) return 'bg-yellow-100 text-yellow-800'
  if (score >= 40) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

const scoreLabel = (score: number) => {
  if (score >= 75) return 'Great deal'
  if (score >= 60) return 'Good deal'
  if (score >= 40) return 'Fair price'
  return 'Overpriced'
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [minScore, setMinScore] = useState(60)
  const [sortBy, setSortBy] = useState('deal_score')

  useEffect(() => {
    fetchListings()
  }, [minScore, sortBy])

  async function fetchListings() {
    setLoading(true)

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .not('deal_score', 'is', null)
      .gte('deal_score', minScore)
      .eq('is_active', true)
      .order(sortBy, { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching listings:', error)
    } else {
      setListings(data || [])
    }
    setLoading(false)
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Car Arbitrage</h1>
            <p className="text-sm text-gray-500">Lithuania used car intelligence</p>
          </div>
          <div className="text-sm text-gray-500">
            {filtered.length} listings shown
          </div>
        </div>
      </div>

      <div className="bg-white border-b px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search brand, model, location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Min score:</label>
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
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm focus:outline-none"
            >
              <option value="deal_score">Deal score</option>
              <option value="price_eur">Price</option>
              <option value="year">Year</option>
              <option value="mileage_km">Mileage</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading listings...</div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Car</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Year</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Mileage</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Est. value</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">vs Market</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
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
                      <a href={listing.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No listings match your filters.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}