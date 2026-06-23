import { useState, useRef, useEffect } from 'react'
import { themes } from '../themes'

export default function ThemePicker({ themeId, onThemeChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="text-[var(--t-hdr-sub)] hover:text-[var(--t-hdr-text)] transition-colors cursor-pointer"
        title="Change theme"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-[200] w-48">
          <p className="text-xs font-semibold text-gray-500 mb-2 px-1">Choose a theme</p>
          <div className="grid grid-cols-5 gap-2">
            {themes.map(theme => (
              <button
                key={theme.id}
                onClick={() => { onThemeChange(theme.id); setOpen(false) }}
                title={theme.name}
                className="relative cursor-pointer"
              >
                <div
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: theme.swatch,
                    borderColor: themeId === theme.id ? '#000' : 'transparent',
                  }}
                />
                {themeId === theme.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="mt-2 px-1">
            <p className="text-xs text-gray-400 text-center">
              {themes.find(t => t.id === themeId)?.name}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
