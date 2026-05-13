import { useEffect, useState, useCallback } from 'react'
import { PlusCircle, X, ArrowLeft, Search, Pencil, Trash2, Info, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import MesureInfoPopover from '../../components/health/MesureInfoPopover'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  ComposedChart, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  getMesures, creerMesure, getTypes, getHistorique,
  modifierMesure, supprimerMesure, getPredictions,
} from '../../services/mesuresService'

const TYPE_COLORS = [
  '#FF2D55', '#FF9500', '#FFD60A', '#34C759',
  '#5AC8FA', '#0A84FF', '#BF5AF2', '#FF375F',
]

const COMPOSANTE_LABEL = {
  'Tension systolique': 'Diastolique',
  'Tension artérielle': 'Diastolique',
  'Cholestérol':        'HDL',
}

const CONTEXTES = [
  { value: 'a_jeun',        label: 'À jeun' },
  { value: 'post_repas',    label: 'Post-repas' },
  { value: 'au_repos',      label: 'Au repos' },
  { value: 'apres_effort',  label: 'Après effort' },
  { value: 'avant_coucher', label: 'Avant coucher' },
]

const EMPTY_FORM = {
  type_mesure_id: '',
  valeur:         '',
  date_mesure:    format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  contexte:       '',
  note:           '',
  valeur2:        '',
}

