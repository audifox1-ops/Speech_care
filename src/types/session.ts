export interface Session {
  id: string
  student_id: string
  session_date: string
  content: string | null
  progress: string | null
  score: number | null
  next_goal: string | null
  created_at: string
}

export type SessionInsert = Omit<Session, 'id' | 'created_at'>
export type SessionUpdate = Partial<SessionInsert>
