import '@/app/styles/how-it-works-component.css'

interface Step {
  number: number
  title: string
  description: string
}

interface HowItWorksProps {
  title: string
  subtitle: string
  steps: Step[]
}

export default function HowItWorks({ title, subtitle, steps }: HowItWorksProps) {
  return (
    <section className="how-it-works-section">
      <div className="how-it-works-container">
        {/* Section Header */}
        <div className="how-it-works-header">
          <h2 className="how-it-works-title">
            {title}
          </h2>
          <p className="how-it-works-description">
            {subtitle}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="how-it-works-grid">
          {steps.map((step) => (
            <div key={step.number} className="how-it-works-card">
              <div className="how-it-works-number">{step.number}</div>
              <h3 className="how-it-works-card-title">
                {step.title}
              </h3>
              <p className="how-it-works-card-text">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
