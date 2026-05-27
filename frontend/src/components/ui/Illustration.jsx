import { useState } from 'react'

const ILLUSTRATIONS = {
  /* ── ui/ — SVGs fonctionnels ── */
  'health-person':       '/illustrations/ui/health-person.svg',
  'conseil-nutrition':   '/illustrations/ui/conseil-nutrition.svg',
  'conseil-activite':    '/illustrations/ui/conseil-activite.svg',
  'conseil-sommeil':     '/illustrations/ui/conseil-sommeil.svg',
  'conseil-hydratation': '/illustrations/ui/conseil-hydratation.svg',
  'ai-assistant':        '/illustrations/ui/ai-assistant.svg',
  'doctor-patient':      '/illustrations/ui/doctor-patient.svg',
  'mesure-glycemie':     '/illustrations/ui/mesure-glycemie.svg',
  'mesure-tension':      '/illustrations/ui/mesure-tension.svg',
  'mesure-poids':        '/illustrations/ui/mesure-poids.svg',
  'mesure-spo2':         '/illustrations/ui/mesure-spo2.svg',
  'mesure-cardio':       '/illustrations/ui/mesure-cardio.svg',
  'profile-hero':        '/illustrations/ui/profile-hero.svg',
  'empty-alerts':        '/illustrations/ui/empty-alerts.svg',
  'empty-messages':      '/illustrations/ui/empty-messages.svg',
  'empty-medecin':       '/illustrations/ui/empty-medecin.svg',

  /* ── hero/ — backgrounds plein cadre ── */
  'hero-auth':           '/illustrations/hero/illus-doctor-office-consultation.jpeg',
  'hero-mesures':        '/illustrations/hero/illus-patient-vitals.jpeg',
  'hero-medecin':        '/illustrations/hero/illus-doctor-health-charts.jpeg',
  'hero-relations-doc':  '/illustrations/hero/illus-doctor-patients-screen.jpeg',
  'hero-relations-pat':  '/illustrations/hero/illus-elderly-patient-tablet.jpeg',
  'hero-alertes-med':    '/illustrations/hero/illus-doctor-alert-tablet.jpeg',
  'hero-mesure-info':    '/illustrations/hero/illus-patient-blood-pressure.jpeg',
  'hero-fiche-patient':  '/illustrations/hero/illus-doctor-tablet.jpeg',
  'hero-messagerie':     '/illustrations/hero/illus-patient-messaging.jpeg',
  'hero-profil':         '/illustrations/hero/illus-patient-health-profile.jpeg',
  'hero-consultations':  '/illustrations/hero/illus-doctor-consultation.jpeg',
  'hero-relation-smile': '/illustrations/hero/illus-doctor-patient-smile.jpeg',
  'hero-assistant':      '/illustrations/hero/illus-meditation-sunset.png',
  'hero-medical-team':   '/illustrations/hero/medical-team.jpg',

  /* ── ambient/ — activités et lifestyle ── */
  'ambient-running':     '/illustrations/ambient/illus-patient-running.jpeg',
  'ambient-cycling':     '/illustrations/ambient/illus-patient-cycling.jpeg',
  'ambient-swimming':    '/illustrations/ambient/illus-patient-swimming.jpeg',
  'ambient-meditation':  '/illustrations/ambient/illus-patient-meditation.jpeg',
  'ambient-yoga':        '/illustrations/ambient/illus-yoga-pose.png',
  'ambient-basketball':  '/illustrations/ambient/illus-patient-basketball.jpeg',
  'ambient-weightlift':  '/illustrations/ambient/illus-patient-weightlifting.jpeg',
  'ambient-hydration':   '/illustrations/ambient/illus-patient-drinking-water.jpeg',
  'ambient-eating':      '/illustrations/ambient/illus-patient-healthy-eating.jpeg',
  'ambient-breakfast':   '/illustrations/ambient/illus-healthy-breakfast.png',
  'ambient-zen':         '/illustrations/ambient/illus-zen-stones.png',
  'ambient-sunrise':     '/illustrations/ambient/illus-hope-sunrise.png',
  'ambient-water':       '/illustrations/ambient/person-hydration.jpg',
  'ambient-yoga-group':  '/illustrations/ambient/people-yoga.jpg',
  'ambient-outdoor':     '/illustrations/ambient/people-outdoor-sports.jpg',
  'ambient-sports':      '/illustrations/ambient/people-sports.jpg',

  /* ── feature/ — fonctionnalités spécifiques ── */
  'feat-medication-m':   '/illustrations/feature/illus-patient-medication-man.jpeg',
  'feat-medication-f':   '/illustrations/feature/illus-patient-medication-woman.jpeg',
  'feat-annotation':     '/illustrations/feature/illus-doctor-writing.jpeg',
  'feat-patient-app':    '/illustrations/feature/illus-doctor-patient-app.jpeg',
  'feat-profiles':       '/illustrations/feature/illus-doctor-profiles.jpeg',
  'feat-smartwatch':     '/illustrations/feature/illus-patient-smartwatch.jpeg',
  'feat-phone-health':   '/illustrations/feature/illus-patient-phone-health.jpeg',
  'feat-home-bp':        '/illustrations/feature/illus-elderly-bp-home.jpeg',

  /* ── artwork/ — collectif et ambiance ── */
  'art-community':       '/illustrations/artwork/illus-community-group.jpeg',
  'art-people':          '/illustrations/artwork/people-community.jpg',
  'art-diverse':         '/illustrations/artwork/people-diverse.jpg',
  'art-welcome':         '/illustrations/artwork/people-waving.jpg',
  'art-family':          '/illustrations/artwork/family-health.jpg',

  /* ── floating/ — portraits ── */
  'float-doctor-m':      '/illustrations/floating/doctor-man.png',
  'float-doctor-f':      '/illustrations/floating/doctor-woman.png',
  'float-doctor-pro':    '/illustrations/floating/doctor-woman-professional.png',
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
