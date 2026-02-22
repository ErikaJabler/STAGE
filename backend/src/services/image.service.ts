/** Image upload service — validates and stores images in R2 */

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface UploadResult {
  key: string;
  url: string;
}

export const ImageService = {
  /**
   * Validate and upload an image to R2.
   * Returns the object key and public URL path.
   */
  async upload(
    bucket: R2Bucket,
    file: File,
    prefix = "events"
  ): Promise<UploadResult> {
    // Validate type
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new ImageValidationError(
        `Otillåten filtyp: ${file.type}. Tillåtna: JPEG, PNG, WebP.`
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      throw new ImageValidationError(
        `Filen är för stor (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: 5 MB.`
      );
    }

    // Generate unique key
    const ext = EXT_MAP[file.type] ?? "bin";
    const id = crypto.randomUUID();
    const key = `${prefix}/${id}.${ext}`;

    // Upload to R2
    await bucket.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    return {
      key,
      url: `/stage/api/images/${key}`,
    };
  },

  /**
   * Get an image from R2 by key.
   */
  async get(bucket: R2Bucket, key: string): Promise<R2ObjectBody | null> {
    return bucket.get(key);
  },

  /**
   * Delete an image from R2 by key.
   */
  async delete(bucket: R2Bucket, key: string): Promise<void> {
    await bucket.delete(key);
  },
};

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}
