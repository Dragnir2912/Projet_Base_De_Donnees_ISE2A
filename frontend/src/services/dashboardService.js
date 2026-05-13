import api from './api'

export const getTendances = () => api.get('/dashboard/tendances')
export const getTaches    = () => api.get('/dashboard/taches')
