import { useState } from "react"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import { Download, FileText, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { useDocTemplates } from "@/hooks/useDocTemplates"
import type { DocTemplate } from "@/types/document"

interface DocPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: DocTemplate | null
}

export function DocPreviewModal({ open, onOpenChange, template }: DocPreviewModalProps) {
  const { downloadTemplateBlob } = useDocTemplates()
  const [isGenerating, setIsGenerating] = useState(false)

  // 미리보기(테스트)용 가짜 학생 데이터
  const mockStudentData = {
    이름: "홍길동",
    생년월일: "2015-05-05",
    연락처: "010-1234-5678",
    학부모명: "홍아빠",
    진단결과: "언어발달지연",
    치료목표: "수용언어 1년 수준 향상",
    현재날짜: new Date().toLocaleDateString(),
  }

  const handleGenerate = async () => {
    if (!template) return
    setIsGenerating(true)

    try {
      // 1. Supabase Storage에서 원본 워드 파일 다운로드
      const blob = await downloadTemplateBlob(template.file_path)
      const arrayBuffer = await blob.arrayBuffer()

      // 2. PizZip을 통해 압축 해제 및 Docxtemplater 로드
      const zip = new PizZip(arrayBuffer)
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      })

      // 3. 변수 치환
      doc.render(mockStudentData)

      // 4. 변환된 문서를 다시 Blob으로 생성
      const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })

      // 5. 다운로드 트리거
      const url = URL.createObjectURL(out as Blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `(미리보기)${template.name}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert("미리보기 문서가 생성되어 다운로드되었습니다.")
      onOpenChange(false)
    } catch (error) {
      console.error("문서 생성 중 오류 발생:", error)
      alert("문서 생성 중 오류가 발생했습니다. (자세한 내용은 콘솔 확인)")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            문서 템플릿 미리보기
          </DialogTitle>
          <DialogDescription>
            선택한 템플릿에 <b>가짜 학생 데이터(테스트용)</b>를 적용하여 변환된 워드 파일을 다운로드합니다.
          </DialogDescription>
        </DialogHeader>

        {template && (
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
              <h4 className="font-medium text-sm mb-2 text-muted-foreground">선택된 템플릿</h4>
              <p className="font-semibold">{template.name}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">적용될 테스트 데이터</h4>
              <div className="text-sm bg-muted/50 p-3 rounded border grid grid-cols-2 gap-2">
                {Object.entries(mockStudentData).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-semibold text-primary">{`{${key}}`}: </span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * 템플릿 워드 파일 내에 위 보라색 변수(예: {'{이름}'})가 포함되어 있어야 이 값으로 변환됩니다.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || !template}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                테스트 문서 다운로드
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
