export type GymDailyPhotoRecord = {
  created_at?: string
  id: string
  image_path: string
  image_url: string | null
  photo_date: string
  updated_at?: string
}

export type UpsertGymDailyPhotoRecord = {
  image_path: string
  image_url: string | null
  photo_date: string
  updated_at: string
}
