import { supabase } from '../lib/supabase'
import type {
  GymDailyPhotoRecord,
  UpsertGymDailyPhotoRecord,
} from '../models/gymPhoto'

const bucketName = 'gym-photos'
const selectColumns = 'id, photo_date, image_path, image_url, created_at, updated_at'

export async function fetchGymDailyPhotoByDate(
  photoDate: string,
): Promise<GymDailyPhotoRecord | null> {
  const { data, error } = await supabase
    .from('gym_daily_photos')
    .select(selectColumns)
    .eq('photo_date', photoDate)
    .maybeSingle()

  if (error) {
    throw new Error(`No se pudo leer la foto de Gym: ${error.message}`)
  }

  return data
}

export async function uploadGymDailyPhoto({
  file,
  path,
}: {
  file: File
  path: string
}) {
  const { error } = await supabase.storage.from(bucketName).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: true,
  })

  if (error) {
    throw new Error(`No se pudo subir la foto de Gym: ${error.message}`)
  }
}

export function getGymDailyPhotoPublicUrl(path: string) {
  return supabase.storage.from(bucketName).getPublicUrl(path).data.publicUrl
}

export async function upsertGymDailyPhoto(
  photo: UpsertGymDailyPhotoRecord,
): Promise<GymDailyPhotoRecord> {
  const { data, error } = await supabase
    .from('gym_daily_photos')
    .upsert(photo, { onConflict: 'photo_date' })
    .select(selectColumns)
    .single()

  if (error) {
    throw new Error(`No se pudo guardar la foto de Gym: ${error.message}`)
  }

  return data
}
