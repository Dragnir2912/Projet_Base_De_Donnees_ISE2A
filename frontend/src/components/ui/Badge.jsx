const colors = {
  normal:    { bg: 'rgba(0,217,126,0.12)',   color: '#00D97E' },
  attention: { bg: 'rgba(255,140,66,0.12)',  color: '#FF8C42' },
  danger:    { bg: 'rgba(255,75,96,0.12)',   color: '#FF4B60' },
  blue:      { bg: 'rgba(0,221,160,0.10)',   color: '#00DDA0' },
  purple:    { bg: 'rgba(155,119,245,0.12)', color: '#9B77F5' },
}

export default function Badge({ label, variant = 'blue', className = '' }) {
  const c = colors[variant] ?? colors.blue
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 9px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.1px',
        whiteSpace: 'nowrap',
        background: c.bg,
        color: c.color,
      }}
    >
      {label}
    </span>
  )
}
