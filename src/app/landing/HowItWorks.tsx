import Link from 'next/link'
import Image from 'next/image'

const steps = [
  {
    step: 1,
    title: 'Fill Out the Form',
    description: 'Tell us about your NDIS support needs. It takes just a few minutes to complete the form with your requirements and preferences.',
    image: '/images/fill-up-form.jpg', // Placeholder - replace with actual image
  },
  {
    step: 2,
    title: 'We Match You',
    description: 'Our platform connects you with verified, qualified professionals in your area who specialize in exactly what you need.',
    image: '/images/good-match.jpg', // Placeholder - replace with actual image
  },
  {
    step: 3,
    title: 'Get It Done',
    description: 'Choose your preferred professional, schedule the work, and enjoy peace of mind knowing your project is in expert hands.',
    image: '/images/step3.jpg', // Placeholder - replace with actual image
  },
]

export default function HowItWorks() {
  return (
    <section className="how-it-works-section">
      <div className="how-it-works-container">
        {/* Title */}
        <div className="how-it-works-header">
          <h2 className="section-title">
            How Easy Can Finding NDIS Support Be?
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="how-it-works-grid">
          {steps.map((item) => (
            <div key={item.step} className="how-it-works-step">
              {/* Image Container */}
              <div className="how-it-works-image-wrapper">
                {/* Placeholder background with step number */}
                <div className="how-it-works-image-background">
                  <div className="how-it-works-step-badge">
                    <span className="how-it-works-step-number">
                      {item.step}
                    </span>
                  </div>
                </div>
                {/* Uncomment when you have actual images */}
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Step Title */}
              <h3 className="how-it-works-step-title">
                {item.title}
              </h3>

              {/* Step Description */}
              <p className="how-it-works-step-description">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="how-it-works-cta">
          <Link href="/find-support" className="how-it-works-button">
            Get started with our services today
          </Link>
        </div>
      </div>
    </section>
  )
}