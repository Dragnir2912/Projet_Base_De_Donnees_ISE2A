import api from './api'

export const chatIA = (message, sessionId = null) =>
  api.post('/ia/chat', { message, session_id: sessionId })

export const getSessions = () =>
  api.get('/ia/sessions')

export const getSession = (sessionId) =>
  api.get(`/ia/sessions/${sessionId}`)

export const updateSessionTitre = (sessionId, titre) =>
  api.patch(`/ia/sessions/${sessionId}/titre`, { titre })

export const deleteSession = (sessionId) =>
  api.delete(`/ia/sessions/${sessionId}`)
