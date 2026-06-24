import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { SmsTemplate, SmsTemplateInsert, SmsTemplateUpdate } from '@/types/sms'

export function useSmsTemplates() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data as SmsTemplate[])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const addTemplate = async (template: SmsTemplateInsert) => {
    try {
      const { data, error } = await supabase
        .from('sms_templates')
        .insert([template])
        .select()
        .single()

      if (error) throw error
      setTemplates(prev => [data as SmsTemplate, ...prev])
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const updateTemplate = async (id: string, updates: SmsTemplateUpdate) => {
    try {
      const { data, error } = await supabase
        .from('sms_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setTemplates(prev => prev.map(t => t.id === id ? data as SmsTemplate : t))
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sms_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTemplates(prev => prev.filter(t => t.id !== id))
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  return {
    templates,
    loading,
    error,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    refreshTemplates: fetchTemplates
  }
}
