'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/language'
import Link from 'next/link'
import FeedbackBubble from '@/components/FeedbackBubble'

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
  color: string
  engine_cc: number
  drivetrain: string
  location: string
  url: string
  image_url: string
  description: string
  first_seen_at: string
  last_seen_at: string
}

interface Similar {
  id: number
  brand: string
  model: string
  year: number
  mileage_km: number
  price_eur: number
  deal_score: number
  fuel_type: string
  url: string
}

export default function ListingPage() {
  const params = useParams()
  const { lang } = useLang()
  const [listing, setListing] = useState<Listing | null>(null)
  const [similar, setSimilar] = useState<Similar[]>([])
  const [loading, setLoading] = useState(true)
  const [imageOpen, setImageOpen] = useState(false)

  useEffect(() => {
    if (!imageOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setImageOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [imageOpen])

  useEffect(() => {
    if (params.id) {
      fetchListing(Number(params.id))
    }
  }, [params.id])

  async function fetchListing(id: number) {
    setLoading(true)
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching listing:', error)
    } else {
      setListing(data as Listing)
      if (data) fetchSimilar(data)
    }
    setLoading(false)
  }

  async function fetchSimilar(l: Listing) {
    if (!l.brand || !l.model) return
    const { data } = await supabase
      .from('listings')
      .select('id, brand, model, year, mileage_km, price_eur, deal_score, fuel_type, url')
      .eq('brand', l.brand)
      .eq('model', l.model)
      .neq('id', l.id)
      .not('price_eur', 'is', null)
      .order('deal_score', { ascending: false })
      .limit(6)

    setSimilar((data as Similar[]) || [])
  }

  const scoreColor = (score: number) => {
    if (score >= 75) return 'bg-green-500/20 text-green-400 border border-green-500/30'
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    if (score >= 40) return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
    return 'bg-red-500/20 text-red-400 border border-red-500/30'
  }

  const scoreLabel = (score: number) => {
    if (score >= 75) return lang === 'lt' ? 'Puikus pasiūlymas' : 'Great deal'
    if (score >= 60) return lang === 'lt' ? 'Geras pasiūlymas' : 'Good deal'
    if (score >= 40) return lang === 'lt' ? 'Vidutinė kaina' : 'Fair price'
    return lang === 'lt' ? 'Per brangu' : 'Overpriced'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString(lang === 'lt' ? 'lt-LT' : 'en-GB')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-500">{lang === 'lt' ? 'Kraunama...' : 'Loading...'}</div>
        <FeedbackBubble />
      </main>
    )
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">{lang === 'lt' ? 'Skelbimas nerastas' : 'Listing not found'}</div>
          <Link href="/dashboard" className="text-green-400 hover:text-green-300">
            {lang === 'lt' ? 'Grizti' : 'Go back'}
          </Link>
        </div>
        <FeedbackBubble />
      </main>
    )
  }

  const specs = [
    { label: lang === 'lt' ? 'Rida' : 'Mileage', value: listing.mileage_km ? `${listing.mileage_km.toLocaleString()} km` : '—' },
    { label: lang === 'lt' ? 'Metai' : 'Year', value: listing.year || '—' },
    { label: lang === 'lt' ? 'Kuras' : 'Fuel', value: listing.fuel_type || '—' },
    { label: lang === 'lt' ? 'Pavarų deze' : 'Gearbox', value: listing.transmission || '—' },
    { label: lang === 'lt' ? 'Variklis' : 'Engine', value: listing.engine_cc ? `${(listing.engine_cc / 1000).toFixed(1)}L` : '—' },
    { label: lang === 'lt' ? 'Kebulas' : 'Body', value: listing.body_type || '—' },
    { label: lang === 'lt' ? 'Spalva' : 'Color', value: listing.color || '—' },
    { label: lang === 'lt' ? 'Miestas' : 'Location', value: listing.location || '—' },
    { label: lang === 'lt' ? 'Pastebeta' : 'First seen', value: formatDate(listing.first_seen_at) },
    { label: lang === 'lt' ? 'Atnaujinta' : 'Last seen', value: formatDate(listing.last_seen_at) },
  ]

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-xl">📡</span>
            <span className="font-bold text-lg tracking-tight">DealRadar</span>
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
            {lang === 'lt' ? 'Grizti i sarasa' : 'Back to listings'}
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-4">
            <div
              className={`bg-gray-900 rounded-xl border border-gray-800 overflow-hidden aspect-video flex items-center justify-center ${listing.image_url ? 'cursor-zoom-in' : ''}`}
              onClick={() => listing.image_url && setImageOpen(true)}
              role={listing.image_url ? 'button' : undefined}
              tabIndex={listing.image_url ? 0 : undefined}
              onKeyDown={e => {
                if (listing.image_url && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  setImageOpen(true)
                }
              }}
            >
              {listing.image_url ? (
                <img src={listing.image_url} alt={`${listing.brand} ${listing.model}`} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-gray-600">
                  <div className="text-6xl mb-2">🚗</div>
                  <div className="text-sm">{lang === 'lt' ? 'Nuotrauka nepasiekiama' : 'No image available'}</div>
                </div>
              )}
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h1 className="text-2xl font-bold text-white mb-1">{listing.brand} {listing.model} {listing.year}</h1>
              <p className="text-gray-400 text-sm mb-4">{listing.body_type} · {listing.fuel_type} · {listing.transmission}</p>
              <div className="grid grid-cols-2 gap-3">
                {specs.map(spec => (
                  <div key={spec.label} className="bg-gray-800 rounded-lg px-4 py-3">
                    <div className="text-xs text-gray-500 mb-1">{spec.label}</div>
                    <div className="text-sm text-white font-medium">{spec.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="text-3xl font-bold text-white mb-1">
                {listing.price_eur ? `€${listing.price_eur.toLocaleString()}` : '—'}
              </div>
              {listing.estimated_price && (
                <div className="text-sm text-gray-400 mb-3">
                  {lang === 'lt' ? 'Rinkos verte' : 'Est. market value'}: €{listing.estimated_price.toLocaleString()}
                </div>
              )}
              {listing.deal_score && (
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-3 ${scoreColor(listing.deal_score)}`}>
                  <span className="font-bold text-lg">{listing.deal_score.toFixed(0)}</span>
                  <span>· {scoreLabel(listing.deal_score)}</span>
                </div>
              )}
              {listing.price_vs_median && (
                <div className={`text-sm font-semibold mb-3 ${listing.price_vs_median < 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {listing.price_vs_median > 0 ? '+' : ''}{listing.price_vs_median.toFixed(1)}% {lang === 'lt' ? 'nuo rinkos' : 'vs market'}
                </div>
              )}
              {listing.comparable_count && (
                <div className="text-xs text-gray-500 mb-4">
                  {lang === 'lt' ? 'Palyginta su' : 'Based on'} {listing.comparable_count} {lang === 'lt' ? 'automobiliais' : 'similar cars'}
                </div>
              )}
              <a href={listing.url} target="_blank" rel="noopener noreferrer" className="block w-full bg-green-500 hover:bg-green-400 text-gray-950 font-semibold px-4 py-3 rounded-xl text-center transition-colors">
                {lang === 'lt' ? 'Žiūrėti skelbimą' : 'View listing'}
              </a>
            </div>

            {similar.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-sm font-semibold text-gray-400 mb-3">
                  {lang === 'lt' ? 'Panasus automobiliai' : 'Similar cars'}
                </h2>
                <div className="space-y-2">
                  {similar.map(s => (
                    <div key={s.id} onClick={() => window.open(`/listing/${s.id}`, '_blank')} className="bg-gray-800 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-white font-medium">{s.brand} {s.model} {s.year}</div>
                          <div className="text-xs text-gray-500">{s.mileage_km ? `${s.mileage_km.toLocaleString()} km` : '—'} · {s.fuel_type}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-white">{s.price_eur ? `€${s.price_eur.toLocaleString()}` : '—'}</div>
                          {s.deal_score && <div className="text-xs text-green-400">{s.deal_score.toFixed(0)} pts</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {imageOpen && listing.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setImageOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'lt' ? 'Nuotrauka' : 'Image'}
        >
          <button
            type="button"
            onClick={() => setImageOpen(false)}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 transition-colors"
            aria-label={lang === 'lt' ? 'Uždaryti' : 'Close'}
          >
            ×
          </button>
          <img
            src={listing.image_url}
            alt={`${listing.brand} ${listing.model}`}
            className="max-h-[90vh] max-w-full object-contain"
          />
        </div>
      )}
      <FeedbackBubble />
    </main>
  )
}