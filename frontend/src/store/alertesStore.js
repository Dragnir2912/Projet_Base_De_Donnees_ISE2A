import { create } from 'zustand'
import { getCompteur } from '../services/alertesService'

const useAlertesStore = create((set) => ({
  nbNonVues: 0,
  fetchCompteur: async () => {
    try {
      const { data } = await getCompteur()
      set({ nbNonVues: data.data.non_vues })
    } catch {
      // silencieux
    }
  },
  decrementer: () => set((s) => ({ nbNonVues: Math.max(0, s.nbNonVues - 1) })),
  reset: () => set({ nbNonVues: 0 }),
}))

export default useAlertesStore
