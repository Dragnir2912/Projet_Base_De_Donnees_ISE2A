import { create } from 'zustand'

function getInitialTheme() {
  const saved = localStorage.getItem('sotera-theme')
  if (saved === 'dark' || saved === 'light') return saved
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

function applyTheme(theme) {
  const root = document.documentElement
  root.classList.add('theme-transitioning')
  root.setAttribute('data-theme', theme)
  localStorage.setItem('sotera-theme', theme)
  setTimeout(() => root.classList.remove('theme-transitioning'), 350)
}

const initial = getInitialTheme()
applyTheme(initial)

const useThemeStore = create((set) => ({
  theme: initial,

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light'
      applyTheme(next)
      return { theme: next }
    }),

  setTheme: (theme) =>
    set(() => {
      applyTheme(theme)
      return { theme }
    }),
}))

export default useThemeStore
