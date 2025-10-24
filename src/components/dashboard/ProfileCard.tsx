'use client'

import { useSession } from 'next-auth/react'
import Image from 'next/image'

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
          Verify your account now!
        </p>
      </div>
    </div>
  )
}
