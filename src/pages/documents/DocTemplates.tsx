import { useRef, useState } from "react"
import { FileText, Upload, Trash2, PlayCircle } from "lucide-react"

import { useDocTemplates } from "@/hooks/useDocTemplates"
import { DocPreviewModal } from "@/components/documents/DocPreviewModal"
import type { DocTemplate } from "@/types/document"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


export function DocTemplates() {
  const { templates, loading, uploadTemplate, deleteTemplate } = useDocTemplates()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isUploading, setIsUploading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.docx')) {
      alert('DOCX 워드 파일만 업로드 가능합니다.')
      return
    }

    const name = window.prompt("템플릿의 이름을 입력하세요:", file.name.replace('.docx', ''))
    if (!name) return

    setIsUploading(true)
    const success = await uploadTemplate(file, name, []) // 추후 변수 자동 추출 가능
    setIsUploading(false)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (success) {
      alert('템플릿이 성공적으로 업로드되었습니다.')
    } else {
      alert('업로드 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (id: string, filePath: string) => {
    if (window.confirm("정말로 이 템플릿을 삭제하시겠습니까?")) {
      await deleteTemplate(id, filePath)
    }
  }

  const handlePreviewClick = (template: DocTemplate) => {
    setSelectedTemplate(template)
    setIsPreviewOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" /> 행정 문서 템플릿
          </h2>
          <p className="text-muted-foreground mt-1">
            원장님이 가지고 계신 워드(DOCX) 파일을 올려두고, 클릭 한 번에 학생 데이터를 채워 넣으세요.
          </p>
        </div>
        <div>
          <input 
            type="file" 
            accept=".docx" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "업로드 중..." : "워드 파일 업로드"}
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">💡 템플릿 작성 팁</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
          <li>반드시 <b>.docx</b> 확장자의 워드 파일만 사용 가능합니다.</li>
          <li>문서 내에 자동으로 바뀌길 원하는 글자를 <b>{'{이름}'}</b>과 같이 중괄호로 감싸주세요.</li>
          <li>현재 사용 가능한 추천 변수: {'{이름}, {생년월일}, {연락처}, {학부모명}, {진단결과}, {치료목표}, {현재날짜}'}</li>
        </ul>
      </div>

      {loading && !isUploading ? (
        <div className="text-center py-12 text-muted-foreground">데이터를 불러오는 중입니다...</div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed bg-slate-50 dark:bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800 mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium mb-1">등록된 템플릿이 없습니다.</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              우측 상단의 버튼을 눌러 첫 번째 워드 문서 템플릿을 업로드해보세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(template => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                <CardTitle className="text-lg flex items-start justify-between">
                  <span className="truncate pr-2" title={template.name}>{template.name}</span>
                  <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                </CardTitle>
                <CardDescription className="text-xs">
                  등록일: {new Date(template.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 py-4">
                <p className="text-sm text-muted-foreground break-all">
                  경로: {template.file_path}
                </p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto flex justify-between gap-2 border-t mt-2 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-lg">
                <Button 
                  variant="default" 
                  className="w-full mt-2" 
                  onClick={() => handlePreviewClick(template)}
                >
                  <PlayCircle className="h-4 w-4 mr-2" /> 미리보기 테스트
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="mt-2 text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => handleDelete(template.id, template.file_path)}
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <DocPreviewModal 
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        template={selectedTemplate}
      />
    </div>
  )
}
