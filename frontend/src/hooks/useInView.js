import { useState, useEffect, useRef } from 'react'

export default function useInView(threshold = 0.15) {
  const ref     = useRef(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setSeen(true) },
      { threshold }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])

  return [ref, seen]
}
