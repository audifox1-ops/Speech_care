import { useState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import type { SmsTemplate, SmsTemplateInsert } from "@/types/sms"

interface TemplateFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: SmsTemplate | null
  onSave: (template: SmsTemplateInsert) => Promise<void>
}

const VARIABLES = [
  { label: "학생 이름", value: "{이름}" },
  { label: "학부모명", value: "{학부모명}" },
  { label: "다음 세션일", value: "{다음세션일}" },
]

export function TemplateFormModal({ open, onOpenChange, template, onSave }: TemplateFormModalProps) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (template) {
      setTitle(template.title)
      setBody(template.body)
    } else {
      setTitle("")
      setBody("")
    }
  }, [template, open])

  const handleInsertVariable = (variable: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const startPos = textarea.selectionStart
    const endPos = textarea.selectionEnd
    
    const newBody = body.substring(0, startPos) + variable + body.substring(endPos)
    setBody(newBody)
    
    // 포커스 복원 및 커서 위치 이동 (React 상태 업데이트 이후에 실행)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(startPos + variable.length, startPos + variable.length)
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await onSave({
        title,
        body
      })
      onOpenChange(false)
    } catch (error) {
      console.error("저장 실패:", error)
      alert("저장 중 오류가 발생했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{template ? "문자 템플릿 수정" : "새 문자 템플릿 추가"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">템플릿 이름 (제목)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 첫 등록 안내, 결제 안내 등"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">템플릿 본문</Label>
              <div className="flex gap-2">
                {VARIABLES.map(v => (
                  <Button
                    key={v.value}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => handleInsertVariable(v.value)}
                  >
                    + {v.label}
                  </Button>
                ))}
              </div>
            </div>
            <Textarea
              id="body"
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="문자 본문을 입력하세요. 우측 상단의 변수 버튼을 누르면 발송 시 자동으로 정보가 변경됩니다."
              className="min-h-[200px]"
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              * 변수(예: {'{이름}'})는 나중에 실제로 문자를 발송할 때 선택한 학생의 정보로 교체됩니다.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isSaving || !title || !body}>
              {isSaving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
