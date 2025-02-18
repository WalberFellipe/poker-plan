export type Room = {
  id: string
  name: string
  created_at: string
  updated_at: string
  status: 'voting' | 'revealed' | 'finished'
}

export type Participant = {
  id: string
  room_id: string
  user_id: string
  name: string
  is_admin: boolean
  created_at: string
}

export type Vote = {
  id: string
  room_id: string
  participant_id: string
  value: string
  created_at: string
  updated_at: string
} 