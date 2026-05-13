import api from './api'

// Patient
export const getMonMedecin      = () => api.get('/relations/mon-medecin')
export const getMedecinsDispos  = (search = '') => api.get('/relations/medecins-disponibles', { params: { search } })
export const envoyerDemande     = (medecin_id, message = '') => api.post('/relations/demande', { medecin_id, message })
export const terminerSuivi      = (relation_id) => api.delete(`/relations/${relation_id}`)

// Médecin
export const getDemandes        = () => api.get('/relations/demandes')
export const repondreDemande    = (demande_id, action) => api.patch(`/relations/demandes/${demande_id}`, { action })
export const rechercherPatients = (search = '') => api.get('/relations/patients', { params: { search } })
