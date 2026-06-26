import type { GymDailyPhotoRecord } from '../models/gymPhoto'
import {
  fetchGymDailyPhotoByDate,
  getGymDailyPhotoPublicUrl,
  uploadGymDailyPhoto,
  upsertGymDailyPhoto,
} from '../repositories/gymPhotoRepository'

const maxGymPhotoSize = 5 * 1024 * 1024

export async function loadGymDailyPhoto(photoDate: string) {
  const photo = await fetchGymDailyPhotoByDate(photoDate)

  if (!photo) return null

  return {
    ...photo,
    image_url: photo.image_url ?? getGymDailyPhotoPublicUrl(photo.image_path),
  }
}

export async function saveGymDailyPhoto({
  file,
  photoDate,
}: {
  file: File
  photoDate: string
}): Promise<GymDailyPhotoRecord> {
  validateGymPhoto(file)

  const imagePath = `${photoDate}.jpg`
  const updatedAt = new Date().toISOString()
  await uploadGymDailyPhoto({ file, path: imagePath })

  return upsertGymDailyPhoto({
    image_path: imagePath,
    image_url: `${getGymDailyPhotoPublicUrl(imagePath)}?v=${encodeURIComponent(updatedAt)}`,
    photo_date: photoDate,
    updated_at: updatedAt,
  })
}

function validateGymPhoto(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen.')
  }

  if (file.size > maxGymPhotoSize) {
    throw new Error('La imagen debe pesar 5 MB como maximo.')
  }
}
