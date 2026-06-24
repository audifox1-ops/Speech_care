export type StudentStatus = '재원' | '휴원' | '종결'

export interface Student {
  id: string
  name: string
  birth_date: string | null
  phone: string | null
  parent_name: string | null
  parent_phone: string | null
  diagnosis: string | null
  therapy_history: string | null
  goals: string | null
  notes: string | null
  status: StudentStatus
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type StudentInsert = Omit<Student, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
export type StudentUpdate = Partial<StudentInsert>
