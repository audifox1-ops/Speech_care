export interface SmsTemplate {
  id: string
  title: string
  body: string
  created_at: string
  updated_at: string
}

export type SmsTemplateInsert = Omit<SmsTemplate, 'id' | 'created_at' | 'updated_at'>
export type SmsTemplateUpdate = Partial<SmsTemplateInsert>

export interface SmsLog {
  id: string
  recipients: Array<{ studentId: string; name: string; phone: string }>
  body: string
  status: 'success' | 'failed' | 'partial'
  provider: string
  error_detail: string | null
  sent_at: string
}
