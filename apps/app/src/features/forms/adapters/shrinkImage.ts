// Shrinks a photo on the device before upload (S1 step 9): a 5 MB phone photo
// becomes a few hundred KB, which is what makes the upload survive a weak mobile
// connection. Anything the browser cannot decode (e.g. HEIC outside Safari) is
// uploaded as it is -- the server accepts it either way.

export const MAX_EDGE_PX = 1600;
export const JPEG_QUALITY = 0.85;

/** Target size keeping the aspect ratio; never enlarges. */
export function fitWithin(width: number, height: number, maxEdge = MAX_EDGE_PX): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export async function shrinkImage(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // not decodable here
  }
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    if (width === bitmap.width && height === bitmap.height && file.size < 600 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
