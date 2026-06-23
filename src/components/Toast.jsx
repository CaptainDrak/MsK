import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [])

  const colors = type === 'error'
    ? 'bg-red-600 text-white'
    : 'bg-gray-800 text-white'

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-[200] ${colors}`}>
      {message}
    </div>
  )
}
