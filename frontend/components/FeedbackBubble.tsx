'use client'

const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSf2HiLdhuo7NJ74TJITtPbZ7_cuVTswfup_nrtYDLjXxzStCQ/viewform'

const linkClass =
  'bg-[#22c55e] hover:bg-green-600 text-white shadow-lg transition-colors cursor-pointer'

export default function FeedbackBubble() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5">
      <a
        href={FEEDBACK_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`group/bubble relative ${linkClass} text-xs font-medium px-3 py-2 rounded-2xl rounded-br-sm whitespace-nowrap`}
      >
        Palikti atsiliepimą! 💬
        <span
          className="absolute -right-1 top-1/2 -translate-y-1/2 size-2 rotate-45 bg-[#22c55e] group-hover/bubble:bg-green-600 transition-colors"
          aria-hidden
        />
      </a>
      <a
        href={FEEDBACK_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Palikti atsiliepimą"
        className={`${linkClass} flex size-11 shrink-0 items-center justify-center rounded-full text-lg`}
      >
        💬
      </a>
    </div>
  )
}
