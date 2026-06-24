import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Student, StudentInsert, StudentUpdate } from '@/types/student'

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStudents(data as Student[])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const addStudent = async (student: StudentInsert) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([student])
        .select()
        .single()

      if (error) throw error
      setStudents(prev => [data as Student, ...prev])
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const updateStudent = async (id: string, updates: StudentUpdate) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setStudents(prev => prev.map(s => s.id === id ? data as Student : s))
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const deleteStudent = async (id: string) => {
    try {
      // Soft delete
      const { error } = await supabase
        .from('students')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      setStudents(prev => prev.filter(s => s.id !== id))
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  return {
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    refreshStudents: fetchStudents
  }
}
