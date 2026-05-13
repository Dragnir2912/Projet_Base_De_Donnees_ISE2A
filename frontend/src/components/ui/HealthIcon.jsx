/**
 * Icône principale Sotera : cœur avec ligne ECG/heartbeat.
 * Remplace l'ancienne icône de localisation.
 */
export function SoteraIcon({ size = 16, color = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Cœur */}
      <path
        d="M12 20.5C12 20.5 3 14.5 3 8.5C3 5.46 5.46 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.54 3 23 5.46 23 8.5C23 14.5 14 20.5 12 20.5H12Z"
        fill={color}
        fillOpacity="0.25"
      />
      {/* Ligne ECG */}
      <path
        d="M4 11.5H7.5L9 8L12 15L14.5 9.5L16 11.5H20"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Icône ECG/heartbeat seule (sidebar, navigation).
 */
export function HeartbeatIcon({ size = 16, color = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12H6.5L8.5 6L12 18L15.5 8L17.5 12H21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
