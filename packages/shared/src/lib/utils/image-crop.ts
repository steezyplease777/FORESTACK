export type CropArea = {
  x: number
  y: number
  width: number
  height: number
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.crossOrigin = 'anonymous'
    image.src = url
  })
}

/**
 * Client-side crop + reencode helper. Draws the source image's crop region
 * into a square canvas at `outputSize` and returns a WebP blob at the given
 * quality. Shared by the profile-picture avatar flow and the workspace /
 * company logo uploads so we keep one canonical encoder.
 */
export async function cropAndConvertToWebp(
  imageSrc: string,
  crop: CropArea,
  outputSize = 1080,
  quality = 0.9,
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to convert to WebP'))
      },
      'image/webp',
      quality,
    )
  })
}
