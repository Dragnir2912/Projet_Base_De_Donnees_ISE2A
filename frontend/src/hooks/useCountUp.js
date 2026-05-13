import { useState, useEffect } from 'react'

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function useCountUp(target, duration = 1500, decimals = 0) {
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (target == null) return
    if (prefersReduced()) { setVal(target); return }

    const start = performance.now()
    const mult  = Math.pow(10, decimals)

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(eased * target * mult) / mult)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration, decimals])

  return val
}
