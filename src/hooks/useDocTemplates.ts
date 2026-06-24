import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { DocTemplate } from '@/types/document'

export function useDocTemplates() {
  const [templates, setTemplates] = useState<DocTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('doc_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data as DocTemplate[])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const uploadTemplate = async (file: File, name: string, variables: string[]) => {
    try {
      setLoading(true)
      // 1. Storage에 업로드
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `templates/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('doc_templates')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. DB에 기록
      const { error: dbError } = await supabase
        .from('doc_templates')
        .insert([
          {
            name,
            file_path: filePath,
            variables,
          }
        ])

      if (dbError) throw dbError

      await fetchTemplates()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteTemplate = async (id: string, filePath: string) => {
    try {
      setLoading(true)
      // 1. Storage에서 삭제
      const { error: storageError } = await supabase.storage
        .from('doc_templates')
        .remove([filePath])

      if (storageError) throw storageError

      // 2. DB에서 삭제
      const { error: dbError } = await supabase
        .from('doc_templates')
        .delete()
        .eq('id', id)

      if (dbError) throw dbError

      setTemplates(templates.filter(t => t.id !== id))
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplateBlob = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('doc_templates')
      .download(filePath)

    if (error) throw error
    return data
  }

  return {
    templates,
    loading,
    error,
    uploadTemplate,
    deleteTemplate,
    downloadTemplateBlob,
    refreshTemplates: fetchTemplates
  }
}
