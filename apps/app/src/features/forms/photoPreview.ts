// The preview shown for a photo that has already been staged (api mode).
//
// In api mode the form holds only the staged upload's id -- the api returns an id,
// never a URL, so there is nothing to display from the value itself. The cropped
// image used to live only inside the field component, so leaving the step
// (Previous, then Next) or reloading the page lost it, and the field could only
// say "already uploaded". Instead, a small thumbnail of what was uploaded is kept
// in the form values under a companion key: it survives the step remount, it goes
// into the on-device draft (a few KB, so a reload shows it too), and it never
// reaches the request -- the engine builds the body from declared fields only.
import { fitWithin } from "./adapters/shrinkImage";

/** Longest edge of the stored thumbnail. 160 px as JPEG is ~5-10 KB base64. */
export const THUMBNAIL_EDGE_PX = 160;
export const THUMBNAIL_QUALITY = 0.7;

/** The form-values key holding a photo field's preview. Not a field: never validated, never sent. */
export function previewKeyOf(fieldName: string): string {
  return `${fieldName}__preview`;
}

/** A data URL thumbnail of the image, or null when the browser cannot decode it (e.g. HEIC outside Safari). */
export async function thumbnailDataUrl(file: File, edge = THUMBNAIL_EDGE_PX): Promise<string | null> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return null;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, edge);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", THUMBNAIL_QUALITY);
  } catch {
    return null;
  } finally {
    bitmap.close();
  }
}
