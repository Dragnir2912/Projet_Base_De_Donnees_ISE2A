import api from './api'

export const getConversations = () =>
  api.get('/messages/conversations')

export const getMessages = (conversationId) =>
  api.get(`/messages/${conversationId}`)

export const envoyerMessage = (data) =>
  api.post('/messages/', data)
