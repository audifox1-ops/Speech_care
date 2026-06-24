import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, SessionInsert, SessionUpdate } from '@/types/session'

export function useSessions(studentId: string | undefined) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    if (!studentId) {
      setSessions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('student_id', studentId)
        .order('session_date', { ascending: false }) // 최신순 정렬

      if (error) throw error
      setSessions(data as Session[])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const addSession = async (session: SessionInsert) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([session])
        .select()
        .single()

      if (error) throw error
      // 목록 맨 앞에 추가 (최신순이므로 날짜 비교가 더 정확하지만 임시로)
      setSessions(prev => {
        const newSessions = [data as Session, ...prev]
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
        .select()
        .single()

      if (error) throw error
      setSessions(prev => {
        const newSessions = prev.map(s => s.id === id ? data as Session : s)
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
