import api from './api'

export const getAlertes = (nonVues = false) =>
  api.get('/alertes/', { params: nonVues ? { non_vues: true } : {} })

export const marquerVue = (id) =>
  api.patch(`/alertes/${id}/vue`)

export const toutVoir = () =>
  api.patch('/alertes/tout-voir')

export const getCompteur = () =>
  api.get('/alertes/compteur')
