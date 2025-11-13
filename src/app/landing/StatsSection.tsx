'use client'

import { Award, Heart, TrendingUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import '@/app/styles/stats-section.css'

function AnimatedCounter({ value }: { value: string }) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const counterRef = useRef<HTMLDivElement>(null)

  // Extract numeric value and suffix/prefix
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''))
  const suffix = value.match(/[%+]/)?.[0] || ''
  const hasComma = value.includes(',')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)

            // Animation parameters
            const duration = 2000 // 2 seconds
            const steps = 60
            const increment = numericValue / steps
            const stepDuration = duration / steps

            let currentStep = 0
            const timer = setInterval(() => {
              currentStep++
              if (currentStep <= steps) {
                setCount(Math.min(increment * currentStep, numericValue))
              } else {
                setCount(numericValue)
                clearInterval(timer)
              }
            }, stepDuration)

            return () => clearInterval(timer)
          }
        })
      },
      { threshold: 0.5 }
    )

    if (counterRef.current) {
      observer.observe(counterRef.current)
    }

    return () => observer.disconnect()
  }, [numericValue, hasAnimated])

  const formatNumber = (num: number) => {
    if (hasComma) {
      return Math.floor(num).toLocaleString()
    }
    return Math.floor(num).toString()
  }

  return (
    <div ref={counterRef} className="stats-percentage">
      {formatNumber(count)}{suffix}
    </div>
  )
}

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  const stats = [
    {
      percentage: "99%",
      description: "Job completion rate",
      icon: Award
    },
    {
      percentage: "4,500+",
      description: "Supported by Remonta",
      icon: Heart
    },
    {
      percentage: "70%",
      description: "Admin time saved",
      icon: TrendingUp
    }
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section className="stats-section" ref={sectionRef}>
      <div className="stats-container">
        <div className="stats-grid">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div
                key={index}
                className={`stats-card ${isVisible ? 'animate-in' : ''}`}
              >
                <div className="stats-icon-wrapper">
                  <IconComponent className="stats-icon" />
                </div>
                <div className="stats-content">
                  <AnimatedCounter value={stat.percentage} />
                  <div className="stats-description">{stat.description}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Heading */}
        <div className="stats-heading">
          <h2>
            Connecting support workers with participants across Australia, making disability support more accessible and reliable
          </h2>
        </div>
      </div>
    </section>
  )
}
