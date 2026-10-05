// The sniffer moved to @remonta/schemas (U3) so the sign-up wizard and the api share
// one implementation. This re-export keeps the module's imports stable until the
// multipart entry goes (clean-up PR); new code imports the package directly.
export { ACCEPTED_IMAGE_TYPES, detectImageType, extensionOf, IMAGE_HEADER_BYTES, isAcceptedImageType, isHeicHeader, type AcceptedImageType, type ImageType } from '@remonta/schemas/image-type'
