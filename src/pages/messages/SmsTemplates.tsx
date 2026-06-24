import { useState } from "react"
import { Plus, MessageSquare, Edit2, Trash2 } from "lucide-react"

import { useSmsTemplates } from "@/hooks/useSmsTemplates"
import { TemplateFormModal } from "@/components/messages/TemplateFormModal"
import type { SmsTemplate, SmsTemplateInsert } from "@/types/sms"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SmsTemplates() {
  const { templates, loading, addTemplate, updateTemplate, deleteTemplate } = useSmsTemplates()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null)

  const handleOpenNewModal = () => {
    setEditingTemplate(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (template: SmsTemplate) => {
    setEditingTemplate(template)
    setIsModalOpen(true)
  }

  const handleDeleteClick = async (id: string) => {
    if (window.confirm("정말로 이 템플릿을 삭제하시겠습니까?")) {
      await deleteTemplate(id)
    }
  }

  const handleSaveTemplate = async (templateData: SmsTemplateInsert) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, templateData)
    } else {
      await addTemplate(templateData)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-8 w-8" /> 문자 템플릿 관리
          </h2>
          <p className="text-muted-foreground mt-1">
            자주 사용하는 문자 메시지 내용을 템플릿으로 저장해두고 편리하게 발송하세요.
          </p>
        </div>
        <Button onClick={handleOpenNewModal}>
          <Plus className="mr-2 h-4 w-4" />
          새 템플릿 추가
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">데이터를 불러오는 중입니다...</div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed bg-slate-50 dark:bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800 mb-4">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium mb-1">등록된 템플릿이 없습니다.</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              상단의 '새 템플릿 추가' 버튼을 눌러 첫 문자 템플릿을 만들어보세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(template => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg">{template.title}</CardTitle>
                <CardDescription className="text-xs">
                  작성일: {new Date(template.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 py-4">
                <p className="text-sm whitespace-pre-wrap text-muted-foreground line-clamp-6">
                  {template.body}
                </p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEditClick(template)}>
                  <Edit2 className="h-4 w-4 mr-2" /> 수정
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteClick(template.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> 삭제
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TemplateFormModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  )
}
