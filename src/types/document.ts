export interface DocTemplate {
  id: string
  name: string
  file_path: string
  variables: string[]
  created_at: string
}

export type DocTemplateInsert = Omit<DocTemplate, 'id' | 'created_at'>
