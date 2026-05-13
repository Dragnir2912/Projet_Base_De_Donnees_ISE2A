import { useState } from 'react'

const ILLUSTRATIONS = {
  'health-person':       '/illustrations/health-person.svg',
  'conseil-nutrition':   '/illustrations/conseil-nutrition.svg',
  'conseil-activite':    '/illustrations/conseil-activite.svg',
  'conseil-sommeil':     '/illustrations/conseil-sommeil.svg',
  'conseil-hydratation': '/illustrations/conseil-hydratation.svg',
  'ai-assistant':        '/illustrations/ai-assistant.svg',
  'doctor-patient':      '/illustrations/doctor-patient.svg',
  'mesure-glycemie':     '/illustrations/mesure-glycemie.svg',
  'mesure-tension':      '/illustrations/mesure-tension.svg',
  'mesure-poids':        '/illustrations/mesure-poids.svg',
  'mesure-spo2':         '/illustrations/mesure-spo2.svg',
  'mesure-cardio':       '/illustrations/mesure-cardio.svg',
  'profile-hero':        '/illustrations/profile-hero.svg',
  'empty-alerts':        '/illustrations/empty-alerts.svg',
  'empty-messages':      '/illustrations/empty-messages.svg',
  'empty-medecin':       '/illustrations/empty-medecin.svg',
  'onboarding-welcome':  '/illustrations/onboarding-welcome.svg',
}

export default function Illustration({
  name,
  width = 100,
  height = 100,
  className = '',
  style = {},
  fadeSide = null,
  priority = false,
}) {
  const [failed, setFailed] = useState(false)

  const src = ILLUSTRATIONS[name]
  if (!src || failed) return null

  const maskStyle =
    fadeSide === 'left'
      ? {
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 35%)',
          maskImage:       'linear-gradient(to right, transparent 0%, black 35%)',
        }
      : fadeSide === 'right'
      ? {
          WebkitMaskImage: 'linear-gradient(to left, transparent 0%, black 35%)',
          maskImage:       'linear-gradient(to left, transparent 0%, black 35%)',
        }
      : {}

  return (
    <img
      src={src}
      alt=""
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      aria-hidden="true"
      className={className}
      style={{
        objectFit: 'contain',
        display: 'block',
        ...maskStyle,
        ...style,
      }}
      onError={() => setFailed(true)}
    />
  )
}
