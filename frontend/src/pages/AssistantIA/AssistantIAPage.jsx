import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Sparkles, PlusCircle, Clock, User, Pencil, Trash2, Search, X as XIcon } from 'lucide-react'
import Illustration from '../../components/ui/Illustration'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  getSessions, getSession,
  updateSessionTitre, deleteSession,
} from '../../services/iaService'
import MarkdownRenderer from '../../components/ui/MarkdownRenderer'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const SUGGESTIONS = [
  "Comment interpréter ma dernière mesure de tension ?",
  "Mon VitaScore a baissé, pourquoi ?",
  "Que signifie une glycémie à jeun élevée ?",
  "Quand dois-je consulter un médecin ?",
]

export default function AssistantIAPage() {
  const [messages,     setMessages]     = useState([])
  const [input,        setInput]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [sessionId,    setSessionId]    = useState(null)
  const [sessions,     setSessions]     = useState([])
  const [deletingId,   setDeletingId]   = useState(null)
  const [removingIds,  setRemovingIds]  = useState([])
  const [searchIA,     setSearchIA]     = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const abortRef  = useRef(null)

  const refreshSessions = useCallback(() =>
    getSessions().then(r => setSessions(r.data.data ?? [])).catch(() => {}),
  [])

  useEffect(() => { refreshSessions() }, [refreshSessions])

  useEffect(() => {
    if (messages.length > 0 || loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  /* ── Envoi avec streaming SSE ─────────────────────── */
  const send = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    setMessages(prev => [...prev, { role: 'user', message: msg }])
    setLoading(true)

    const STREAM_ID = Date.now()
    setMessages(prev => [...prev, { role: 'assistant', message: '', _streamId: STREAM_ID, streaming: true }])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`${API_BASE}/ia/chat`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body:   JSON.stringify({ message: msg, session_id: sessionId }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer    = ''

      stream: while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let data
          try { data = JSON.parse(line.slice(6)) } catch { continue }

          if (data.error) {
            setMessages(prev => prev.map(m =>
              m._streamId === STREAM_ID
                ? { ...m, message: 'Désolée, une erreur est survenue. Réessayez dans un instant.', streaming: false }
                : m
            ))
            break stream
          }

          if (data.text) {
            setMessages(prev => prev.map(m =>
              m._streamId === STREAM_ID
                ? { ...m, message: m.message + data.text }
                : m
            ))
          }

          if (data.done) {
            setSessionId(data.session_id)
            setMessages(prev => prev.map(m =>
              m._streamId === STREAM_ID ? { ...m, streaming: false } : m
            ))
            setSessions(prev => {
              const exists = prev.find(s => s.session_id === data.session_id)
              if (exists) {
                return prev.map(s => s.session_id === data.session_id
                  ? { ...s, titre: data.titre, nb_messages: s.nb_messages + 2 }
                  : s)
              }
              return [{
                session_id: data.session_id,
                titre:      data.titre || 'Conversation',
                debut:      new Date().toISOString(),
                nb_messages: 2,
              }, ...prev]
            })
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m._streamId === STREAM_ID
            ? { ...m, message: 'Désolée, une erreur est survenue. Réessayez dans un instant.', streaming: false }
            : m
        ))
      }
    } finally {
      setLoading(false)
      abortRef.current = null
      inputRef.current?.focus()
    }
  }

  const loadSession = async (sid) => {
    const res = await getSession(sid)
    setMessages(res.data.data ?? [])
    setSessionId(sid)
  }

  const newConversation = () => {
    abortRef.current?.abort()
    setMessages([])
    setSessionId(null)
    inputRef.current?.focus()
  }

  const handleTitreSaved = (sid, newTitre) =>
    setSessions(prev => prev.map(s => s.session_id === sid ? { ...s, titre: newTitre } : s))

  const confirmDelete = async () => {
    if (!deletingId) return
    const sid = deletingId
    setDeletingId(null)
    setRemovingIds(prev => [...prev, sid])
    try {
      await deleteSession(sid)
      setTimeout(() => {
        setSessions(prev => prev.filter(s => s.session_id !== sid))
        setRemovingIds(prev => prev.filter(id => id !== sid))
        if (sessionId === sid) newConversation()
      }, 400)
    } catch {
      setRemovingIds(prev => prev.filter(id => id !== sid))
      toast.error('Impossible de supprimer cette conversation.')
    }
  }

  return (
    <div className="flex rounded-2xl overflow-hidden page-enter"
      style={{ height: 'calc(100dvh - 120px)', minHeight: 540, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-0)' }}>

      {/* ═══ Sidebar sessions ═══ */}
      <div className="w-72 flex flex-col flex-shrink-0"
        style={{ background: 'var(--surface-1)', borderRight: '1px solid var(--border-0)' }}>

        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
          <button onClick={newConversation}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{ background: 'var(--accent)', color: '#0A1512', border: 'none', cursor: 'pointer', boxShadow: '0 2px 14px rgba(0,221,160,0.22)' }}>
            <PlusCircle size={16} /> Nouvelle conversation
          </button>
        </div>

        {/* Recherche sessions */}
        <div className="px-3 pb-2 pt-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-0)',
            }}
            onFocusCapture={e => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,221,160,0.08)'
            }}
            onBlurCapture={e => {
              e.currentTarget.style.borderColor = 'var(--border-0)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
            <Search size={12} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
            <input
              value={searchIA}
              onChange={e => setSearchIA(e.target.value)}
              placeholder="Rechercher une conversation…"
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: 12, color: 'var(--ink-1)', border: 'none', fontFamily: 'Poppins, system-ui' }}
            />
            {searchIA && (
              <button onClick={() => setSearchIA('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>
                <XIcon size={11} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={24} style={{ color: 'var(--border-1)', margin: '0 auto 8px' }} />
              <p className="text-xs" style={{ color: 'var(--ink-3)' }}>Aucune session précédente</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2" style={{ color: 'var(--ink-3)' }}>
                Historique
              </p>
              {sessions.filter(s =>
                !searchIA || (s.titre || '').toLowerCase().includes(searchIA.toLowerCase())
              ).map(s => (
                <SessionItem
                  key={s.session_id}
                  session={s}
                  isActive={sessionId === s.session_id}
                  isRemoving={removingIds.includes(s.session_id)}
                  onClick={() => loadSession(s.session_id)}
                  onTitreSaved={t => handleTitreSaved(s.session_id, t)}
                  onDeleteRequest={() => setDeletingId(s.session_id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Zone de chat ═══ */}
      <div className="flex flex-col flex-1 min-w-0" style={{ background: 'var(--surface-0)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid var(--border-0)' }}>
          <Illustration
            name="ai-assistant"
            width={40} height={40}
            style={{ borderRadius: '50%', flexShrink: 0 }}
          />
          <div>
            <p className="font-semibold" style={{ color: 'var(--ink-1)' }}>Sotera IA</p>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
              Propulsé par Gemini · Votre assistant santé personnel
            </p>
          </div>
          <div className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-semibold"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-2)' }}>
            Gemini
          </div>
        </div>

        {/* Disclaimer — visible uniquement quand conversation active */}
        {messages.length > 0 && (
          <div className="px-6 py-2.5 text-xs flex-shrink-0"
            style={{ background: 'rgba(255,149,0,0.08)', color: 'var(--vital-orange)', borderBottom: '1px solid rgba(255,149,0,0.15)' }}>
            ⚠️ Je fournis des informations générales. Je ne remplace pas l'avis d'un médecin.
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col px-6 py-5 gap-4" style={{ minHeight: 0 }}>
          {messages.length === 0 ? (
            <div className="flex-1 relative flex flex-col items-center justify-center gap-5 text-center animate-fade-up">
              {/* Fond atmosphérique */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'url(/illustrations/hero/illus-meditation-sunset.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.05,
                filter: 'blur(4px)',
                pointerEvents: 'none',
                borderRadius: 16,
              }} />

              {/* Disclaimer intégré ici pour l'état vide */}
              <div className="relative z-10 px-4 py-2 rounded-xl text-xs"
                style={{ background: 'rgba(255,149,0,0.08)', color: 'var(--vital-orange)', border: '1px solid rgba(255,149,0,0.15)' }}>
                ⚠️ Je fournis des informations générales. Je ne remplace pas l'avis d'un médecin.
              </div>

              {/* Illustration */}
              <div className="relative z-10">
                <div className="w-24 h-24 rounded-full overflow-hidden"
                  style={{ boxShadow: '0 8px 32px rgba(46,155,131,0.25), 0 0 0 3px rgba(46,155,131,0.15)' }}>
                  <img
                    src="/illustrations/hero/illus-patient-health-profile.jpeg"
                    alt="Sotera IA"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1A7C6C, #2E9B83)', boxShadow: '0 4px 12px rgba(46,155,131,0.4)' }}>
                  <Sparkles size={13} color="white" />
                </div>
              </div>

              <div className="relative z-10">
                <p className="text-lg font-bold mb-1" style={{ color: 'var(--ink-1)', letterSpacing: '-0.4px' }}>
                  Bonjour, je suis Sotera
                </p>
                <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--ink-3)' }}>
                  Posez-moi vos questions sur vos données de santé.
                </p>
              </div>

              {/* Suggestions — 2 colonnes pour tenir dans l'espace */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => send(s)}
                    className="text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-150"
                    style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--border-0)', cursor: 'pointer' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--surface-3)'
                      e.currentTarget.style.borderColor = 'var(--border-1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--surface-2)'
                      e.currentTarget.style.borderColor = 'var(--border-0)'
                    }}>
                    <span style={{ color: 'var(--accent)', marginRight: 8 }}>→</span>{s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => <ChatMessage key={msg._streamId ?? i} msg={msg} />)
          )}

          {/* Indicateur de frappe */}
          {loading && messages.at(-1)?.role !== 'assistant' && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1A7C6C, #2E9B83)' }}>
                <Sparkles size={14} color="white" />
              </div>
              <div className="px-4 py-3 rounded-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-0)', borderTopLeftRadius: 4 }}>
                <div className="flex gap-1 items-center h-4">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-2 h-2 rounded-full"
                      style={{ background: 'var(--ink-3)', animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input — glass composing bar */}
        <div className="px-6 py-4" style={{ borderTop: '1px solid var(--border-0)' }}>
          <div
            className="flex items-center gap-3 px-4 rounded-2xl"
            style={{
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
            }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Posez votre question…"
              disabled={loading}
              className="flex-1 py-3.5 bg-transparent outline-none text-sm"
              style={{ color: 'var(--ink-1)', border: 'none', fontFamily: 'Poppins, system-ui' }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
              style={{
                background: input.trim() && !loading ? 'var(--accent)' : 'var(--surface-3)',
                color: input.trim() && !loading ? '#0A1512' : 'var(--ink-3)',
                border: 'none',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                boxShadow: input.trim() && !loading ? '0 2px 12px rgba(0,221,160,0.30)' : 'none',
              }}>
              {loading ? (
                <div style={{
                  width: 15, height: 15, borderRadius: '50%',
                  border: '2px solid transparent',
                  borderTop: '2px solid var(--ink-3)',
                  animation: 'spin 0.7s linear infinite',
                }} />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Dialog suppression ═══ */}
      {deletingId && <DeleteDialog onConfirm={confirmDelete} onCancel={() => setDeletingId(null)} />}

      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          span[style*="typing-dot"] { animation: none !important; }
        }
      `}</style>
    </div>
  )
}

/* ─── ChatMessage ─────────────────────────────────────── */
function ChatMessage({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: isUser ? 'var(--accent)' : 'var(--surface-3)', border: isUser ? 'none' : '1px solid var(--border-1)' }}>
        {isUser ? <User size={14} color="#0A1512" /> : <Sparkles size={14} color="var(--accent)" />}
      </div>

      <div
        className="max-w-[78%] px-4 py-3"
        style={{
          background:   isUser ? 'var(--accent)' : 'var(--surface-2)',
          color:        isUser ? '#0A1512' : 'var(--ink-1)',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          boxShadow:    isUser ? '0 2px 14px rgba(0,221,160,0.22)' : 'none',
          border:       isUser ? 'none' : '1px solid var(--border-0)',
        }}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
        ) : (
          <>
            <MarkdownRenderer
              text={msg.message}
              style={{ color: 'var(--ink-1)' }}
            />
            {msg.streaming && (
              <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--accent)', borderRadius: 1, marginLeft: 2, verticalAlign: 'text-bottom', animation: 'cursor-blink 0.8s ease-in-out infinite' }} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ─── SessionItem ─────────────────────────────────────── */
function SessionItem({ session, isActive, isRemoving, onClick, onTitreSaved, onDeleteRequest }) {
  const [hovered,    setHovered]    = useState(false)
  const [editing,    setEditing]    = useState(false)
  const [draftTitre, setDraftTitre] = useState(session.titre || 'Conversation')
  const [saving,     setSaving]     = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  const startEdit = e => { e.stopPropagation(); setDraftTitre(session.titre || 'Conversation'); setEditing(true) }
  const cancelEdit = () => { setEditing(false); setDraftTitre(session.titre || 'Conversation') }

  const saveEdit = async () => {
    const trimmed = draftTitre.trim()
    if (!trimmed || trimmed === session.titre) { cancelEdit(); return }
    setSaving(true)
    try {
      await updateSessionTitre(session.session_id, trimmed)
      onTitreSaved(trimmed)
      setEditing(false)
    } catch {
      toast.error('Impossible de renommer cette conversation.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="w-full rounded-xl"
      style={{
        background: isActive ? 'var(--accent-dim)' : hovered ? 'var(--surface-3)' : 'transparent',
        borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        maxHeight: isRemoving ? '0px' : '120px',
        opacity: isRemoving ? 0 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button onClick={editing ? undefined : onClick}
        className="w-full text-left px-3 py-2.5 rounded-xl"
        style={{ background: 'none', border: 'none', cursor: editing ? 'default' : 'pointer' }}>

        <div className="flex items-center gap-1 pr-1">
          {editing ? (
            <input
              ref={inputRef}
              value={draftTitre}
              onChange={e => setDraftTitre(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
              onBlur={saveEdit}
              disabled={saving}
              className="flex-1 text-sm font-semibold bg-transparent outline-none rounded px-1"
              style={{ color: 'var(--ink-1)', border: '1px solid var(--accent)', fontFamily: 'Poppins, system-ui' }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <p className="text-sm font-semibold flex-1 truncate" style={{ color: 'var(--ink-1)' }}
              onDoubleClick={startEdit}>
              {session.titre || 'Conversation'}
            </p>
          )}

          {!editing && hovered && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <ActionBtn onClick={startEdit} title="Renommer" color="var(--accent)"><Pencil size={13} /></ActionBtn>
              <ActionBtn onClick={e => { e.stopPropagation(); onDeleteRequest() }} title="Supprimer" color="#FF5C6A"><Trash2 size={13} /></ActionBtn>
            </div>
          )}
        </div>

        <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
          {format(new Date(session.debut), 'd MMM yyyy', { locale: fr })}
          {' · '}{session.nb_messages} msg
        </p>
      </button>
    </div>
  )
}

function ActionBtn({ onClick, title, color, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} title={title}
      className="w-6 h-6 flex items-center justify-center rounded-lg transition-all"
      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: hov ? color : 'var(--ink-3)' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  )
}

/* ─── DeleteDialog ────────────────────────────────────── */
function DeleteDialog({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: 'var(--glass-card)',
          backdropFilter: 'blur(28px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.40)',
          animation: 'scale-in 0.24s cubic-bezier(0.34,1.2,0.64,1) both',
        }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,92,106,0.12)', border: '1px solid rgba(255,92,106,0.2)' }}>
            <Trash2 size={18} color="#FF5C6A" />
          </div>
          <p className="font-semibold text-base" style={{ color: 'var(--ink-1)' }}>
            Supprimer la conversation ?
          </p>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--ink-2)' }}>
          Cette action est irréversible. Tous les messages seront supprimés définitivement.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--border-0)', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}>
            Annuler
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: '#FF5C6A', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,92,106,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,92,106,0.45)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,92,106,0.3)'}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
