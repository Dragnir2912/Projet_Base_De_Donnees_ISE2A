const colors = {
  normal:    'bg-[#34C759]/15 text-[#34C759]',
  attention: 'bg-[#FF9500]/15 text-[#FF9500]',
  danger:    'bg-[#FF2D55]/15 text-[#FF2D55]',
  blue:      'bg-[#007AFF]/15 text-[#007AFF]',
  purple:    'bg-[#AF52DE]/15 text-[#AF52DE]',
}

export default function Badge({ label, variant = 'blue', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide ${colors[variant] || colors.blue} ${className}`}>
      {label}
    </span>
  )
}
