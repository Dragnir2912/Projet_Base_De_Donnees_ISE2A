import api from './api'

export const getMesures = (typeId) =>
  api.get('/mesures/', { params: typeId ? { type_id: typeId } : {} })

export const creerMesure = (data) =>
  api.post('/mesures/', data)

export const getMesure = (id) =>
  api.get(`/mesures/${id}`)

export const getTypes = () =>
  api.get('/mesures/types')

export const getHistorique = (typeId, limit = 90) =>
  api.get(`/mesures/historique/${typeId}`, { params: { limit } })

export const modifierMesure = (id, data) =>
  api.put(`/mesures/${id}`, data)

export const supprimerMesure = (id) =>
  api.delete(`/mesures/${id}`)

export const getTypeMesure = (typeId) =>
  api.get(`/mesures/types/${typeId}`)

export const getPredictions = (typeId, jours = 7) =>
  api.get(`/mesures/predictions/${typeId}`, { params: { jours } })

export const getCorrelations = () =>
  api.get('/mesures/correlations')

export const getCalendrier = (mois) =>
  api.get('/mesures/calendrier', { params: mois ? { mois } : {} })
