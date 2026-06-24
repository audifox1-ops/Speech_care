import { useState, useEffect } from "react"
import { Send, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { Student } from "@/types/student"
import { useSmsTemplates } from "@/hooks/useSmsTemplates"
import { getSmsProvider } from "@/lib/sms"
import type { SmsRecipient } from "@/lib/sms/SmsProvider"

interface SmsSendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedStudents: Student[]
  onSuccess: () => void
}

export function SmsSendModal({ open, onOpenChange, selectedStudents, onSuccess }: SmsSendModalProps) {
  const { templates } = useSmsTemplates()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [body, setBody] = useState("")
  const [isSending, setIsSending] = useState(false)

  // 번호 유효성 검사
  const isValidPhone = (phone: string | null) => {
    if (!phone) return false
    return /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/.test(phone)
  }

  const validRecipients = selectedStudents.filter(s => isValidPhone(s.parent_phone))
  const invalidRecipients = selectedStudents.filter(s => !isValidPhone(s.parent_phone))

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId)
      if (template) setBody(template.body)
    }
  }, [selectedTemplateId, templates])

  useEffect(() => {
    if (!open) {
      setBody("")
      setSelectedTemplateId("")
    }
  }, [open])

  // 첫 번째 유효 수신자로 미리보기 텍스트 생성
  const previewText = () => {
    if (!body || validRecipients.length === 0) return body
    const first = validRecipients[0]
    return body
      .replace(/{이름}/g, first.name)
      .replace(/{학부모명}/g, first.parent_name || '학부모')
      .replace(/{다음세션일}/g, '00월 00일 00:00') // MOCK 데이터
  }

  const handleSend = async () => {
    if (validRecipients.length === 0 || !body) return
    setIsSending(true)

    try {
      const provider = getSmsProvider()
      const recipients: SmsRecipient[] = validRecipients.map(s => ({
        studentId: s.id,
        name: s.name,
        phone: s.parent_phone!,
        parentName: s.parent_name || '학부모'
      }))

      // 실제 발송 시에는 각 사람마다 변수가 다르게 치환되어야 하므로
      // 여기서는 대표 본문을 보내고, Provider가 각자 치환하거나 (또는 각자 send 호출)
      // MOCK이므로 일단 단일 본문으로 넘깁니다. (실무에서는 개인화 발송 로직 추가 필요)
      const result = await provider.send(recipients, body)

      if (result.success) {
        alert("발송(MOCK)이 완료되었습니다.")
        onSuccess()
        onOpenChange(false)
      } else {
        alert("발송 실패: " + result.errorDetail)
      }
    } catch (error) {
      console.error(error)
      alert("발송 중 에러가 발생했습니다.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>학부모 단체 문자 발송</DialogTitle>
          <DialogDescription>
            선택된 학생의 학부모 연락처로 문자를 발송합니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* 수신자 정보 요약 */}
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">총 발송 대상</span>
              <span className="text-primary font-bold">{validRecipients.length}명</span>
            </div>
            {invalidRecipients.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  연락처가 없거나 형식이 올바르지 않은 학생 {invalidRecipients.length}명은 발송에서 제외됩니다.<br/>
                  <span className="text-xs">({invalidRecipients.map(s => s.name).join(', ')})</span>
                </p>
              </div>
            )}
          </div>

          {/* 템플릿 선택 */}
          <div className="space-y-2">
            <Label>템플릿 불러오기</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="템플릿을 선택하거나 직접 입력하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">직접 입력 (사용 안 함)</SelectItem>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 본문 입력 및 미리보기 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>문자 본문</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="발송할 내용을 입력하세요. {이름}, {학부모명} 변수를 사용할 수 있습니다."
                className="min-h-[200px]"
              />
            </div>
            <div className="space-y-2">
              <Label>미리보기 (첫 번째 수신자 기준)</Label>
              <div className="w-full min-h-[200px] border rounded-md p-3 bg-slate-50 dark:bg-slate-900 text-sm whitespace-pre-wrap text-muted-foreground">
                {previewText() || '입력된 내용이 없습니다.'}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isSending || validRecipients.length === 0 || !body}
          >
            <Send className="w-4 h-4 mr-2" />
            {isSending ? "발송 중..." : "발송하기 (MOCK)"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
