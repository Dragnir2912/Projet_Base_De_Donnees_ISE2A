import { create } from 'zustand'

const useSidebarStore = create((set) => ({
  collapsed: localStorage.getItem('sotera-sidebar') === 'collapsed',

  toggle: () =>
    set((state) => {
      const next = !state.collapsed
      localStorage.setItem('sotera-sidebar', next ? 'collapsed' : 'expanded')
      return { collapsed: next }
    }),

  setCollapsed: (val) =>
    set(() => {
      localStorage.setItem('sotera-sidebar', val ? 'collapsed' : 'expanded')
      return { collapsed: val }
    }),
}))

export default useSidebarStore
