'use client'

import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageCropModalProps {
  imageUrl: string
  onClose: () => void
  onCropComplete: (croppedImageUrl: string) => void
}

/**
 * Creates a cropped image from the source image and crop area
 * @param imageSrc - Source image URL
 * @param pixelCrop - Crop area in pixels
 * @returns Promise resolving to cropped image URL
 */
const createCroppedImage = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Set canvas size to the crop area
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height

      // Draw the cropped image
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )

      // Convert canvas to blob and create object URL
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        const croppedImageUrl = URL.createObjectURL(blob)
        resolve(croppedImageUrl)
      }, 'image/jpeg', 0.95)
    }

    image.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    image.src = imageSrc
  })
}

export default function ImageCropModal({
  imageUrl,
  onClose,
  onCropComplete,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  // Handle crop completion
  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  // Handle save button click
  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) return

    try {
      setIsCropping(true)
      const croppedImageUrl = await createCroppedImage(imageUrl, croppedAreaPixels)
      onCropComplete(croppedImageUrl)
      onClose()
    } catch (error) {
   
      alert('Failed to crop image. Please try again.')
    } finally {
      setIsCropping(false)
    }
  }, [croppedAreaPixels, imageUrl, onCropComplete, onClose])

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter') {
        handleSave()
      }
    },
    [onClose, handleSave]
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="crop-modal-title" className="text-xl font-semibold text-gray-900">
            Crop Profile Photo
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close crop modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative h-96 bg-gray-100">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={setZoom}
          />
        </div>

        {/* Zoom Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <ZoomOut className="w-5 h-5 text-gray-400" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              aria-label="Zoom slider"
            />
            <ZoomIn className="w-5 h-5 text-gray-400" />
          </div>
          <p className="mt-2 text-sm text-gray-500 text-center">
            Drag to reposition • Scroll or use slider to zoom
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 p-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isCropping}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isCropping}
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCropping ? 'Cropping...' : 'Save'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #4f46e5;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #4f46e5;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-webkit-slider-thumb:hover {
          background: #4338ca;
        }

        .slider::-moz-range-thumb:hover {
          background: #4338ca;
        }
      `}</style>
    </div>
  )
}
