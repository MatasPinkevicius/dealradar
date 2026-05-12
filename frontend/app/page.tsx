import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📡</span>
          <span className="font-bold text-xl tracking-tight">DealRadar</span>
        </div>
        <Link href="/dashboard" className="bg-white text-gray-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
          Open Dashboard
        </Link>
      </nav>

      <section className="max-w-4xl mx-auto px-8 py-24 text-center">
        <div className="inline-block bg-green-500/10 text-green-400 text-sm font-medium px-3 py-1 rounded-full mb-6 border border-green-500/20">
          🇱🇹 Lithuania • Live market data
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
          Find undervalued cars<br />
          <span className="text-green-400">before anyone else does</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          DealRadar scans autoplius.lt and scores every listing against real market data.
          Get instant alerts when a great deal appears — before dealers snap it up.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard" className="bg-green-500 hover:bg-green-400 text-gray-950 font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
            View live deals
          </Link>
          <a href="https://t.me/your_bot_username" className="border border-gray-700 hover:border-gray-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
            Get Telegram alerts
          </a>
        </div>
      </section>

      <section className="border-y border-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-8 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-green-400">4,000+</div>
            <div className="text-gray-400 mt-1">Listings tracked</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-400">Live</div>
            <div className="text-gray-400 mt-1">Market scoring</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-400">Free</div>
            <div className="text-gray-400 mt-1">During beta</div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-8 py-24">
        <h2 className="text-3xl font-bold text-center mb-16">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="font-semibold text-lg mb-2">We scan the market</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              DealRadar automatically scrapes autoplius.lt and collects every used car listing in Lithuania.
            </p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="font-semibold text-lg mb-2">We score every car</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Each listing is compared against similar cars — same model, year, mileage, fuel type — and scored 0-100.
            </p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="text-3xl mb-4">🔔</div>
            <h3 className="font-semibold text-lg mb-2">You get alerted</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              When a great deal appears that matches your criteria, you get a Telegram notification instantly.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-8 pb-24">
        <h2 className="text-3xl font-bold text-center mb-4">What an alert looks like</h2>
        <p className="text-gray-400 text-center mb-12">Real deals sent directly to your Telegram</p>
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
            <div className="pt-2 text-blue-400 underline cursor-pointer">View listing</div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-800 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to find your next deal?</h2>
        <p className="text-gray-400 mb-8">Free during beta. No credit card required.</p>
        <Link href="/dashboard" className="bg-green-500 hover:bg-green-400 text-gray-950 font-semibold px-8 py-4 rounded-xl text-lg transition-colors inline-block">
          View live deals
        </Link>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        DealRadar · Lithuania · {new Date().getFullYear()}
      </footer>

    </main>
  )
}