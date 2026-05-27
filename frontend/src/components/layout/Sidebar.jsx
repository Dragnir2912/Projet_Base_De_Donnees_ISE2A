import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Activity, Bell, MessageSquare, Sparkles,
  Stethoscope, Users, User, LogOut, ChevronLeft, ChevronRight, Leaf,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useAlertesStore from '../../store/alertesStore'
import useSidebarStore from '../../store/sidebarStore'

const PATIENT_NAV = [
  {
    group: null,
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
      { to: '/mesures',   icon: Activity,         label: 'Mes mesures' },
    ],
  },
  {
    group: 'Santé',
    items: [
      { to: '/alertes',  icon: Bell,          label: 'Alertes',     badge: true },
    ],
  },
  {
    group: 'Communication',
    items: [
      { to: '/messages',  icon: MessageSquare, label: 'Messagerie' },
      { to: '/assistant', icon: Sparkles,      label: 'Assistant IA', special: true },
      { to: '/relations', icon: Stethoscope,   label: 'Mon médecin' },
    ],
  },
]

const MEDECIN_NAV = [
  {
    group: null,
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
      { to: '/medecin',   icon: Users,            label: 'Mes patients',    end: true },
    ],
  },
  {
    group: 'Suivi',
    items: [
      { to: '/medecin/alertes', icon: Bell,        label: 'Alertes patients' },
      { to: '/relations',       icon: Stethoscope, label: 'Demandes' },
    ],
  },
  {
    group: 'Communication',
    items: [
      { to: '/messages', icon: MessageSquare, label: 'Messagerie' },
    ],
  },
]

const SIDEBAR_FULL = 260
const SIDEBAR_MINI = 64


export default function Sidebar() {
  const { user, logout }      = useAuthStore()
  const { nbNonVues }         = useAlertesStore()
  const { collapsed, toggle } = useSidebarStore()
  const navigate              = useNavigate()
  const isMedecin  = user?.role === 'medecin'
  const navGroups  = isMedecin ? MEDECIN_NAV : PATIENT_NAV
  const initials   = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase()

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0,
      height: '100vh',
      width: collapsed ? SIDEBAR_MINI : SIDEBAR_FULL,
      background: 'var(--surface-1)',
      borderRight: '1px solid var(--border-0)',
      display: 'flex', flexDirection: 'column',
      zIndex: 40,
      transition: 'width 0.26s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
    }}>

      {/* Ambient top glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '100%', height: '40%',
        background: 'radial-gradient(ellipse at 85% 0%, rgba(0,221,160,0.07) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      {/* Ambient bottom glow */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        width: '100%', height: '22%',
        background: 'radial-gradient(ellipse at 15% 100%, rgba(77,170,255,0.04) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* ── Logo ── */}
      <div style={{
        height: 64,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? 0 : '0 14px 0 18px',
        borderBottom: '1px solid var(--border-0)',
        flexShrink: 0,
        transition: 'padding 0.26s ease',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {/* Logo mark — wrapper isolé pour que le glow ne soit pas coupé */}
          <div style={{ position: 'relative', flexShrink: 0, padding: 6 }}>
            {/* Orbe de glow — contenu dans le padding, ne déborde pas */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 18,
              background: 'radial-gradient(circle, rgba(46,155,131,0.42) 0%, rgba(46,155,131,0.15) 50%, transparent 75%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #2E9B83, #1A7C6C)',
              position: 'relative',
            }}>
              <Leaf size={18} color="white" />
            </div>
          </div>

          {!collapsed && (
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              {/* Wordmark + role badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 17, fontWeight: 800, letterSpacing: '-1px',
                  background: 'var(--gradient-accent)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text', whiteSpace: 'nowrap', lineHeight: 1.15,
                }}>Sotera</span>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.7px', textTransform: 'uppercase',
                  padding: '2px 6px', borderRadius: 5, flexShrink: 0,
                  background: isMedecin ? 'rgba(77,170,255,0.12)' : 'rgba(0,221,160,0.10)',
                  color: isMedecin ? 'var(--vital-blue)' : 'var(--accent)',
                  border: isMedecin ? '1px solid rgba(77,170,255,0.22)' : '1px solid rgba(0,221,160,0.20)',
                }}>
                  {isMedecin ? 'Médecin' : 'Patient'}
                </span>
              </div>
              <span style={{
                fontSize: 9.5, fontWeight: 500, letterSpacing: '1px',
                textTransform: 'uppercase', color: 'var(--ink-4)', whiteSpace: 'nowrap',
              }}>Vital Intelligence</span>
            </div>
          )}
        </div>

        {/* Collapse button (expanded only) */}
        {!collapsed && (
          <button
            onClick={toggle}
            style={{
              width: 28, height: 28, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 9, background: 'var(--surface-2)',
              border: '1px solid var(--border-0)', cursor: 'pointer',
              color: 'var(--ink-3)', transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-dim)'
              e.currentTarget.style.color = 'var(--accent)'
              e.currentTarget.style.borderColor = 'var(--border-2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface-2)'
              e.currentTarget.style.color = 'var(--ink-3)'
              e.currentTarget.style.borderColor = 'var(--border-0)'
            }}
            title="Réduire"
          >
            <ChevronLeft size={13} />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: collapsed ? '8px 7px' : '8px 9px',
        position: 'relative', zIndex: 1,
        scrollbarWidth: 'none',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {navGroups.map((section, si) => (
            <div key={si} style={{ marginBottom: si < navGroups.length - 1 ? 6 : 0 }}>

              {/* Section label / separator */}
              {section.group && !collapsed && (
                <p style={{
                  padding: '10px 10px 4px',
                  fontSize: 9.5, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '1.0px',
                  color: 'var(--ink-4)', margin: 0,
                }}>
                  {section.group}
                </p>
              )}
              {section.group && collapsed && (
                <div style={{ height: 1, margin: '8px 10px', background: 'var(--border-0)' }} />
              )}

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {section.items.map(item => (
                  <SidebarNavItem
                    key={item.to}
                    item={item}
                    badge={item.badge === true ? nbNonVues : 0}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ── User section ── */}
      <div style={{
        borderTop: '1px solid var(--border-0)',
        padding: collapsed ? '8px 7px' : '8px 9px',
        flexShrink: 0, position: 'relative', zIndex: 1,
      }}>
        {collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <button
              onClick={() => navigate('/profil')}
              title={`${user?.prenom} ${user?.nom}`}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--gradient-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(0,221,160,0.30)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.07)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,221,160,0.48)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,221,160,0.30)'
              }}
            >
              {initials || <User size={14} color="white" />}
            </button>
            <button
              onClick={toggle}
              title="Développer"
              style={{
                width: 34, height: 26,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, background: 'var(--surface-2)',
                border: '1px solid var(--border-0)', cursor: 'pointer',
                color: 'var(--ink-3)', transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--accent-dim)'
                e.currentTarget.style.color = 'var(--accent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--surface-2)'
                e.currentTarget.style.color = 'var(--ink-3)'
              }}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        ) : (
          <UserCard user={user} initials={initials} isMedecin={isMedecin} onLogout={() => { logout(); navigate('/auth') }} onProfile={() => navigate('/profil')} />
        )}
      </div>
    </aside>
  )
}

/* ── User card (expanded state) ── */
function UserCard({ user, initials, isMedecin, onLogout, onProfile }) {
  return (
    <div
      className="sidebar-user-row"
      onClick={onProfile}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 10px', borderRadius: 14,
        cursor: 'pointer', transition: 'background 0.18s ease',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--accent-pale)'
        const btn = e.currentTarget.querySelector('.sidebar-logout')
        if (btn) btn.style.opacity = '1'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        const btn = e.currentTarget.querySelector('.sidebar-logout')
        if (btn) btn.style.opacity = '0'
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'var(--gradient-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: '-0.5px',
        boxShadow: '0 2px 10px rgba(0,221,160,0.28)',
      }}>
        {initials || <User size={13} color="white" />}
      </div>

      {/* Name + role */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: 'var(--ink-1)',
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          letterSpacing: '-0.2px', margin: 0,
        }}>
          {user?.prenom} {user?.nom}
        </p>
        <p style={{
          fontSize: 10.5, color: 'var(--ink-3)', margin: 0,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}>
          {isMedecin ? 'Médecin' : 'Patient'}
        </p>
      </div>

      {/* Logout — appears on hover */}
      <button
        className="sidebar-logout"
        onClick={e => { e.stopPropagation(); onLogout() }}
        style={{
          width: 28, height: 28, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 9, background: 'rgba(255,75,96,0.09)',
          border: 'none', cursor: 'pointer', color: 'var(--vital-red)',
          opacity: 0, transition: 'opacity 0.18s ease, background 0.18s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,75,96,0.16)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,75,96,0.09)' }}
        title="Déconnexion"
      >
        <LogOut size={13} />
      </button>
    </div>
  )
}

