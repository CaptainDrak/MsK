import { useState, useEffect } from 'react'
import { themes, defaultTheme } from '../themes'

export function useTheme() {
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('theme') || defaultTheme.id
  })

  useEffect(() => {
    const theme = themes.find(t => t.id === themeId) || defaultTheme
    const root = document.documentElement
    Object.entries(theme.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    localStorage.setItem('theme', themeId)
  }, [themeId])

  return { themeId, setThemeId }
}
