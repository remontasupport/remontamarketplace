/**
 * Image Cropping Utilities
 * Shared utilities for cropping images used across the application
 */

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Creates a cropped image from the source image and crop area
 * @param imageSrc - Source image URL or data URL
 * @param pixelCrop - Crop area in pixels
 * @param outputFormat - Output image format (default: 'image/jpeg')
 * @param quality - Image quality 0-1 (default: 0.95)
 * @returns Promise resolving to cropped image URL (blob URL)
 */
export const createCroppedImage = async (
  imageSrc: string,
  pixelCrop: CropArea,
  outputFormat: string = 'image/jpeg',
  quality: number = 0.95
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
      }, outputFormat, quality)
    }

    image.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    image.src = imageSrc
  })
}

/**
 * Converts a blob URL to a File object
 * @param blobUrl - Blob URL to convert
 * @param fileName - Name for the file
 * @returns Promise resolving to File object
 */
export const blobUrlToFile = async (
  blobUrl: string,
  fileName: string = 'cropped-image.jpg'
): Promise<File> => {
  const response = await fetch(blobUrl)
  const blob = await response.blob()
  return new File([blob], fileName, { type: blob.type })
}
