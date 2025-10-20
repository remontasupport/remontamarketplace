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
