export default function Card({ children, className = '', onClick }) {
  return (
    <div
      className={`card ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
