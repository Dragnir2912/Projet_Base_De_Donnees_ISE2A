import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Badge from '../ui/Badge'

const TYPE_COLORS = {
  'Tension artérielle': '#FF5C6A',
  'Fréquence cardiaque': '#FF7B73',
  'Glycémie': '#FF9500',
  'Poids': '#2E9B83',
  'SpO2': '#34C759',
  'Température': '#FFCC00',
  'Cholestérol': '#1A7C6C',
}

export default function MesureCard({ mesure, onClick }) {
  const color = TYPE_COLORS[mesure.nom_type] || '#2E9B83'
  const dateStr = mesure.date_mesure
    ? format(new Date(mesure.date_mesure), 'd MMM yyyy', { locale: fr })
    : ''

  return (
    <div
      onClick={onClick}
      className={`card flex items-center justify-between ${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow duration-200`}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: color }}
        >
          {mesure.nom_type?.charAt(0) || '?'}
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{mesure.nom_type}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{dateStr}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
          {mesure.valeur} <span className="text-sm font-normal" style={{ color: 'var(--text-tertiary)' }}>{mesure.unite}</span>
        </p>
        {mesure.statut && <Badge variant={mesure.statut} label={mesure.statut} />}
      </div>
    </div>
  )
}