export default function MesuresPage() {
  const [types,        setTypes]        = useState([])
  const [mesures,      setMesures]      = useState([])
  const [historique,   setHistorique]   = useState([])
  const [selectedType, setSelectedType] = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [loadingHisto, setLoadingHisto] = useState(false)
  const [search,       setSearch]       = useState('')

  // Modal création / édition
  const [showForm,       setShowForm]       = useState(false)
  const [editingMesure,  setEditingMesure]  = useState(null)   // mesure à éditer, null = création
  const [form,           setForm]           = useState(EMPTY_FORM)

  // Suppression
  const [deletingMesure, setDeletingMesure] = useState(null)

  // Popover info type
  const [infoType, setInfoType] = useState(null)  // TypeMesure | null

  // Prédictions
  const [prediction, setPrediction] = useState(null)

  const loadAll = useCallback(async () => {
    try {
      const [t, m] = await Promise.all([getTypes(), getMesures()])
      setTypes(t.data.data ?? [])
      setMesures(m.data.data ?? [])
    } catch {
      toast.error('Impossible de charger les mesures.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const refreshHistorique = useCallback(async (type) => {
    const t = type ?? selectedType
    if (!t) return
    setLoadingHisto(true)
    try {
      const res = await getHistorique(t.id)
      setHistorique(res.data.data ?? [])
    } catch {
      setHistorique([])
    } finally {
      setLoadingHisto(false)
    }
  }, [selectedType])

  const selectType = async (type) => {
    setSelectedType(type)
    setPrediction(null)
    setLoadingHisto(true)
    try {
      const [hist, pred] = await Promise.allSettled([
        getHistorique(type.id),
        getPredictions(type.id, 7),
      ])
      setHistorique(hist.status === 'fulfilled' ? (hist.value.data.data ?? []) : [])
      if (pred.status === 'fulfilled' && pred.value.data.data?.suffisant) {
        setPrediction(pred.value.data.data)
      }
    } finally {
      setLoadingHisto(false)
    }
  }

  /* ── Ouvrir modal création ── */
  const openCreate = () => {
    setEditingMesure(null)
    setForm({ ...EMPTY_FORM, date_mesure: format(new Date(), "yyyy-MM-dd'T'HH:mm") })
    setShowForm(true)
  }

  /* ── Ouvrir modal édition ── */
  const openEdit = (mesure) => {
    setEditingMesure(mesure)
    setForm({
      type_mesure_id: String(mesure.type_mesure_id),
      valeur:         String(mesure.valeur),
      date_mesure:    format(new Date(mesure.date_mesure), "yyyy-MM-dd'T'HH:mm"),
      contexte:       mesure.contexte ?? '',
      note:           mesure.note ?? '',
      valeur2:        mesure.composantes?.[0]?.valeur ? String(mesure.composantes[0].valeur) : '',
    })
    setShowForm(true)
  }

  /* ── Soumettre création ── */
  const onSubmitCreate = async (e) => {
    e.preventDefault()
    const composantes = []
    const typeId = parseInt(form.type_mesure_id)
    const selectedFormType = types.find((t) => t.id === typeId)
    if (form.valeur2 && selectedFormType && COMPOSANTE_LABEL[selectedFormType.nom]) {
      composantes.push({ composante: COMPOSANTE_LABEL[selectedFormType.nom], valeur: parseFloat(form.valeur2) })
    }
    try {
      await creerMesure({
        type_mesure_id: typeId,
        valeur:         parseFloat(form.valeur),
        date_mesure:    form.date_mesure,
        contexte:       form.contexte || null,
        note:           form.note || null,
        composantes,
      })
      toast.success('Mesure enregistrée !')
      setShowForm(false)
      await loadAll()
      await refreshHistorique()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'enregistrement.')
    }
  }

  /* ── Soumettre édition ── */
  const onSubmitEdit = async (e) => {
    e.preventDefault()
    try {
      const updated = await modifierMesure(editingMesure.id, {
        valeur:      parseFloat(form.valeur),
        date_mesure: form.date_mesure,
        contexte:    form.contexte || null,
        note:        form.note || null,
      })
      toast.success('Mesure mise à jour !')
      setShowForm(false)
      // Mettre à jour en place dans les deux listes
      const data = updated.data.data
      setMesures((prev) => prev.map((m) => m.id === data.id ? { ...m, ...data } : m))
      setHistorique((prev) => prev.map((m) => m.id === data.id ? { ...m, ...data } : m))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour.')
    }
  }

  /* ── Confirmer suppression ── */
  const onConfirmDelete = async () => {
    if (!deletingMesure) return
    const id = deletingMesure.id
    setDeletingMesure(null)
    try {
      await supprimerMesure(id)
      toast.success('Mesure supprimée.')
      setMesures((prev) => prev.filter((m) => m.id !== id))
      setHistorique((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression.')
    }
  }

  const filteredTypes = types.filter((t) =>
    t.nom.toLowerCase().includes(search.toLowerCase())
  )

  const typeSelectionne = types.find((t) => t.id === parseInt(form.type_mesure_id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {selectedType ? (
          <button
            onClick={() => setSelectedType(null)}
            className="flex items-center gap-2 font-medium text-sm"
            style={{ color: 'var(--health-blue)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={18} /> Retour aux indicateurs
          </button>
        ) : (
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Mes mesures
          </h1>
        )}
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #0A84FF, #5AC8FA)', boxShadow: '0 4px 14px rgba(10,132,255,0.3)', border: 'none', cursor: 'pointer' }}
        >
          <PlusCircle size={16} />
          Nouvelle mesure
        </button>
      </div>

      {/* Detail view */}
      {selectedType ? (
        <TypeDetailView
          type={selectedType}
          historique={historique}
          loading={loadingHisto}
          colorIndex={types.indexOf(selectedType)}
          prediction={prediction}
          onEdit={openEdit}
          onDelete={(m) => setDeletingMesure(m)}
        />
      ) : (
        <>
          {/* Search */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
          >
            <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un indicateur…"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)', border: 'none', fontFamily: 'DM Sans' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type grid */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
              Indicateurs ({filteredTypes.length})
            </p>
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
              </div>
            ) : filteredTypes.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Aucun indicateur trouvé.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredTypes.map((t, i) => (
                  <TypeTile
                    key={t.id}
                    type={t}
                    color={TYPE_COLORS[i % TYPE_COLORS.length]}
                    lastMesure={mesures.find((m) => m.type_mesure_id === t.id || m.nom_type === t.nom)}
                    onClick={() => selectType(t)}
                    onInfo={(e) => { e.stopPropagation(); setInfoType(t) }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent measures */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
              Mesures récentes
            </p>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : mesures.length === 0 ? (
              <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Aucune mesure enregistrée.</p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                {mesures.map((m, idx) => (
                  <MesureListItem
                    key={m.id}
                    mesure={m}
                    isLast={idx === mesures.length - 1}
                    color={TYPE_COLORS[types.findIndex((t) => t.id === m.type_mesure_id) % TYPE_COLORS.length] ?? '#0A84FF'}
                    onEdit={() => openEdit(m)}
                    onDelete={() => setDeletingMesure(m)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal création / édition */}
      {showForm && (
        <MesureModal
          types={types}
          form={form}
          setForm={setForm}
          typeSelectionne={typeSelectionne}
          isEditing={!!editingMesure}
          onSubmit={editingMesure ? onSubmitEdit : onSubmitCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Dialog suppression */}
      {deletingMesure && (
        <DeleteMesureDialog
          mesure={deletingMesure}
          onConfirm={onConfirmDelete}
          onCancel={() => setDeletingMesure(null)}
        />
      )}

      {/* Popover info type de mesure */}
      {infoType && (
        <MesureInfoPopover
          type={infoType}
          derniereValeur={mesures.find((m) => m.type_mesure_id === infoType.id || m.nom_type === infoType.nom)?.valeur ?? null}
          onClose={() => setInfoType(null)}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   COMPOSANTS
═══════════════════════════════════════════════════ */

function TypeTile({ type, color, lastMesure, onClick, onInfo }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="rounded-2xl p-4 text-left transition-all duration-200 hover-lift relative"
      style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', cursor: 'pointer' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icône info (hover) */}
      {hovered && (
        <button
          onClick={onInfo}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg transition-all"
          style={{ background: `${color}18`, color, border: 'none', cursor: 'pointer' }}
          title={`En savoir plus sur ${type.nom}`}
        >
          <Info size={13} />
        </button>
      )}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-white font-bold text-sm"
        style={{ background: color }}
      >
        {type.nom.charAt(0)}
      </div>
      <p className="text-sm font-semibold leading-tight mb-0.5" style={{ color: 'var(--text-primary)' }}>
        {type.nom}
      </p>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {lastMesure ? `${lastMesure.valeur} ${type.unite}` : type.unite}
      </p>
      {type.nom === 'IMC' && (
        <p className="text-[9px] mt-1 font-medium" style={{ color: color, opacity: 0.8 }}>
          Calculé automatiquement
        </p>
      )}
      {lastMesure && (
        <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {format(new Date(lastMesure.date_mesure), 'd MMM', { locale: fr })}
        </p>
      )}
    </div>
  )
}

/* ── Ligne mesure récente avec actions hover ── */
function MesureListItem({ mesure, isLast, color, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const isAbn = mesure.statut === 'anormal'

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 transition-all duration-150"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {mesure.nom_type ?? mesure.type_mesure}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {format(new Date(mesure.date_mesure), 'd MMMM yyyy · HH:mm', { locale: fr })}
          {mesure.contexte && ` · ${mesure.contexte.replace(/_/g, ' ')}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-base font-bold tabular-nums" style={{ color: isAbn ? 'var(--health-red)' : 'var(--text-primary)' }}>
          {mesure.valeur}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{mesure.unite}</span>
        {isAbn && <span className="badge badge-danger">Anormal</span>}
        {mesure.statut === 'normal' && <span className="badge badge-success">Normal</span>}

        {/* Actions hover */}
        {hovered && (
          <div className="flex items-center gap-1 ml-1">
            <ActionIcon icon={<Pencil size={13} />} title="Modifier" onClick={onEdit} color="var(--health-blue)" />
            <ActionIcon icon={<Trash2 size={13} />} title="Supprimer" onClick={onDelete} color="#FF2D55" />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Ligne historique avec actions hover ── */
function HistoriqueItem({ mesure, isLast, type, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="flex items-center justify-between px-6 py-3.5 transition-all"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {format(new Date(mesure.date_mesure), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
        </p>
        {mesure.contexte && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {mesure.contexte.replace(/_/g, ' ')}
          </p>
        )}
        {mesure.note && (
          <p className="text-xs mt-0.5 italic" style={{ color: 'var(--text-tertiary)' }}>
            {mesure.note}
          </p>
        )}
        {/* Annotation du médecin */}
        {mesure.annotation_medecin && (
          <div className="flex items-start gap-1.5 mt-1.5 px-2.5 py-1.5 rounded-xl"
            style={{ background: 'rgba(191,90,242,0.08)' }}>
            <span className="text-[10px] flex-shrink-0 mt-0.5">✏️</span>
            <div>
              <p className="text-xs font-medium" style={{ color: '#BF5AF2' }}>
                {mesure.annotation_medecin.commentaire}
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(191,90,242,0.7)' }}>
                {mesure.annotation_medecin.medecin}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{mesure.valeur}</span>
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{mesure.unite ?? type?.unite}</span>
        {mesure.statut === 'anormal' && <span className="badge badge-danger">Anormal</span>}

        {hovered && (
          <div className="flex items-center gap-1 ml-1">
            <ActionIcon icon={<Pencil size={13} />} title="Modifier" onClick={() => onEdit(mesure)} color="var(--health-blue)" />
            <ActionIcon icon={<Trash2 size={13} />} title="Supprimer" onClick={() => onDelete(mesure)} color="#FF2D55" />
          </div>
        )}
      </div>
    </div>
  )
}

function ActionIcon({ icon, title, onClick, color }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title={title}
      className="w-6 h-6 flex items-center justify-center rounded-lg transition-all duration-150"
      style={{
        background: hov ? `${color}18` : 'transparent',
        color: hov ? color : 'var(--text-tertiary)',
        border: 'none', cursor: 'pointer',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {icon}
    </button>
  )
}

/* ── Vue détail d'un type ── */
function TypeDetailView({ type, historique, loading, colorIndex, prediction, onEdit, onDelete }) {
  const color  = TYPE_COLORS[colorIndex % TYPE_COLORS.length] ?? '#0A84FF'
  const latest = historique[0]
  const gradId = `grad-${colorIndex}`

  // Construction des données du graphique : historique + prédictions en continu
  const buildChartData = () => {
    const hist = historique.slice().reverse().map(m => ({
      date:   format(new Date(m.date_mesure), 'd MMM', { locale: fr }),
      valeur: m.valeur,
      pred:   undefined,
    }))

    if (!prediction?.predictions?.length) return hist

    // Point de jonction : le dernier point réel porte aussi la valeur prédite
    if (hist.length > 0) {
      hist[hist.length - 1].pred = hist[hist.length - 1].valeur
    }

    // Points de prédiction
    for (const p of prediction.predictions) {
      hist.push({
        date:   format(new Date(p.date), 'd MMM', { locale: fr }),
        valeur: undefined,
        pred:   p.valeur_predite,
        confH:  p.valeur_predite + p.intervalle_confiance,
        confL:  p.valeur_predite - p.intervalle_confiance,
      })
    }
    return hist
  }

  const chartData = buildChartData()
  const lastPred  = prediction?.predictions?.at(-1)

  return (
    <div className="space-y-4">
      {/* Info card */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0" style={{ background: color }}>
            {type.nom.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{type.nom}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{type.description || `Unité : ${type.unite}`}</p>
            {type.seuil_min_normal && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                Zone normale : <span style={{ color: 'var(--health-green)', fontWeight: 600 }}>
                  {type.seuil_min_normal} – {type.seuil_max_normal} {type.unite}
                </span>
              </p>
            )}
          </div>
          {latest && (
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold tabular-nums" style={{ color, letterSpacing: '-1px' }}>{latest.valeur}</p>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{type.unite}</p>
            </div>
          )}
        </div>
      </div>

      {/* Badges prédiction */}
      {prediction && (
        <div className="flex flex-wrap gap-2">
          {/* Fiabilité */}
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--health-blue)' }}>
            Prédiction J+7 : <strong>{lastPred?.valeur_predite} {type.unite}</strong>
            {' '}(fiabilité {prediction.fiabilite})
          </span>
          {/* Alerte prédictive */}
          {prediction.alerte_predictive && (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: prediction.alerte_predictive === 'danger' ? 'rgba(255,45,85,0.1)' : 'rgba(255,149,0,0.1)', color: prediction.alerte_predictive === 'danger' ? 'var(--health-red)' : 'var(--health-orange)' }}>
              <AlertTriangle size={12} />
              {prediction.alerte_predictive === 'danger' ? '⚠️ Risque de dépassement critique prévu' : '⚠️ Risque de dépassement prévu'}
            </span>
          )}
          {/* Tendance */}
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
            {prediction.tendance === 'hausse' ? <TrendingUp size={12} /> : prediction.tendance === 'baisse' ? <TrendingDown size={12} /> : <Minus size={12} />}
            Tendance {prediction.tendance} · R²={prediction.r_squared}
          </span>
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : chartData.length > 0 ? (
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Évolution{prediction ? ' & Prédiction' : ''}</h3>
            {prediction && (
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <span className="flex items-center gap-1"><span style={{ display: 'inline-block', width: 20, height: 2, background: color, borderRadius: 1 }} /> Réel</span>
                <span className="flex items-center gap-1"><span style={{ display: 'inline-block', width: 20, height: 2, background: color, opacity: 0.5, borderRadius: 1, borderTop: `2px dashed ${color}` }} /> Prédit</span>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'DM Sans' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'DM Sans' }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-elevated)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'DM Sans' }}
                formatter={(val, name) => {
                  if (name === 'valeur') return [val != null ? `${val} ${type.unite}` : '—', 'Réel']
                  if (name === 'pred')   return [val != null ? `${val} ${type.unite}` : '—', 'Prédit']
                  return [val, name]
                }}
              />
              {type.seuil_min_normal && <ReferenceLine y={type.seuil_min_normal} stroke="var(--health-orange)" strokeDasharray="4 4" strokeWidth={1.5} />}
              {type.seuil_max_normal && <ReferenceLine y={type.seuil_max_normal} stroke="var(--health-orange)" strokeDasharray="4 4" strokeWidth={1.5} />}
              {/* Courbe réelle */}
              <Area type="monotone" dataKey="valeur" stroke={color} strokeWidth={2.5} fill={`url(#${gradId})`} dot={false} activeDot={{ r: 5, fill: color, strokeWidth: 0 }} connectNulls={false} />
              {/* Courbe de prédiction (pointillés) */}
              {prediction && (
                <Line type="monotone" dataKey="pred" stroke={color} strokeWidth={2} strokeDasharray="6 4" strokeOpacity={0.6} dot={false} activeDot={{ r: 4, fill: color, strokeWidth: 0 }} connectNulls />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Aucune donnée pour ce type de mesure.</p>
        </div>
      )}

      {/* Historique avec actions */}
      {historique.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Historique</h3>
          </div>
          {historique.map((m, idx) => (
            <HistoriqueItem key={m.id} mesure={m} isLast={idx === historique.length - 1} type={type} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Modal création / édition ── */
function MesureModal({ types, form, setForm, typeSelectionne, isEditing, onSubmit, onClose }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-elevated)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            {isEditing ? 'Modifier la mesure' : 'Nouvelle mesure'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: 'none', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Type selector — désactivé en édition, IMC masqué (calculé automatiquement) */}
          {!isEditing && (
            <div>
              <label className="field-label">Type de mesure</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {types.filter((t) => t.nom !== 'IMC').map((t, i) => {
                  const color    = TYPE_COLORS[i % TYPE_COLORS.length]
                  const isActive = form.type_mesure_id === String(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm({ ...form, type_mesure_id: String(t.id) })}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                      style={{
                        background: isActive ? `${color}18` : 'var(--bg-secondary)',
                        border:     `1.5px solid ${isActive ? color : 'transparent'}`,
                        color:      isActive ? color : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: color }}>
                        {t.nom.charAt(0)}
                      </div>
                      <span>{t.nom}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Valeur */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">
                {typeSelectionne ? `Valeur (${typeSelectionne.unite})` : 'Valeur'}
                {!isEditing && typeSelectionne && COMPOSANTE_LABEL[typeSelectionne.nom] && ' — Systolique'}
              </label>
              <input
                type="number" step="0.01"
                value={form.valeur}
                onChange={(e) => setForm({ ...form, valeur: e.target.value })}
                required placeholder="0.0"
                className="field-input"
              />
            </div>
            {!isEditing && typeSelectionne && COMPOSANTE_LABEL[typeSelectionne.nom] && (
              <div>
                <label className="field-label">{COMPOSANTE_LABEL[typeSelectionne.nom]} ({typeSelectionne.unite})</label>
                <input
                  type="number" step="0.01"
                  value={form.valeur2}
                  onChange={(e) => setForm({ ...form, valeur2: e.target.value })}
                  placeholder="0.0"
                  className="field-input"
                />
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="field-label">Date et heure</label>
            <input
              type="datetime-local"
              value={form.date_mesure}
              onChange={(e) => setForm({ ...form, date_mesure: e.target.value })}
              required className="field-input"
            />
          </div>

          {/* Contexte */}
          <div>
            <label className="field-label">Contexte</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CONTEXTES.map(({ value, label }) => {
                const isActive = form.contexte === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, contexte: isActive ? '' : value })}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: isActive ? 'rgba(10,132,255,0.12)' : 'var(--bg-secondary)',
                      color:      isActive ? 'var(--health-blue)' : 'var(--text-secondary)',
                      border:     `1.5px solid ${isActive ? 'var(--health-blue)' : 'transparent'}`,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="field-label">Note (optionnel)</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Observations…"
              rows={2}
              className="field-input resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #0A84FF, #5AC8FA)',
                boxShadow: '0 4px 14px rgba(10,132,255,0.3)',
                border: 'none', cursor: 'pointer',
              }}
            >
              {isEditing ? 'Enregistrer les modifications' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Dialog suppression mesure ── */
function DeleteMesureDialog({ mesure, onConfirm, onCancel }) {
  const dateStr = format(new Date(mesure.date_mesure), "d MMMM yyyy 'à' HH:mm", { locale: fr })
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-modal)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,45,85,0.1)' }}
          >
            <Trash2 size={18} color="#FF2D55" />
          </div>
          <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Supprimer cette mesure ?
          </p>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          Supprimer la mesure du <strong>{dateStr}</strong> ?
          Les alertes associées seront également supprimées. Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: '#FF2D55', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,45,85,0.3)' }}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
