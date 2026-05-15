'use client'

import { useEffect, useRef, useState } from 'react'

const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSf2HiLdhuo7NJ74TJITtPbZ7_cuVTswfup_nrtYDLjXxzStCQ/viewform'

export default function FeedbackBubble() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-3 w-72 max-w-[calc(100vw-3rem)] bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-lg text-white text-sm">
          <p className="mb-3 leading-relaxed">
            DealRadar yra beta versijoje — jūsų nuomonė labai svarbi!
          </p>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-[#22c55e] hover:bg-green-400 text-gray-950 font-semibold px-4 py-2 rounded-lg text-sm"
          >
            Palikti atsiliepimą
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg bg-[#22c55e] hover:bg-green-400 text-gray-950"
        aria-label="Palikti atsiliepimą"
        aria-expanded={open}
      >
        💬
      </button>
    </div>
  )
}
