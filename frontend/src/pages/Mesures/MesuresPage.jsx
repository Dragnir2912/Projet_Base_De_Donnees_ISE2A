import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { PlusCircle, X, ArrowLeft, Search, Pencil, Trash2, Info,
  TrendingUp, TrendingDown, Minus, AlertTriangle, Calendar } from 'lucide-react'
import MesureInfoPopover from '../../components/health/MesureInfoPopover'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  getMesures, creerMesure, getTypes, getHistorique,
  modifierMesure, supprimerMesure, getPredictions,
} from '../../services/mesuresService'

const TYPE_COLORS = [
  '#FF6B8A', '#4DAAFF', '#00D97E', '#FF8C42',
  '#9B77F5', '#00DDA0', '#F5C842', '#FF4B60',
]

const TYPE_ICONS = {
  'Fréquence cardiaque': '/illustrations/ui/mesure-cardio.svg',
  'Tension artérielle':  '/illustrations/ui/mesure-tension.svg',
  'Glycémie':            '/illustrations/ui/mesure-glycemie.svg',
  'Poids':               '/illustrations/ui/mesure-poids.svg',
  'Saturation O2':       '/illustrations/ui/mesure-spo2.svg',
  'IMC':                 '/illustrations/ui/mesure-poids.svg',
}

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
  const [types,          setTypes]          = useState([])
  const [mesures,        setMesures]        = useState([])
  const [historique,     setHistorique]     = useState([])
  const [selectedType,   setSelectedType]   = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [loadingHisto,   setLoadingHisto]   = useState(false)
  const [search,         setSearch]         = useState('')
  const [showForm,       setShowForm]       = useState(false)
  const [editingMesure,  setEditingMesure]  = useState(null)
  const [form,           setForm]           = useState(EMPTY_FORM)
  const [deletingMesure, setDeletingMesure] = useState(null)
  const [infoType,       setInfoType]       = useState(null)
  const [prediction,     setPrediction]     = useState(null)

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
    } catch { setHistorique([]) }
    finally  { setLoadingHisto(false) }
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
    } finally { setLoadingHisto(false) }
  }

  const openCreate = () => {
    setEditingMesure(null)
    setForm({ ...EMPTY_FORM, date_mesure: format(new Date(), "yyyy-MM-dd'T'HH:mm") })
    setShowForm(true)
  }

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

  const onSubmitCreate = async (e) => {
    e.preventDefault()
    const composantes = []
    const typeId = parseInt(form.type_mesure_id)
    const selType = types.find(t => t.id === typeId)
    if (form.valeur2 && selType && COMPOSANTE_LABEL[selType.nom]) {
      composantes.push({ composante: COMPOSANTE_LABEL[selType.nom], valeur: parseFloat(form.valeur2) })
    }
    try {
      await creerMesure({
        type_mesure_id: typeId, valeur: parseFloat(form.valeur),
        date_mesure: form.date_mesure, contexte: form.contexte || null,
        note: form.note || null, composantes,
      })
      toast.success('Mesure enregistrée !')
      setShowForm(false)
      await loadAll()
      await refreshHistorique()
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'enregistrement.")
    }
  }

  const onSubmitEdit = async (e) => {
    e.preventDefault()
    try {
      const updated = await modifierMesure(editingMesure.id, {
        valeur: parseFloat(form.valeur), date_mesure: form.date_mesure,
        contexte: form.contexte || null, note: form.note || null,
      })
      toast.success('Mesure mise à jour !')
      setShowForm(false)
      const data = updated.data.data
      setMesures(prev  => prev.map(m  => m.id === data.id ? { ...m, ...data } : m))
      setHistorique(prev => prev.map(m => m.id === data.id ? { ...m, ...data } : m))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour.')
    }
  }

  const onConfirmDelete = async () => {
    if (!deletingMesure) return
    const id = deletingMesure.id
    setDeletingMesure(null)
    try {
      await supprimerMesure(id)
      toast.success('Mesure supprimée.')
      setMesures(prev    => prev.filter(m => m.id !== id))
      setHistorique(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression.')
    }
  }

  const filteredTypes  = types.filter(t => t.nom.toLowerCase().includes(search.toLowerCase()))
  const typeSelectionne = types.find(t => t.id === parseInt(form.type_mesure_id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="page-enter">

      {/* ── Hero (list view) ── */}
      {!selectedType && (
        <div style={{
          position: 'relative', borderRadius: 24,
          overflow: 'hidden', height: 210,
          background: 'var(--surface-1)', border: '1px solid var(--border-0)',
        }} className="animate-fade-up">
          {/* Photo — right 55% */}
          <div style={{ position: 'absolute', right: 0, top: 0, width: '55%', height: '100%' }}>
            <img src="/illustrations/hero/mesures.jpg" alt="" aria-hidden
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to right, var(--surface-1) 0%, var(--surface-1) 20%, transparent 60%)',
            }} />
          </div>

          {/* Ambient glow */}
          <div style={{
            position: 'absolute', bottom: -40, left: -40, width: 200, height: 200,
            background: 'radial-gradient(circle, rgba(0,221,160,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Content */}
          <div style={{
            position: 'relative', zIndex: 1, height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '28px 32px',
          }}>
            <div>
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '1.5px', color: 'var(--accent)', display: 'block', marginBottom: 10,
              }}>
                Suivi · Indicateurs de santé
              </span>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--ink-1)', letterSpacing: '-1.4px', lineHeight: 1.1, margin: 0 }}>
                Mes mesures
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
                {loading ? '…' : mesures.length > 0
                  ? `${mesures.length} mesure${mesures.length > 1 ? 's' : ''} · ${types.length} indicateurs`
                  : 'Enregistrez vos premières mesures'}
              </p>
              <button onClick={openCreate} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px',
                borderRadius: 12, background: 'var(--accent)', border: 'none',
                color: '#0A1512', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,221,160,0.30)', transition: 'all 0.18s ease', flexShrink: 0,
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'none' }}
              >
                <PlusCircle size={15} /> Nouvelle mesure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail view header ── */}
      {selectedType && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }} className="animate-fade-up">
          <button onClick={() => setSelectedType(null)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--accent)', fontSize: 14, fontWeight: 600, padding: '6px 0',
          }}>
            <ArrowLeft size={16} /> Indicateurs
          </button>
          <button onClick={openCreate} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
            borderRadius: 12, background: 'var(--accent-dim)', border: '1px solid var(--border-2)',
            color: 'var(--accent)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.18s ease',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,221,160,0.16)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
          >
            <PlusCircle size={14} /> Nouvelle mesure
          </button>
        </div>
      )}

      {selectedType ? (
        <TypeDetailView
          type={selectedType}
          historique={historique}
          loading={loadingHisto}
          colorIndex={types.indexOf(selectedType)}
          prediction={prediction}
          onEdit={openEdit}
          onDelete={m => setDeletingMesure(m)}
        />
      ) : (
        <>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 16px', height: 44,
            background: 'var(--surface-1)', border: '1px solid var(--border-0)', borderRadius: 14,
          }} className="animate-fade-up delay-100">
            <Search size={15} color="var(--ink-3)" style={{ flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un indicateur…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--ink-1)', fontFamily: 'inherit' }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type grid */}
          <div className="animate-fade-up delay-150">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)' }}>
                Indicateurs
              </span>
              {!loading && <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{filteredTypes.length} types</span>}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" style={{ gap: 12 }}>
                {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 20 }} />)}
              </div>
            ) : filteredTypes.length === 0 ? (
              <div style={{ padding: '48px 32px', borderRadius: 20, background: 'var(--surface-1)', border: '1px solid var(--border-0)', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>Aucun indicateur trouvé.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" style={{ gap: 12 }}>
                {filteredTypes.map((t, i) => (
                  <TypeTile
                    key={t.id} type={t}
                    color={TYPE_COLORS[i % TYPE_COLORS.length]}
                    lastMesure={mesures.find(m => m.type_mesure_id === t.id || m.nom_type === t.nom)}
                    onClick={() => selectType(t)}
                    onInfo={e => { e.stopPropagation(); setInfoType(t) }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent measures */}
          {!loading && mesures.length > 0 && (
            <div className="animate-fade-up delay-200">
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)' }}>
                  Mesures récentes
                </span>
                <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{mesures.length} au total</span>
              </div>
              <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-0)', borderRadius: 20, overflow: 'hidden' }}>
                {mesures.slice(0, 8).map((m, idx) => (
                  <MesureListItem key={m.id} mesure={m}
                    isLast={idx === Math.min(mesures.length, 8) - 1}
                    color={TYPE_COLORS[types.findIndex(t => t.id === m.type_mesure_id) % TYPE_COLORS.length] ?? 'var(--accent)'}
                    onEdit={() => openEdit(m)}
                    onDelete={() => setDeletingMesure(m)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <MesureModal
          types={types} form={form} setForm={setForm}
          typeSelectionne={typeSelectionne} isEditing={!!editingMesure}
          onSubmit={editingMesure ? onSubmitEdit : onSubmitCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {deletingMesure && (
        <DeleteMesureDialog mesure={deletingMesure} onConfirm={onConfirmDelete} onCancel={() => setDeletingMesure(null)} />
      )}

      {infoType && (
        <MesureInfoPopover
          type={infoType}
          derniereValeur={mesures.find(m => m.type_mesure_id === infoType.id || m.nom_type === infoType.nom)?.valeur ?? null}
          onClose={() => setInfoType(null)}
        />
      )}
    </div>
  )
}

/* ═══════ TYPE TILE — Apple Health-style metric card ═══════ */
function TypeTile({ type, color, lastMesure, onClick, onInfo }) {
  const [hovered, setHovered] = useState(false)
  const icon     = TYPE_ICONS[type.nom]
  const isAnorm  = lastMesure?.statut === 'anormal'
  const isNorm   = lastMesure?.statut === 'normal'
  const statusC  = isAnorm ? 'var(--vital-red)' : isNorm ? 'var(--vital-green)' : 'var(--ink-4)'

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', padding: '18px 20px', borderRadius: 20, cursor: 'pointer',
        background: 'var(--glass-card)',
        backdropFilter: 'blur(20px) saturate(1.7)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.7)',
        border: `1px solid ${hovered ? color + '30' : 'var(--glass-border)'}`,
        transition: 'all 0.22s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered
          ? `0 8px 28px rgba(0,0,0,0.35), 0 0 0 1px ${color}22, inset 0 1px 0 var(--glass-highlight)`
          : 'inset 0 1px 0 var(--glass-highlight)',
        overflow: 'hidden',
      }}
    >
      {/* Top color accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 20, right: 20, height: 2,
        background: color, borderRadius: '0 0 2px 2px',
        opacity: hovered ? 1 : 0.45, transition: 'opacity 0.22s ease',
      }} />

      {/* Name row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          {icon ? (
            <img src={icon} alt="" style={{ width: 16, height: 16, opacity: 0.65, flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
              background: `${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 800, color,
            }}>
              {type.nom.charAt(0)}
            </div>
          )}
          <span style={{
            fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', letterSpacing: '-0.1px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {type.nom}
          </span>
        </div>
        <div style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          background: statusC,
          boxShadow: (isAnorm || isNorm) ? `0 0 5px ${statusC}` : 'none',
        }} />
      </div>

      {/* Big value */}
      <div style={{ marginBottom: 6 }}>
        {lastMesure ? (
          <>
            <span style={{
              fontSize: 26, fontWeight: 800, color: 'var(--ink-1)',
              letterSpacing: '-1.5px', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>
              {lastMesure.valeur}
            </span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 4, fontWeight: 500 }}>
              {type.unite}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 20, color: 'var(--ink-4)', letterSpacing: '-0.5px' }}>—</span>
        )}
      </div>

      {/* Date */}
      <p style={{ fontSize: 10, color: 'var(--ink-4)', margin: 0 }}>
        {lastMesure
          ? formatDistanceToNow(new Date(lastMesure.date_mesure), { locale: fr, addSuffix: true })
          : 'Aucune mesure'}
      </p>

      {/* Info hover button */}
      {hovered && (
        <button onClick={onInfo} style={{
          position: 'absolute', bottom: 12, right: 12,
          width: 22, height: 22, borderRadius: 7,
          background: `${color}18`, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          <Info size={11} />
        </button>
      )}
    </div>
  )
}

/* ═══════ MESURE LIST ITEM ═══════ */
function MesureListItem({ mesure, isLast, color, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const isAbn = mesure.statut === 'anormal'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
      borderBottom: isLast ? 'none' : '1px solid var(--border-0)',
      background: hovered ? 'var(--surface-2)' : 'transparent',
      transition: 'background 0.15s ease',
    }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', margin: 0, letterSpacing: '-0.2px' }}>
          {mesure.nom_type ?? mesure.type_mesure}
        </p>
        <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0 }}>
          {format(new Date(mesure.date_mesure), 'd MMM yyyy · HH:mm', { locale: fr })}
          {mesure.contexte && ` · ${mesure.contexte.replace(/_/g, ' ')}`}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 15, fontWeight: 700, letterSpacing: '-0.5px',
          fontVariantNumeric: 'tabular-nums',
          color: isAbn ? 'var(--vital-red)' : 'var(--ink-1)',
        }}>
          {mesure.valeur}
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{mesure.unite}</span>
        {isAbn && (
          <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: 'rgba(255,75,96,0.12)', color: 'var(--vital-red)' }}>
            Anormal
          </span>
        )}
        {hovered && (
          <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
            <ActionIcon icon={<Pencil size={12} />} title="Modifier"   onClick={onEdit}   color="var(--accent)" />
            <ActionIcon icon={<Trash2 size={12} />} title="Supprimer"  onClick={onDelete} color="var(--vital-red)" />
          </div>
        )}
      </div>
    </div>
  )
}

