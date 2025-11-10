'use client'

import Image from 'next/image'
import { MapPin, User, Car } from 'lucide-react'
import { WorkerProfile } from '@/lib/sanity/workerProfileClient'
import '../styles/worker-profile-modal.css'

interface WorkerProfileModalProps {
  worker: WorkerProfile | null
  isOpen: boolean
  onClose: () => void
  backgroundColor: string
}

export default function WorkerProfileModal({
  worker,
  isOpen,
  onClose,
  backgroundColor,
}: WorkerProfileModalProps) {
  if (!isOpen || !worker) return null

  return (
    <>
      {/* Backdrop */}
      <div className="worker-modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="worker-modal">
        {/* Close Button */}
        <button
          type="button"
          className="worker-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="worker-modal-content">
          {/* Left Section - Profile Image */}
          <div className="worker-modal-left">
            {/* Profile Image */}
            <div
              className="worker-modal-image-wrapper"
              style={{ backgroundColor }}
            >
              {worker.imageUrl && (
                <Image
                  src={worker.imageUrl}
                  alt={worker.imageAlt || worker.name}
                  fill
                  className="worker-modal-image"
                  sizes="400px"
                />
              )}
            </div>
          </div>

          {/* Right Section - Profile Info */}
          <div className="worker-modal-right">
            {/* Name */}
            <h2 className="worker-modal-name">{worker.name}</h2>

            {/* Job Role */}
            <p className="worker-modal-role">{worker.jobRole}</p>

            {/* Profile Meta Information */}
            <div className="worker-modal-meta">
              {/* Location */}
              {worker.location && (
                <div className="worker-modal-meta-item">
                  <MapPin className="worker-modal-meta-icon" />
                  <span className="worker-modal-meta-value">{worker.location}</span>
                </div>
              )}

              {/* Languages */}
              {worker.languages && worker.languages.length > 0 && (
                <div className="worker-modal-meta-item">
                  <User className="worker-modal-meta-icon" />
                  <span className="worker-modal-meta-value">
                    {worker.languages.join(', ')}
                  </span>
                </div>
              )}

              {/* Vehicle Access */}
              <div className="worker-modal-meta-item">
                <Car className="worker-modal-meta-icon" />
                <span className="worker-modal-meta-value">
                  {worker.hasVehicleAccess ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* About Section */}
            <div className="worker-modal-about">
              <h3 className="worker-modal-about-title">About</h3>
              <p className="worker-modal-bio">{worker.bio}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
