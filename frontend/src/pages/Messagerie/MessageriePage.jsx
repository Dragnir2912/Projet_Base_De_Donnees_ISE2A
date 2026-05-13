import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Send, MessageSquare, User, Search, PlusCircle, X,
  Check, CheckCheck,
} from 'lucide-react'
import Illustration from '../../components/ui/Illustration'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { getConversations, getMessages, envoyerMessage } from '../../services/messagesService'
import { getPatients } from '../../services/medecinService'
import useAuthStore from '../../store/authStore'

const CONV_COLORS = ['#0A84FF','#BF5AF2','#34C759','#FF9500','#FF2D55','#5AC8FA','#FFD60A','#FF375F']

const getInitials = (name) =>
  name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'
const getColor = (idx) => CONV_COLORS[idx % CONV_COLORS.length]

function formatMsgDate(date) {
  const d = new Date(date)
  if (isToday(d))     return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Hier'
  return format(d, 'd MMM', { locale: fr })
}

function dayLabel(date) {
  const d = new Date(date)
  if (isToday(d))     return "Aujourd'hui"
  if (isYesterday(d)) return 'Hier'
  return format(d, 'EEEE d MMMM yyyy', { locale: fr })
}

export default function MessageriePage() {
  const [searchParams]    = useSearchParams()
  const withUserId        = parseInt(searchParams.get('with') || '0') || null

  const [conversations,  setConversations]  = useState([])
  const [selectedConv,   setSelectedConv]   = useState(null)
  const [newConvTarget,  setNewConvTarget]  = useState(null)   // pour médecin : nouvelle conv
  const [messages,       setMessages]       = useState([])
  const [newMessage,     setNewMessage]     = useState('')
  const [loading,        setLoading]        = useState(true)
  const [sending,        setSending]        = useState(false)
  const [search,         setSearch]         = useState('')
  const [showNewConv,    setShowNewConv]    = useState(false)  // modal médecin
  const [docPatients,    setDocPatients]    = useState([])     // patients du médecin
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const { user } = useAuthStore()
  const isMedecin = user?.role === 'medecin'

  const loadConversations = useCallback(async () => {
    const res = await getConversations().catch(() => ({ data: { data: [] } }))
    const convs = res.data.data ?? []
    setConversations(convs)
    setLoading(false)
    return convs
  }, [])

  // Chargement initial
  useEffect(() => {
    loadConversations().then(convs => {
      // Navigation directe via ?with=<id>
      if (withUserId) {
        const found = convs.find(c => c.interlocuteur_id === withUserId)
        if (found) {
          openConversation(found)
        } else if (isMedecin) {
          // Pas encore de conversation → mode nouvelle conv
          setNewConvTarget({ id: withUserId, nom: '…', role: 'patient' })
          // Essayer de récupérer le nom depuis la liste des patients
          getPatients().then(r => {
            const p = (r.data.data ?? []).find(pt => pt.id === withUserId)
            if (p) setNewConvTarget({ id: withUserId, nom: `${p.prenom} ${p.nom}`, role: 'patient' })
          }).catch(() => {})
        }
      }
    })
  }, [withUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openConversation = async (conv) => {
    setSelectedConv(conv)
    setNewConvTarget(null)
    const res = await getMessages(conv.conversation_id)
    setMessages(res.data.data ?? [])
    setConversations(prev => prev.map(c =>
      c.conversation_id === conv.conversation_id ? { ...c, non_lus: 0 } : c
    ))
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const onSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    if (!selectedConv && !newConvTarget) return
    setSending(true)
    try {
      const payload = {
        destinataire_id: selectedConv ? selectedConv.interlocuteur_id : newConvTarget.id,
        contenu:         newMessage.trim(),
        ...(selectedConv ? { conversation_id: selectedConv.conversation_id } : {}),
      }
      const res = await envoyerMessage(payload)
      const msg = res.data.data
      setMessages(prev => [...prev, msg])
      setNewMessage('')
      // Recharger les conversations (la nouvelle apparaîtra si c'était une 1ère)
      const convs = await loadConversations()
      if (newConvTarget) {
        const newConv = convs.find(c => c.interlocuteur_id === newConvTarget.id)
        if (newConv) { setSelectedConv(newConv); setNewConvTarget(null) }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Impossible d'envoyer le message.")
    } finally {
      setSending(false)
    }
  }

  // Médecin : patients sans conversation active
  const openNewConvModal = async () => {
    const [pRes, cRes] = await Promise.all([
      getPatients().catch(() => ({ data: { data: [] } })),
      getConversations().catch(() => ({ data: { data: [] } })),
    ])
    const pats  = pRes.data.data ?? []
    const convIds = new Set((cRes.data.data ?? []).map(c => c.interlocuteur_id))
    setDocPatients(pats.filter(p => !convIds.has(p.id)))
    setShowNewConv(true)
  }

  // Filtrage recherche
  const filteredConvs = conversations.filter(c =>
    c.interlocuteur_nom.toLowerCase().includes(search.toLowerCase())
  )

  // Grouper les messages par jour
  const groupedMessages = messages.reduce((groups, msg) => {
    const day = format(new Date(msg.envoye_le), 'yyyy-MM-dd')
    if (!groups[day]) groups[day] = []
    groups[day].push(msg)
    return groups
  }, {})

  const activeNom = selectedConv?.interlocuteur_nom
    ?? (newConvTarget ? newConvTarget.nom : null)
  const activeRole = selectedConv?.interlocuteur_role
    ?? (newConvTarget ? newConvTarget.role : null)
  const activeColor = selectedConv
    ? getColor(conversations.indexOf(selectedConv))
    : '#0A84FF'
  const hasActive = !!(selectedConv || newConvTarget)

  return (
    <div className="flex h-[calc(100vh-130px)] min-h-[500px] rounded-2xl overflow-hidden"
      style={{ boxShadow: 'var(--shadow-card)' }}>

      {/* ══ Sidebar conversations ══ */}
      <div className="w-80 flex flex-col flex-shrink-0"
        style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-subtle)' }}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Messages</h2>
            {isMedecin && (
              <button
                onClick={openNewConvModal}
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
                style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--health-blue)', border: 'none', cursor: 'pointer' }}
                title="Nouvelle conversation">
                <PlusCircle size={16} />
              </button>
            )}
          </div>
          {/* Recherche */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'var(--bg-secondary)' }}>
            <Search size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)', border: 'none', fontFamily: 'DM Sans' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <Illustration name="empty-messages" width={140} height={140} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                {search ? 'Aucun résultat' : 'Aucune conversation'}
              </p>
            </div>
          ) : (
            filteredConvs.map((conv, idx) => (
              <ConvItem
                key={String(conv.conversation_id)}
                conv={conv}
                isActive={selectedConv?.conversation_id === conv.conversation_id}
                color={getColor(idx)}
                onClick={() => openConversation(conv)}
                userId={user?.id}
              />
            ))
          )}
        </div>
      </div>

      {/* ══ Zone chat ══ */}
      {hasActive ? (
        <div className="flex flex-col flex-1 min-w-0" style={{ background: 'var(--bg-primary)' }}>
          {/* Header conv */}
          <div className="flex items-center gap-3 px-6 py-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: activeColor }}>
              {getInitials(activeNom)}
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {activeNom}
              </p>
              <p className="text-xs capitalize" style={{ color: 'var(--text-tertiary)' }}>
                {activeRole === 'medecin' ? '🩺 Médecin' : '👤 Patient'}
                {newConvTarget && <span className="ml-2 italic">— Nouvelle conversation</span>}
              </p>
            </div>
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--health-green)' }} />
          </div>

          {/* Messages groupés par jour */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {newConvTarget && messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white mx-auto mb-3"
                  style={{ background: activeColor }}>
                  {getInitials(newConvTarget.nom)}
                </div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {newConvTarget.nom}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Envoyez votre premier message pour démarrer la conversation.
                </p>
              </div>
            )}
            {Object.entries(groupedMessages).map(([day, msgs]) => (
              <div key={day}>
                {/* Séparateur de jour */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                  <span className="text-[11px] font-semibold px-2"
                    style={{ color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                    {dayLabel(day)}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                </div>
                <div className="space-y-1.5">
                  {msgs.map((msg, i) => {
                    const isMine = msg.expediteur_id === user?.id
                    const isLast = i === msgs.length - 1 || msgs[i+1]?.expediteur_id !== msg.expediteur_id
                    return (
                      <MsgBubble
                        key={msg.id}
                        msg={msg}
                        isMine={isMine}
                        showAvatar={!isMine && isLast}
                        color={activeColor}
                        initials={getInitials(activeNom)}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={onSend} className="px-4 py-3.5"
            style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2 px-4 rounded-2xl transition-all"
              style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--border-subtle)' }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--health-blue)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
              <input
                ref={inputRef}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSend(e))}
                placeholder="Écrire un message…"
                className="flex-1 py-3 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-primary)', border: 'none', fontFamily: 'DM Sans' }}
              />
              <button type="submit" disabled={!newMessage.trim() || sending}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all"
                style={{
                  background: newMessage.trim() && !sending ? 'var(--health-blue)' : 'var(--bg-tertiary)',
                  border: 'none', cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                }}>
                <Send size={15} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-app)' }}>
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
            style={{ background: 'var(--bg-secondary)' }}>
            <MessageSquare size={28} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Sélectionnez une conversation</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {isMedecin ? 'Ou cliquez sur + pour démarrer une nouvelle conversation.' : 'Choisissez une conversation dans la liste.'}
            </p>
          </div>
        </div>
      )}

      {/* ══ Modal Nouvelle conversation (médecin) ══ */}
      {showNewConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowNewConv(false)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-modal)', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nouvelle conversation</p>
              <button onClick={() => setShowNewConv(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {docPatients.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Tous vos patients ont déjà une conversation active.
                  </p>
                </div>
              ) : docPatients.map((p, i) => (
                <button key={p.id}
                  onClick={() => {
                    setNewConvTarget({ id: p.id, nom: `${p.prenom} ${p.nom}`, role: 'patient' })
                    setSelectedConv(null)
                    setMessages([])
                    setShowNewConv(false)
                    setTimeout(() => inputRef.current?.focus(), 100)
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: getColor(i) }}>
                    {getInitials(`${p.prenom} ${p.nom}`)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.prenom} {p.nom}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{p.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── ConvItem ──────────────────────────────────────────── */
function ConvItem({ conv, isActive, color, onClick, userId }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
      style={{
        background: isActive ? 'rgba(10,132,255,0.08)' : 'transparent',
        border: 'none', cursor: 'pointer',
        borderLeft: isActive ? '3px solid var(--health-blue)' : '3px solid transparent',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
        style={{ background: color }}>
        {getInitials(conv.interlocuteur_nom)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-semibold truncate"
            style={{ color: 'var(--text-primary)', fontWeight: conv.non_lus > 0 ? 700 : 600 }}>
            {conv.interlocuteur_nom}
          </p>
          {conv.dernier_message_le && (
            <span className="text-[10px] flex-shrink-0" style={{ color: conv.non_lus > 0 ? 'var(--health-blue)' : 'var(--text-tertiary)' }}>
              {formatMsgDate(conv.dernier_message_le)}
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5 truncate"
          style={{ color: conv.non_lus > 0 ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                   fontWeight: conv.non_lus > 0 ? 600 : 400 }}>
          {conv.dernier_message ?? 'Aucun message'}
        </p>
      </div>
      {conv.non_lus > 0 && (
        <span className="w-5 h-5 rounded-full text-white flex items-center justify-center flex-shrink-0 badge-pulse"
          style={{ background: 'var(--health-blue)', fontSize: 10, fontWeight: 700 }}>
          {conv.non_lus > 9 ? '9+' : conv.non_lus}
        </span>
      )}
    </button>
  )
}

/* ── MsgBubble ─────────────────────────────────────────── */
function MsgBubble({ msg, isMine, showAvatar, color, initials }) {
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
      {/* Avatar interlocuteur */}
      {!isMine && (
        <div className="w-7 h-7 flex-shrink-0">
          {showAvatar && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: color }}>
              {initials}
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[72%] group`}>
        <div className="px-4 py-2.5 text-sm leading-relaxed"
          style={{
            background:   isMine ? 'var(--health-blue)' : 'var(--bg-secondary)',
            color:        isMine ? 'white' : 'var(--text-primary)',
            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            boxShadow:    isMine ? '0 2px 8px rgba(10,132,255,0.2)' : 'none',
          }}>
          <p style={{ wordBreak: 'break-word' }}>{msg.contenu}</p>
        </div>
        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'justify-end' : ''}`}>
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            {format(new Date(msg.envoye_le), 'HH:mm')}
          </span>
          {isMine && (
            <span style={{ color: msg.lu ? 'var(--health-blue)' : 'var(--text-tertiary)' }}>
              {msg.lu ? <CheckCheck size={11} /> : <Check size={11} />}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
