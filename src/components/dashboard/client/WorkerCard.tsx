'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { BRAND_COLORS } from '@/constants'

interface WorkerCardProps {
  id: string
  firstName: string
  lastName: string
  photo?: string | null
  role: string
  bio: string
  skills: string[]
  location: string
  isNdisCompliant?: boolean
  onViewProfile?: (id: string) => void
  onContact?: (id: string) => void
}

export default function WorkerCard({
  id,
  firstName,
  lastName,
  photo,
  role,
  bio,
  skills,
  location,
  isNdisCompliant = true,
  onViewProfile,
  onContact,
}: WorkerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const bioRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (bioRef.current) {
      setIsClamped(bioRef.current.scrollHeight > bioRef.current.clientHeight)
    }
  }, [bio])

  // Generate initials from name
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  const displayName = `${firstName}, ${lastName.charAt(0)}.`

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      {/* Header Section */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        {photo ? (
          <img
            src={photo}
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-poppins font-semibold text-sm flex-shrink-0"
            style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
          >
            {initials}
          </div>
        )}

        {/* Name, Role, Location, NDIS Badge */}
        <div className="min-w-0 flex-1">
          <h3 className="font-poppins font-semibold text-gray-900 text-base truncate">
            {displayName}
          </h3>
          <p className="font-poppins text-sm text-gray-600 truncate">
            {role}
          </p>
          <p className="font-poppins text-sm text-gray-500 flex items-center gap-1 mt-1">
            <MapPinIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </p>
          {isNdisCompliant && (
            <p className="font-poppins text-sm text-green-600 mt-1">
              
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="mb-3">
        <p
          ref={bioRef}
          className={`font-poppins text-sm text-gray-600 ${!isExpanded ? 'line-clamp-3' : ''}`}
        >
          {bio}
        </p>
        {(isClamped || isExpanded) && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="font-poppins text-xs font-medium mt-1 hover:underline"
            style={{ color: BRAND_COLORS.PRIMARY }}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Skills Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {skills.slice(0, 4).map((skill, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-gray-100 text-gray-700 font-poppins text-xs rounded-full"
          >
            {skill}
          </span>
        ))}
        {skills.length > 4 && (
          <span className="px-3 py-1 bg-gray-100 text-gray-500 font-poppins text-xs rounded-full">
            +{skills.length - 4} more
          </span>
        )}
      </div>

    </div>
  )
}
