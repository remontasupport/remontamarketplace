'use client'

import { Award, Heart, TrendingUp } from 'lucide-react'
import '@/app/styles/stats-section.css'

export default function StatsSection() {
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

  return (
    <section className="stats-section">
      <div className="stats-container">
        <div className="stats-grid">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div key={index} className="stats-card">
                <div className="stats-icon-wrapper">
                  <IconComponent className="stats-icon" />
                </div>
                <div className="stats-content">
                  <div className="stats-percentage">{stat.percentage}</div>
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
