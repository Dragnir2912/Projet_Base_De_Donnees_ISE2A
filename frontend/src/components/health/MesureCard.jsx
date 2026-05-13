import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Badge from '../ui/Badge'

const TYPE_COLORS = {
  'Tension artérielle': '#FF2D55',
  'Fréquence cardiaque': '#FF375F',
  'Glycémie': '#FF9500',
  'Poids': '#007AFF',
  'SpO2': '#34C759',
  'Température': '#FFCC00',
  'Cholestérol': '#AF52DE',
}

export default function MesureCard({ mesure, onClick }) {
  const color = TYPE_COLORS[mesure.nom_type] || '#007AFF'
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
          <p className="font-semibold text-sm text-[#1C1C1E]">{mesure.nom_type}</p>
          <p className="text-xs text-[#8E8E93] mt-0.5">{dateStr}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg text-[#1C1C1E]">
          {mesure.valeur} <span className="text-sm font-normal text-[#8E8E93]">{mesure.unite}</span>
        </p>
        {mesure.statut && <Badge variant={mesure.statut} label={mesure.statut} />}
      </div>
    </div>
  )
}
