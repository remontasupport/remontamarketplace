// Vercel Blob Storage utilities
import { put, del } from '@vercel/blob'

/**
 * Upload a file to Vercel Blob from a buffer
 * @param buffer - File buffer
 * @param fileName - File name (will be used as pathname)
 * @param contentType - MIME type
 * @returns Public URL of uploaded file
 */
export async function uploadToBlob(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const pathname = `contractors/${fileName}`

  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType,
  })

  return blob.url
}

/**
 * Upload file from URL (download then upload to Blob)
 * @param url - Source URL to download from
 * @param fileName - Destination file name
 * @param accessToken - Optional authorization token
 * @returns Public URL of uploaded file
 */
export async function uploadFromUrl(
  url: string,
  fileName: string,
  accessToken?: string
): Promise<string> {
  const headers: Record<string, string> = {}
  if (accessToken) {
    headers['Authorization'] = `Zoho-oauthtoken ${accessToken}`
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (buffer.length === 0) {
    throw new Error('Downloaded file is empty')
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream'

  return uploadToBlob(buffer, fileName, contentType)
}

/**
 * Delete a file from Vercel Blob
 * @param url - Full URL of the blob to delete
 */
export async function deleteFromBlob(url: string): Promise<void> {
  await del(url)
}

/**
 * Generate a unique file name
 * @param originalName - Original file name
 * @param contractorId - Contractor ID
 * @param type - File type (e.g., 'profile', 'document')
 * @returns Unique file name
 */
export function generateFileName(
  originalName: string,
  contractorId: string,
  type: string = 'file'
): string {
  const timestamp = Date.now()
  const extension = originalName.split('.').pop() || 'jpg'
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${contractorId}-${type}-${timestamp}-${sanitized}`
}

/**
 * Upload worker photo to Vercel Blob
 * Supports both contractors and workers folders
 * @param buffer - File buffer
 * @param fileName - File name
 * @param contentType - MIME type
 * @param folder - Folder name ('workers' or 'contractors')
 * @returns Public URL of uploaded file
 */
export async function uploadWorkerPhoto(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folder: 'workers' | 'contractors' = 'workers'
): Promise<string> {
  const pathname = `${folder}/${fileName}`

  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType,
  })

  return blob.url
}

/**
 * Validate image file for worker photos
 * @param file - File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateImageFile(file: File): string | null {
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return `Invalid file type. Only JPG, PNG, and WebP images are allowed.`;
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds 10MB limit.`;
  }

  return null;
}

