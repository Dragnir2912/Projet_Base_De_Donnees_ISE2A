export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="field-label">{label}</label>
      )}
      <input
        className={`field-input ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[#FF5C6A]">{error}</p>}
    </div>
  )
}
