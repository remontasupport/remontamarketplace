'use client'

import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { BellIcon, EnvelopeIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'

export default function ProfileCard() {
  const { data: session } = useSession()

  return (
    <div className="profile-card">
      {/* Header */}
      <div className="profile-card-header">
        <h3 className="profile-card-title">Your Profile</h3>
        <button className="profile-menu-btn">⋮</button>
      </div>

      {/* Avatar */}
      <div className="profile-avatar-wrapper">
        <div className="profile-avatar">
          <Image
            src="/images/profilePlaceHolder.png"
            alt="Profile"
            width={80}
            height={80}
            className="rounded-full"
          />
        </div>
      </div>

      {/* Greeting */}
      <div className="profile-greeting">
        <h4 className="profile-name">
          Good Morning {session?.user?.email?.split('@')[0] || 'Worker'}
        </h4>
        <p className="profile-subtitle">
          Continue Your Journey And Achieve Your Target
        </p>
      </div>

      {/* Action Buttons */}
      <div className="profile-actions">
        <button className="action-btn">
          <BellIcon className="w-5 h-5" />
        </button>
        <button className="action-btn">
          <EnvelopeIcon className="w-5 h-5" />
        </button>
        <button className="action-btn">
          <ChatBubbleLeftIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Chart Placeholder */}
      <div className="profile-stats">
        <div className="stats-bars">
          {[40, 60, 70, 85, 95].map((height, index) => (
            <div key={index} className="stat-bar-wrapper">
              <div
                className="stat-bar"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mentor Section */}
      <div className="profile-mentor-section">
        <div className="section-header">
          <h4 className="section-title">Your Mentor</h4>
          <button className="add-btn">+</button>
        </div>

        <div className="mentor-list">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="mentor-item">
              <div className="mentor-info">
                <div className="mentor-avatar">
                  <Image
                    src="/images/profilePlaceHolder.png"
                    alt="Mentor"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </div>
                <div className="mentor-details">
                  <p className="mentor-name">Support Coordinator</p>
                  <p className="mentor-role">Healthcare Professional</p>
                </div>
              </div>
              <button className="follow-btn">Follow</button>
            </div>
          ))}
        </div>

        <button className="see-all-btn">See All</button>
      </div>
    </div>
  )
}
