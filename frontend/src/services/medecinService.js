import api from './api'

export const getPatients              = ()           => api.get('/medecin/patients')
export const getAlertesCritiques      = (params={})  => api.get('/medecin/alertes-critiques', { params })
export const marquerVueAlerte         = (id)         => api.patch(`/medecin/alertes/${id}/vue`)
export const getResumePatient         = (id)         => api.get(`/medecin/patients/${id}/resume`)
export const getMesuresPatient        = (id)         => api.get(`/medecin/patients/${id}/mesures`)
export const getHistoriquePatient     = (id, typeId) => api.get(`/medecin/patients/${id}/historique/${typeId}`)
export const ajouterPatient           = (id)         => api.post(`/medecin/patients/${id}`)
export const getConsultationsPatient  = (id)         => api.get(`/medecin/patients/${id}/consultations`)
export const creerConsultation        = (data)       => api.post('/medecin/consultations', data)
export const modifierConsultation     = (id, data)   => api.patch(`/medecin/consultations/${id}`, data)
export const supprimerConsultation    = (id)         => api.delete(`/medecin/consultations/${id}`)
export const creerAnnotation          = (data)       => api.post('/medecin/annotations', data)
export const modifierAnnotation       = (id, txt)    => api.patch(`/medecin/annotations/${id}`, { commentaire: txt })
export const supprimerAnnotation      = (id)         => api.delete(`/medecin/annotations/${id}`)
export const getAnnotationsPatient    = (patientId)  => api.get(`/medecin/patients/${patientId}/annotations`)

export const downloadRapportPDF = async (patientId, patientNom) => {
  const res = await api.get(`/medecin/patients/${patientId}/rapport-pdf`, {
    responseType: 'blob',
  })

  const blob = res.data

  // Si le serveur a renvoyé une erreur JSON au lieu d'un PDF
  if (blob.type && blob.type.includes('json')) {
    const text = await blob.text()
    let msg = 'Erreur lors de la génération du rapport'
    try { msg = JSON.parse(text).error || msg } catch { /* ignore */ }
    throw new Error(msg)
  }

  const url  = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href         = url
  link.style.display = 'none'
  link.setAttribute(
    'download',
    `rapport_sotera_${(patientNom || 'patient').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
  )
  document.body.appendChild(link)
  link.click()
  // Nettoyage différé pour laisser le temps au navigateur d'initier le téléchargement
  setTimeout(() => {
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, 500)
}
