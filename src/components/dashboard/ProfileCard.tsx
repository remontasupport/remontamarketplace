'use client'

import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useState, useEffect } from 'react'

interface ProfileCardProps {
  profileData?: {
    firstName: string
    photo: string | null
  }
}

export default function ProfileCard({ profileData }: ProfileCardProps) {
  const { data: session } = useSession()
  const [greeting, setGreeting] = useState('Good Morning')

  // Determine greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting('Good Morning')
    } else if (hour < 18) {
      setGreeting('Good Afternoon')
    } else {
      setGreeting('Good Evening')
    }
  }, [])

  // Get display name from profileData or fallback to email
  const displayName = profileData?.firstName || session?.user?.email?.split('@')[0] || 'Worker'

  // Get profile photo URL from database or use placeholder
  const photoUrl = profileData?.photo || '/images/profilePlaceHolder.png'

  return (
    <div className="profile-card">
      {/* Header */}
      <div className="profile-card-header">
        <h3 className="profile-card-title">Your Profile</h3>
        <button className="profile-menu-btn">⋮</button>
      </div>

      {/* Avatar */}
      <div className="profile-avatar-wrapper">
        <div className="profile-avatar w-32 h-32 rounded-full overflow-hidden mx-auto">
          <Image
            src={photoUrl}
            alt="Profile"
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Greeting */}
      <div className="profile-greeting">
        <h4 className="profile-name">
          {greeting}, {displayName}
        </h4>
      </div>
    </div>
  )
}