/* ── Nav item ── */
function SidebarNavItem({ item, badge, collapsed }) {
  const { icon: Icon, to, label, end, special } = item

  const specialColor   = '#9B77F5'
  const specialColorDim = 'rgba(155,119,245,0.70)'

  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `sidebar-nav-item${isActive ? ' active' : ''}${collapsed ? ' justify-center' : ''}`
      }
      style={collapsed ? { padding: '10px 0', justifyContent: 'center' } : {}}
    >
      {({ isActive }) => (
        <>
          {/* Icon container */}
          <div className="nav-icon-wrap" style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            background: isActive
              ? special
                ? 'linear-gradient(135deg, rgba(155,119,245,0.20), rgba(0,221,160,0.12))'
                : 'rgba(0,221,160,0.12)'
              : special
                ? 'linear-gradient(135deg, rgba(155,119,245,0.08), rgba(0,221,160,0.04))'
                : 'transparent',
            boxShadow: isActive
              ? special
                ? `0 0 14px rgba(155,119,245,0.25)`
                : `0 0 10px rgba(0,221,160,0.20)`
              : 'none',
            transition: 'background 0.18s ease, box-shadow 0.18s ease, transform 0.18s cubic-bezier(0.34,1.2,0.64,1)',
          }}>
            <Icon
              size={15}
              color={isActive
                ? special ? specialColor : 'var(--accent)'
                : special ? specialColorDim : undefined}
            />
            {/* Badge (collapsed) */}
            {collapsed && badge > 0 && (
              <span className="badge-pulse" style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 14, height: 14, borderRadius: 99,
                background: 'var(--vital-red)', color: 'white',
                fontSize: 8, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px',
              }}>
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </div>

          {/* Label */}
          {!collapsed && (
            <span style={{
              flex: 1, fontSize: 13.5, letterSpacing: '-0.15px',
              color: special && !isActive ? specialColorDim : undefined,
            }}>
              {label}
            </span>
          )}

          {/* Badge (expanded) */}
          {!collapsed && badge > 0 && (
            <span className="badge-pulse" style={{
              minWidth: 20, height: 18, padding: '0 5px',
              borderRadius: 99, background: 'var(--vital-red)',
              color: 'white', fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
