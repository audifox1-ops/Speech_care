import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { SmsLog } from '@/types/sms'

export function useSmsLogs() {
  const [logs, setLogs] = useState<SmsLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .order('sent_at', { ascending: false })

      if (error) throw error
      setLogs(data as SmsLog[])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return {
    logs,
    loading,
    error,
    refreshLogs: fetchLogs
  }
}
