// Post photos: the limits the picker and the server share. Client-safe.

/** Photos per post. */
export const MAX_IMAGES = 4;
/** Per photo: big phone photos fit, raw camera files don't. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
/** Accepted types, and the file extension each is stored with. */
export const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;
export type ImageType = keyof typeof IMAGE_TYPES;

export const isImageType = (type: string): type is ImageType =>
  type in IMAGE_TYPES;
