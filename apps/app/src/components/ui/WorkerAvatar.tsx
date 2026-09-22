'use client'

import Image from 'next/image'
import { useState } from 'react'

interface WorkerAvatarProps {
  photo: string | null | undefined
  firstName: string
  lastName: string
  /** Pixel size applied to both width and height. Default: 40 */
  size?: number
  /** Extra classes applied to both the Image and the fallback container */
  className?: string
  /** Mark true only for the first visible avatar in a list (prevents LCP delay) */
  priority?: boolean
}

export default function WorkerAvatar({
  photo,
  firstName,
  lastName,
  size = 40,
  className = '',
  priority = false,
}: WorkerAvatarProps) {
  const [imgError, setImgError] = useState(false)

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()

  if (!photo || imgError) {
    return (
      <div
        className={`rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <span
          className="text-gray-500 font-semibold select-none"
          style={{ fontSize: Math.round(size * 0.35) }}
        >
          {initials}
        </span>
      </div>
    )
  }

  // Container approach: `fill` inside a sized+clipped div guarantees a perfect circle.
  // Using width/height props alone only sets intrinsic dimensions, not CSS layout size.
  return (
    <div
      className={`relative rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={photo}
        alt={`${firstName} ${lastName}`}
        fill
        sizes={`${size}px`}
        className="object-cover"
        priority={priority}
        onError={() => setImgError(true)}
      />
    </div>
  )
}
