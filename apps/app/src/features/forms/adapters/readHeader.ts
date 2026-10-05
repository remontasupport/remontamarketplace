// The first bytes of a picked file: what the engine classifies (JPEG, PNG, WebP, HEIC).
import { IMAGE_HEADER_BYTES } from "@remonta/schemas/image-type";

export async function readHeader(file: Blob, bytes = IMAGE_HEADER_BYTES): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, bytes).arrayBuffer());
}
