export default function Button({ children, variant = 'primary', size = 'md', className = '', loading = false, ...props }) {
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-3 text-sm', lg: 'px-6 py-3.5 text-base' }
  const variants = {
    primary: 'bg-health-blue text-white hover:brightness-110',
    danger:  'bg-health-red text-white hover:brightness-110',
    ghost:   'bg-transparent text-health-blue hover:bg-blue-50',
    outline: 'border border-[#E5E5EA] bg-white text-[#1C1C1E] hover:bg-[#F2F2F7]',
  }
  return (
    <button
      className={`btn ${variants[variant]} ${sizes[size]} ${className} ${loading ? 'opacity-60 pointer-events-none' : ''}`}
      {...props}
    >
      {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : children}
    </button>
  )
}
