import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, SessionInsert, SessionUpdate } from '@/types/session'

// 확장된 Session 타입 (학생 이름 포함)
export interface SessionWithStudent extends Session {
  student?: {
    name: string
  }
}

export function useAllSessions() {
  const [sessions, setSessions] = useState<SessionWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student:students(name)
        `)
        .order('session_date', { ascending: false }) // 최신순 정렬

      if (error) throw error
      setSessions(data as SessionWithStudent[])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const addSession = async (session: SessionInsert) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([session])
        .select(`
          *,
          student:students(name)
        `)
        .single()

      if (error) throw error
      setSessions(prev => {
        const newSessions = [data as SessionWithStudent, ...prev]
        return newSessions.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
      })
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const updateSession = async (id: string, updates: SessionUpdate) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          student:students(name)
        `)
        .single()

      if (error) throw error
      setSessions(prev => {
        const newSessions = prev.map(s => s.id === id ? data as SessionWithStudent : s)
        return newSessions.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
      })
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const deleteSession = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSessions(prev => prev.filter(s => s.id !== id))
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  return {
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
    refreshSessions: fetchSessions
  }
}