function ActionIcon({ icon, title, onClick, color }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={e => { e.stopPropagation(); onClick() }} title={title}
      style={{
        width: 24, height: 24, borderRadius: 8, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hov ? `${color}18` : 'transparent',
        color: hov ? color : 'var(--ink-3)', transition: 'all 0.15s ease',
      }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      {icon}
    </button>
  )
}

/* ═══════ TYPE DETAIL VIEW ═══════ */
function TypeDetailView({ type, historique, loading, colorIndex, prediction, onEdit, onDelete }) {
  const color   = TYPE_COLORS[colorIndex % TYPE_COLORS.length] ?? 'var(--accent)'
  const latest  = historique.length > 0
    ? [...historique].sort((a, b) => new Date(b.date_mesure) - new Date(a.date_mesure))[0]
    : null
  const icon    = TYPE_ICONS[type.nom]
  const gradId  = `grad-${colorIndex}`
  const lastPred = prediction?.predictions?.at(-1)

  const buildChartData = () => {
    const hist = historique.slice()
      .sort((a, b) => new Date(a.date_mesure) - new Date(b.date_mesure))
      .map(m => ({
        date: format(new Date(m.date_mesure), 'd MMM', { locale: fr }),
        valeur: m.valeur, pred: undefined,
      }))
    if (!prediction?.predictions?.length) return hist
    if (hist.length > 0) hist[hist.length - 1].pred = hist[hist.length - 1].valeur
    for (const p of prediction.predictions) {
      hist.push({
        date:   format(new Date(p.date), 'd MMM', { locale: fr }),
        valeur: undefined, pred: p.valeur_predite,
        confH: p.valeur_predite + p.intervalle_confiance,
        confL: p.valeur_predite - p.intervalle_confiance,
      })
    }
    return hist
  }
  const chartData = buildChartData()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Current value hero */}
      <div style={{
        position: 'relative', padding: '28px 32px', borderRadius: 24, overflow: 'hidden',
        background: 'var(--surface-1)', border: '1px solid var(--border-0)',
      }} className="animate-fade-up">
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 240, height: 240,
          background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`, pointerEvents: 'none',
        }} />
        {icon && (
          <img src={icon} alt="" aria-hidden style={{
            position: 'absolute', top: 20, right: 28, width: 70, height: 70, opacity: 0.18,
          }} />
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: latest?.statut === 'anormal' ? 'var(--vital-red)' : 'var(--vital-green)',
              boxShadow: `0 0 7px ${latest?.statut === 'anormal' ? 'var(--vital-red)' : 'var(--vital-green)'}`,
            }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink-3)' }}>
              {latest?.statut === 'anormal' ? 'Anormal' : latest ? 'Normal' : 'Pas de données'}
            </span>
          </div>

          {latest ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{
                  fontSize: '3.4rem', fontWeight: 800, color,
                  letterSpacing: '-3px', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                  animation: 'number-rise 0.5s cubic-bezier(0.22,1,0.36,1) both',
                }}>
                  {latest.valeur}
                </span>
                <span style={{ fontSize: 18, color: 'var(--ink-3)', fontWeight: 500 }}>{type.unite}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '8px 0 0', fontWeight: 500, letterSpacing: '-0.2px' }}>
                {type.nom}
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--ink-4)', letterSpacing: '-2px' }}>—</span>
              <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: '8px 0 0' }}>{type.nom}</p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {latest && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-3)' }}>
                <Calendar size={11} />
                {format(new Date(latest.date_mesure), "d MMMM 'à' HH:mm", { locale: fr })}
              </span>
            )}
            {type.seuil_min_normal && (
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                Zone normale : <strong style={{ color: 'var(--vital-green)' }}>
                  {type.seuil_min_normal}–{type.seuil_max_normal} {type.unite}
                </strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Prediction badges */}
      {prediction && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} className="animate-fade-up delay-50">
          <span style={{
            padding: '7px 14px', borderRadius: 12, fontSize: 12, fontWeight: 600,
            background: 'rgba(0,221,160,0.08)', color: 'var(--accent)', border: '1px solid var(--border-2)',
          }}>
            Prédiction J+7 : <strong>{lastPred?.valeur_predite} {type.unite}</strong> · fiabilité {prediction.fiabilite}
          </span>
          {prediction.alerte_predictive && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 12, fontSize: 12, fontWeight: 600,
              background: prediction.alerte_predictive === 'danger' ? 'rgba(255,75,96,0.10)' : 'rgba(255,140,66,0.10)',
              color:      prediction.alerte_predictive === 'danger' ? 'var(--vital-red)' : 'var(--vital-orange)',
              border: `1px solid ${prediction.alerte_predictive === 'danger' ? 'rgba(255,75,96,0.20)' : 'rgba(255,140,66,0.20)'}`,
            }}>
              <AlertTriangle size={12} /> Risque de dépassement prévu
            </span>
          )}
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 12, fontSize: 12, fontWeight: 600,
            background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--border-0)',
          }}>
            {prediction.tendance === 'hausse' ? <TrendingUp size={12} /> : prediction.tendance === 'baisse' ? <TrendingDown size={12} /> : <Minus size={12} />}
            Tendance {prediction.tendance} · R²={prediction.r_squared}
          </span>
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="skeleton" style={{ height: 280, borderRadius: 20 }} />
      ) : chartData.length > 0 ? (
        <div style={{
          padding: '22px 22px 14px', borderRadius: 20,
          background: 'var(--surface-1)', border: '1px solid var(--border-0)',
        }} className="animate-fade-up delay-100">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.3px', margin: 0 }}>
              Évolution{prediction ? ' & Prédiction' : ''}
            </h3>
            {prediction && (
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--ink-3)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 18, height: 2, background: color, borderRadius: 1, display: 'inline-block' }} />
                  Réel
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 18, borderTop: `2px dashed ${color}`, opacity: 0.5, display: 'inline-block' }} />
                  Prédit
                </span>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={color} stopOpacity={0.30} />
                  <stop offset="90%"  stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="var(--border-0)" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--ink-3)', fontFamily: 'Poppins' }} />
              <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--ink-3)', fontFamily: 'Poppins' }} />
              <Tooltip
                cursor={{ stroke: `${color}22`, strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const realVal = payload.find(p => p.dataKey === 'valeur')?.value
                  const predVal = payload.find(p => p.dataKey === 'pred')?.value
                  return (
                    <div style={{
                      background: 'var(--glass-card)',
                      backdropFilter: 'blur(20px) saturate(1.8)',
                      WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 12, padding: '10px 14px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
                      minWidth: 120,
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink-3)', margin: '0 0 6px' }}>{label}</p>
                      {realVal != null && (
                        <p style={{ fontSize: 16, fontWeight: 800, color, letterSpacing: '-0.5px', margin: '0 0 2px', fontVariantNumeric: 'tabular-nums' }}>
                          {realVal} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-3)' }}>{type.unite}</span>
                        </p>
                      )}
                      {predVal != null && (
                        <p style={{ fontSize: 13, fontWeight: 600, color, opacity: 0.65, margin: 0, letterSpacing: '-0.3px', fontVariantNumeric: 'tabular-nums' }}>
                          Prédit : {predVal} {type.unite}
                        </p>
                      )}
                    </div>
                  )
                }}
              />
              {type.seuil_min_normal && <ReferenceLine y={type.seuil_min_normal} stroke="#FF8C42" strokeDasharray="5 4" strokeWidth={1} label={{ value: 'min', fill: '#FF8C42', fontSize: 9, fontFamily: 'Poppins' }} />}
              {type.seuil_max_normal && <ReferenceLine y={type.seuil_max_normal} stroke="#FF8C42" strokeDasharray="5 4" strokeWidth={1} label={{ value: 'max', fill: '#FF8C42', fontSize: 9, fontFamily: 'Poppins' }} />}
              <Area type="monotone" dataKey="valeur" stroke={color} strokeWidth={2.4}
                fill={`url(#${gradId})`} dot={false}
                activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: `${color}35` }} connectNulls={false} />
              {prediction && (
                <Line type="monotone" dataKey="pred" stroke={color} strokeWidth={1.5}
                  strokeDasharray="5 4" strokeOpacity={0.55} dot={false}
                  activeDot={{ r: 4, fill: color, strokeWidth: 2, stroke: `${color}35` }} connectNulls />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ padding: '48px', borderRadius: 20, background: 'var(--surface-1)', border: '1px solid var(--border-0)', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>Aucune donnée pour ce type de mesure.</p>
        </div>
      )}

      {/* History */}
      {historique.length > 0 && (
        <div style={{
          borderRadius: 20, overflow: 'hidden',
          background: 'var(--surface-1)', border: '1px solid var(--border-0)',
        }} className="animate-fade-up delay-150">
          <div style={{
            padding: '15px 20px', borderBottom: '1px solid var(--border-0)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.3px', margin: 0 }}>
              Historique
            </h3>
            <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{historique.length} mesures</span>
          </div>
          {[...historique].sort((a, b) => new Date(b.date_mesure) - new Date(a.date_mesure)).map((m, idx, arr) => (
            <HistoriqueItem key={m.id} mesure={m} isLast={idx === arr.length - 1}
              type={type} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════ HISTORIQUE ITEM ═══════ */
function HistoriqueItem({ mesure, isLast, type, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px',
      borderBottom: isLast ? 'none' : '1px solid var(--border-0)',
      background: hovered ? 'var(--surface-2)' : 'transparent',
      transition: 'background 0.15s ease',
    }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      <div>
        <p style={{ fontSize: 13, color: 'var(--ink-1)', margin: 0, fontWeight: 500, letterSpacing: '-0.2px' }}>
          {format(new Date(mesure.date_mesure), "d MMMM yyyy · HH:mm", { locale: fr })}
        </p>
        {mesure.contexte && (
          <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '2px 0 0' }}>
            {mesure.contexte.replace(/_/g, ' ')}
          </p>
        )}
        {mesure.note && (
          <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '2px 0 0', fontStyle: 'italic' }}>
            {mesure.note}
          </p>
        )}
        {mesure.annotation_medecin && (
          <div style={{
            display: 'flex', gap: 8, marginTop: 6, padding: '6px 10px',
            borderRadius: 10, background: 'rgba(0,221,160,0.06)', border: '1px solid var(--border-2)',
          }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', margin: 0 }}>
                {mesure.annotation_medecin.commentaire}
              </p>
              <p style={{ fontSize: 10, color: 'var(--ink-3)', margin: 0 }}>
                {mesure.annotation_medecin.medecin}
              </p>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
          {mesure.valeur}
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{type?.unite}</span>
        {mesure.statut === 'anormal' && (
          <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: 'rgba(255,75,96,0.12)', color: 'var(--vital-red)' }}>
            Anormal
          </span>
        )}
        {hovered && (
          <div style={{ display: 'flex', gap: 4 }}>
            <ActionIcon icon={<Pencil size={12} />} title="Modifier"  onClick={() => onEdit(mesure)}   color="var(--accent)" />
            <ActionIcon icon={<Trash2 size={12} />} title="Supprimer" onClick={() => onDelete(mesure)} color="var(--vital-red)" />
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════ MODAL MESURE ═══════ */
function MesureModal({ types, form, setForm, typeSelectionne, isEditing, onSubmit, onClose }) {
  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 14,
    background: 'var(--surface-2)', border: '1px solid var(--border-0)',
    color: 'var(--ink-1)', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s ease',
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: 'clamp(20px, 4vh, 60px) 20px 20px',
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      overflowY: 'auto',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 520, flexShrink: 0,
        background: 'var(--glass-card)',
        backdropFilter: 'blur(28px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
        borderRadius: 24,
        border: '1px solid var(--glass-border)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.40)',
        animation: 'scale-in 0.26s cubic-bezier(0.34,1.2,0.64,1) both',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid var(--glass-border)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.4px', margin: 0 }}>
            {isEditing ? 'Modifier la mesure' : 'Nouvelle mesure'}
          </h2>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 10, background: 'var(--surface-3)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)',
          }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Type selector */}
          {!isEditing && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink-3)', display: 'block', marginBottom: 10 }}>
                Type de mesure
              </label>
              <div className="grid grid-cols-2" style={{ gap: 8 }}>
                {types.filter(t => t.nom !== 'IMC').map((t, i) => {
                  const col      = TYPE_COLORS[i % TYPE_COLORS.length]
                  const isActive = form.type_mesure_id === String(t.id)
                  const ico      = TYPE_ICONS[t.nom]
                  return (
                    <button key={t.id} type="button"
                      onClick={() => setForm({ ...form, type_mesure_id: String(t.id) })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px',
                        borderRadius: 14, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: isActive ? `${col}14` : 'var(--surface-2)',
                        border: `1.5px solid ${isActive ? col : 'transparent'}`,
                        color: isActive ? col : 'var(--ink-2)',
                        transition: 'all 0.15s ease', textAlign: 'left',
                      }}
                    >
                      {ico ? (
                        <img src={ico} alt="" style={{ width: 15, height: 15, opacity: isActive ? 1 : 0.45, flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                          background: isActive ? col : 'var(--surface-4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 7, fontWeight: 800, color: isActive ? '#fff' : 'var(--ink-3)',
                        }}>
                          {t.nom.charAt(0)}
                        </div>
                      )}
                      {t.nom}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Values */}
          <div className="grid grid-cols-2" style={{ gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink-3)', display: 'block', marginBottom: 8 }}>
                {typeSelectionne ? `${COMPOSANTE_LABEL[typeSelectionne.nom] ? 'Systolique' : 'Valeur'} (${typeSelectionne.unite})` : 'Valeur'}
              </label>
              <input type="number" step="0.01" value={form.valeur} required placeholder="0.0"
                onChange={e => setForm({ ...form, valeur: e.target.value })}
                style={inputStyle}
                onFocus={e  => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,221,160,0.10)' }}
                onBlur={e   => { e.target.style.borderColor = 'var(--border-0)'; e.target.style.boxShadow = 'none' }} />
            </div>
            {!isEditing && typeSelectionne && COMPOSANTE_LABEL[typeSelectionne.nom] && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink-3)', display: 'block', marginBottom: 8 }}>
                  {COMPOSANTE_LABEL[typeSelectionne.nom]} ({typeSelectionne.unite})
                </label>
                <input type="number" step="0.01" value={form.valeur2} placeholder="0.0"
                  onChange={e => setForm({ ...form, valeur2: e.target.value })}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--border-2)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border-0)'} />
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink-3)', display: 'block', marginBottom: 8 }}>
              Date et heure
            </label>
            <input type="datetime-local" value={form.date_mesure} required
              onChange={e => setForm({ ...form, date_mesure: e.target.value })}
              style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>

          {/* Contexte */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink-3)', display: 'block', marginBottom: 10 }}>
              Contexte
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CONTEXTES.map(({ value, label }) => {
                const isActive = form.contexte === value
                return (
                  <button key={value} type="button"
                    onClick={() => setForm({ ...form, contexte: isActive ? '' : value })}
                    style={{
                      padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: isActive ? 'var(--accent-dim)' : 'var(--surface-2)',
                      border: `1px solid ${isActive ? 'var(--border-2)' : 'transparent'}`,
                      color: isActive ? 'var(--accent)' : 'var(--ink-2)',
                      transition: 'all 0.15s ease',
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
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--ink-3)', display: 'block', marginBottom: 8 }}>
              Note <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10, opacity: 0.6 }}>(optionnel)</span>
            </label>
            <textarea value={form.note} placeholder="Observations…" rows={2}
              onChange={e => setForm({ ...form, note: e.target.value })}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '13px', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--border-0)',
            }}>
              Annuler
            </button>
            <button type="submit" style={{
              flex: 1, padding: '13px', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              background: 'var(--accent)', color: '#0A1512', border: 'none',
              boxShadow: '0 4px 18px rgba(0,221,160,0.28)', transition: 'opacity 0.18s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {isEditing ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

/* ═══════ DELETE DIALOG ═══════ */
function DeleteMesureDialog({ mesure, onConfirm, onCancel }) {
  const dateStr = format(new Date(mesure.date_mesure), "d MMMM yyyy 'à' HH:mm", { locale: fr })
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    }} onClick={onCancel}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--glass-card)',
        backdropFilter: 'blur(28px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
        borderRadius: 24, padding: '28px 24px',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.40)',
        animation: 'scale-in 0.24s cubic-bezier(0.34,1.2,0.64,1) both',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,75,96,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Trash2 size={20} color="var(--vital-red)" />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 8, letterSpacing: '-0.4px' }}>
          Supprimer cette mesure ?
        </h3>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.65, marginBottom: 24 }}>
          La mesure du <strong>{dateStr}</strong> sera définitivement supprimée, ainsi que les alertes associées.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--border-0)',
          }}>
            Annuler
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: 'var(--vital-red)', color: '#fff', border: 'none',
            boxShadow: '0 4px 14px rgba(255,75,96,0.28)',
          }}>
            Supprimer
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
