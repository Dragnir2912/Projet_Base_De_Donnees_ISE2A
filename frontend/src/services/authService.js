import api from './api'

export const login = (email, mot_de_passe) =>
  api.post('/auth/login', { email, mot_de_passe })

export const register = (data) =>
  api.post('/auth/register', data)

export const getMe = () =>
  api.get('/auth/me')
