import api from './api'

export const getProfil = () => api.get('/profil/')
export const updateProfil = (data) => api.patch('/profil/', data)
export const getPreferences = () => api.get('/profil/preferences')
export const updatePreferences = (prefs) => api.patch('/profil/preferences', { preferences: prefs })
export const getVitascore        = () => api.get('/profil/vitascore')
export const getMesConsultations = () => api.get('/profil/consultations')
