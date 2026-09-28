/**
 * Cloudinary upload utilities.
 * Uses unsigned uploads directly from the browser — no server round-trip needed.
 * Credentials are read from public env vars set in .env.local:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads a single File to Cloudinary and returns the `secure_url` string.
 * Throws a descriptive error if env vars are missing or the upload fails.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary env vars are not set. " +
        "Ensure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and " +
        "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET are defined in .env.local."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Cloudinary upload failed (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as { secure_url?: string };

  if (!data.secure_url) {
    throw new Error(
      "Cloudinary response did not include a secure_url. " +
        "Check your upload preset configuration."
    );
  }

  return data.secure_url;
}

/**
 * Uploads multiple files to Cloudinary in parallel.
 * Returns an array of `secure_url` strings in the same order as the input files.
 */
export async function uploadMultipleToCloudinary(
  files: File[]
): Promise<string[]> {
  return Promise.all(files.map((file) => uploadToCloudinary(file)));
}
