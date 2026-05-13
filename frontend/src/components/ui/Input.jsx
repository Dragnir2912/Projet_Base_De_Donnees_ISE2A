export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-[#3A3A3C] tracking-wide uppercase">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 rounded-[14px] bg-[#F2F2F7] text-[#1C1C1E] text-sm outline-none
          focus:ring-2 focus:ring-[#007AFF] transition-all duration-200 placeholder:text-[#8E8E93] ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[#FF2D55]">{error}</p>}
    </div>
  )
}
