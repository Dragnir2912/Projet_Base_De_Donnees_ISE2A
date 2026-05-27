import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Send, MessageSquare, User, Search, PlusCircle, X,
  Check, CheckCheck,
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { getConversations, getMessages, envoyerMessage } from '../../services/messagesService'
import { getPatients } from '../../services/medecinService'
import useAuthStore from '../../store/authStore'

const CONV_COLORS = ['#2E9B83','#1A7C6C','#34C759','#FF9500','#FF5C6A','#40B896','#FFD60A','#FF7B73']

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
  const [newConvTarget,  setNewConvTarget]  = useState(null)
  const [messages,       setMessages]       = useState([])
  const [newMessage,     setNewMessage]     = useState('')
  const [loading,        setLoading]        = useState(true)
  const [sending,        setSending]        = useState(false)
  const [search,         setSearch]         = useState('')
  const [showNewConv,    setShowNewConv]    = useState(false)
  const [docPatients,    setDocPatients]    = useState([])
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

  useEffect(() => {
    loadConversations().then(convs => {
      if (withUserId) {
        const found = convs.find(c => c.interlocuteur_id === withUserId)
        if (found) {
          openConversation(found)
        } else if (isMedecin) {
          setNewConvTarget({ id: withUserId, nom: '…', role: 'patient' })
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

  const filteredConvs = conversations.filter(c =>
    c.interlocuteur_nom.toLowerCase().includes(search.toLowerCase())
  )

  const groupedMessages = messages.reduce((groups, msg) => {
    const day = format(new Date(msg.envoye_le), 'yyyy-MM-dd')
    if (!groups[day]) groups[day] = []
    groups[day].push(msg)
    return groups
  }, {})

  const activeNom = selectedConv?.interlocuteur_nom ?? (newConvTarget ? newConvTarget.nom : null)
  const activeRole = selectedConv?.interlocuteur_role ?? (newConvTarget ? newConvTarget.role : null)
  const activeColor = selectedConv ? getColor(conversations.indexOf(selectedConv)) : '#2E9B83'
  const hasActive = !!(selectedConv || newConvTarget)

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 130px)', minHeight: 500,
      borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 24px 60px rgba(0,0,0,0.30)',
      border: '1px solid var(--border-0)',
    }}>

      {/* ══ Sidebar conversations ══ */}
      <div style={{
        width: 300, display: 'flex', flexDirection: 'column', flexShrink: 0,
        background: 'var(--surface-1)', borderRight: '1px solid var(--border-0)',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink-1)', margin: 0, letterSpacing: '-0.3px' }}>Messages</h2>
            {isMedecin && (
              <button onClick={openNewConvModal} title="Nouvelle conversation"
                style={{
                  width: 30, height: 30, borderRadius: 9,
                  background: 'var(--accent-dim)', border: '1px solid var(--border-2)',
                  color: 'var(--accent)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,221,160,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
              >
                <PlusCircle size={15} />
              </button>
            )}
          </div>

          {/* Recherche */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 12,
            background: 'var(--surface-2)', border: '1px solid var(--border-0)',
            transition: 'border-color 0.15s ease',
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-0)'}
          >
            <Search size={13} color="var(--ink-3)" style={{ flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              style={{
                flex: 1, background: 'none', outline: 'none', fontSize: 13,
                color: 'var(--ink-1)', border: 'none', fontFamily: 'Poppins, system-ui',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, display: 'flex' }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 62, borderRadius: 12 }} />)}
            </div>
          ) : filteredConvs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 24, textAlign: 'center' }}>
              <MessageSquare size={28} color="var(--ink-4)" />
              <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, background: 'var(--surface-0)' }}>
          {/* Header conv */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px',
            borderBottom: '1px solid var(--border-0)',
            background: 'var(--surface-1)',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
              background: activeColor,
            }}>
              {getInitials(activeNom)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-1)', margin: 0, letterSpacing: '-0.2px' }}>
                {activeNom}
              </p>
              <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0, textTransform: 'capitalize' }}>
                {activeRole === 'medecin' ? '🩺 Médecin' : '👤 Patient'}
                {newConvTarget && <span style={{ marginLeft: 8, fontStyle: 'italic' }}>— Nouvelle conversation</span>}
              </p>
            </div>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--vital-green)', boxShadow: '0 0 6px var(--vital-green)' }} />
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {newConvTarget && messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: 'white', margin: '0 auto 12px',
                  background: activeColor,
                }}>
                  {getInitials(newConvTarget.nom)}
                </div>
                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-1)', margin: 0 }}>{newConvTarget.nom}</p>
                <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '6px 0 0', lineHeight: 1.6 }}>
                  Envoyez votre premier message pour démarrer la conversation.
                </p>
              </div>
            )}
            {Object.entries(groupedMessages).map(([day, msgs]) => (
              <div key={day}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-0)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                    {dayLabel(day)}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-0)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {msgs.map((msg, i) => {
                    const isMine = msg.expediteur_id === user?.id
                    const isLast = i === msgs.length - 1 || msgs[i+1]?.expediteur_id !== msg.expediteur_id
                    return (
                      <MsgBubble
                        key={msg.id} msg={msg} isMine={isMine}
                        showAvatar={!isMine && isLast}
                        color={activeColor} initials={getInitials(activeNom)}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* ── Composeur premium ── */}
          <form onSubmit={onSend} style={{ padding: '12px 16px', borderTop: '1px solid var(--border-0)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              background: 'var(--glass-card)',
              backdropFilter: 'blur(20px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: 18,
              transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
            }}
              onFocusCapture={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,221,160,0.10)'
              }}
              onBlurCapture={e => {
                e.currentTarget.style.borderColor = 'var(--glass-border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <input
                ref={inputRef}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSend(e))}
                placeholder="Écrire un message…"
                style={{
                  flex: 1, padding: '2px 0', background: 'none', outline: 'none',
                  fontSize: 14, color: 'var(--ink-1)', border: 'none',
                  fontFamily: 'Poppins, system-ui',
                }}
              />
              <button type="submit" disabled={!newMessage.trim() || sending}
                style={{
                  width: 34, height: 34, borderRadius: 12, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: newMessage.trim() && !sending ? 'var(--accent)' : 'var(--surface-3)',
                  color: newMessage.trim() && !sending ? '#0A1512' : 'var(--ink-4)',
                  border: 'none',
                  cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                  transition: 'all 0.18s ease',
                  boxShadow: newMessage.trim() && !sending ? '0 2px 10px rgba(0,221,160,0.28)' : 'none',
                }}
                onMouseEnter={e => { if (newMessage.trim() && !sending) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
              >
                {sending ? (
                  <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid var(--ink-3)', borderTopColor: 'var(--accent)', animation: 'spin 0.75s linear infinite' }} />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--surface-0)' }}>
          <img src="/illustrations/artwork/people-waving.jpg" alt="" aria-hidden
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%', opacity: 0.13 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%, rgba(0,221,160,0.05) 0%, transparent 70%)' }} />
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'var(--surface-2)', border: '1px solid var(--border-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageSquare size={22} color="var(--accent)" />
            </div>
            <div style={{ textAlign: 'center', maxWidth: 260 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
                Vos messages
              </p>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.65, margin: 0 }}>
                {isMedecin
                  ? 'Cliquez sur + pour démarrer une nouvelle conversation avec un patient.'
                  : 'Sélectionnez une conversation dans la liste pour lire vos messages.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal Nouvelle conversation (médecin) ══ */}
      {showNewConv && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        }} onClick={() => setShowNewConv(false)}>
          <div style={{
            width: '100%', maxWidth: 380, borderRadius: 20, overflow: 'hidden',
            background: 'var(--glass-card)',
            backdropFilter: 'blur(28px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.40)',
            maxHeight: '70vh', display: 'flex', flexDirection: 'column',
            animation: 'scale-in 0.22s cubic-bezier(0.34,1.2,0.64,1) both',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid var(--glass-border)',
            }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-1)', margin: 0, letterSpacing: '-0.3px' }}>
                Nouvelle conversation
              </p>
              <button onClick={() => setShowNewConv(false)} style={{
                width: 28, height: 28, borderRadius: 9,
                background: 'var(--surface-2)', border: '1px solid var(--border-0)',
                cursor: 'pointer', color: 'var(--ink-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={13} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {docPatients.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
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
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
                    borderBottom: '1px solid var(--glass-border)', transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,221,160,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
                    background: getColor(i),
                  }}>
                    {getInitials(`${p.prenom} ${p.nom}`)}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', margin: 0 }}>{p.prenom} {p.nom}</p>
                    <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0 }}>{p.email}</p>
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
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        background: isActive ? 'var(--accent-dim)' : hovered ? 'var(--surface-2)' : 'transparent',
        border: 'none', cursor: 'pointer',
        borderLeft: `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: 'white',
        background: color,
      }}>
        {getInitials(conv.interlocuteur_nom)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <p style={{
            fontSize: 13, fontWeight: conv.non_lus > 0 ? 700 : 600,
            color: 'var(--ink-1)', margin: 0, letterSpacing: '-0.2px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {conv.interlocuteur_nom}
          </p>
          {conv.dernier_message_le && (
            <span style={{ fontSize: 10, flexShrink: 0, color: conv.non_lus > 0 ? 'var(--accent)' : 'var(--ink-4)' }}>
              {formatMsgDate(conv.dernier_message_le)}
            </span>
          )}
        </div>
        <p style={{
          fontSize: 12, color: conv.non_lus > 0 ? 'var(--ink-2)' : 'var(--ink-3)',
          fontWeight: conv.non_lus > 0 ? 600 : 400,
          margin: '2px 0 0',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {conv.dernier_message ?? 'Aucun message'}
        </p>
      </div>
      {conv.non_lus > 0 && (
        <span style={{
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--accent)', color: '#0A1512',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: 9, fontWeight: 800,
        }}>
          {conv.non_lus > 9 ? '9+' : conv.non_lus}
        </span>
      )}
    </button>
  )
}

/* ── MsgBubble ─────────────────────────────────────────── */
function MsgBubble({ msg, isMine, showAvatar, color, initials }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: isMine ? 'row-reverse' : 'row' }}>
      <div style={{ width: 28, flexShrink: 0 }}>
        {!isMine && showAvatar && (
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: 'white', background: color,
          }}>
            {initials}
          </div>
        )}
      </div>

      <div style={{ maxWidth: '72%' }}>
        <div style={{
          padding: '10px 14px', fontSize: 13, lineHeight: 1.55,
          background: isMine ? 'var(--accent)' : 'var(--surface-2)',
          color: isMine ? '#0A1512' : 'var(--ink-1)',
          borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          boxShadow: isMine ? '0 2px 12px rgba(0,221,160,0.22)' : 'none',
          border: isMine ? 'none' : '1px solid var(--border-0)',
        }}>
          <p style={{ margin: 0, wordBreak: 'break-word' }}>{msg.contenu}</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          marginTop: 3, padding: '0 4px',
          justifyContent: isMine ? 'flex-end' : 'flex-start',
        }}>
          <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>
            {format(new Date(msg.envoye_le), 'HH:mm')}
          </span>
          {isMine && (
            <span style={{ color: msg.lu ? 'var(--accent)' : 'var(--ink-4)' }}>
              {msg.lu ? <CheckCheck size={11} /> : <Check size={11} />}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
