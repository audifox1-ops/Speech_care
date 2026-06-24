import { useState, useEffect } from "react"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import { FileDown, Printer, FileArchive, Loader2 } from "lucide-react"
import { format } from "date-fns"

import { useStudents } from "@/hooks/useStudents"
import { useDocTemplates } from "@/hooks/useDocTemplates"
import { supabase } from "@/lib/supabase"
import type { Student } from "@/types/student"
import type { DocTemplate } from "@/types/document"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export function DocGenerate() {
  const { students, loading: studentsLoading } = useStudents()
  const { templates, loading: templatesLoading, downloadTemplateBlob } = useDocTemplates()

  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null)
  const [recentSessionContent, setRecentSessionContent] = useState<string>("")
  
  const [isGenerating, setIsGenerating] = useState(false)

  // 선택된 학생 및 템플릿 갱신
  useEffect(() => {
    const student = students.find(s => s.id === selectedStudentId) || null
    setSelectedStudent(student)

    if (student) {
      // 최근 세션 가져오기
      const fetchRecentSession = async () => {
        const { data } = await supabase
          .from('sessions')
          .select('content')
          .eq('student_id', student.id)
          .order('session_date', { ascending: false })
          .limit(1)
          .single()
        
        if (data) {
          setRecentSessionContent(data.content || "")
        } else {
          setRecentSessionContent("")
        }
      }
      fetchRecentSession()
    } else {
      setRecentSessionContent("")
    }
  }, [selectedStudentId, students])

  useEffect(() => {
    setSelectedTemplate(templates.find(t => t.id === selectedTemplateId) || null)
  }, [selectedTemplateId, templates])

  // 병합될 데이터 객체 생성
  const getMergeData = () => {
    if (!selectedStudent) return {}
    
    return {
      이름: selectedStudent.name || "",
      생년월일: selectedStudent.birth_date || "",
      연락처: selectedStudent.phone || "",
      학부모명: selectedStudent.parent_name || "",
      진단결과: selectedStudent.diagnosis || "",
      치료목표: selectedStudent.goals || "",
      최근치료내용: recentSessionContent || "",
      현재날짜: format(new Date(), 'yyyy년 MM월 dd일'),
    }
  }

  const mergeData = getMergeData()

  const handleGenerateWord = async () => {
    if (!selectedTemplate || !selectedStudent) return
    setIsGenerating(true)

    try {
      const blob = await downloadTemplateBlob(selectedTemplate.file_path)
      const arrayBuffer = await blob.arrayBuffer()

      const zip = new PizZip(arrayBuffer)
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => "" // 값이 비어있으면 빈 문자열로 처리 (규칙)
      })

      doc.render(mergeData)

      const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })

      const url = URL.createObjectURL(out as Blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `[${selectedTemplate.name}]_${selectedStudent.name}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error("문서 생성 중 오류 발생:", error)
      alert("문서 생성 중 오류가 발생했습니다.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* 헤더: print 시 숨김 */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileArchive className="h-8 w-8" /> 문서 자동 생성
          </h2>
          <p className="text-muted-foreground mt-1">
            학생 데이터와 템플릿을 선택하여 즉시 서류를 만드세요.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 print:hidden">
        {/* 선택 영역 */}
        <Card>
          <CardHeader>
            <CardTitle>문서 생성 설정</CardTitle>
            <CardDescription>발급할 학생과 양식을 선택하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>학생 선택</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder={studentsLoading ? "불러오는 중..." : "학생을 선택하세요"} />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.status})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>문서 템플릿 선택</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder={templatesLoading ? "불러오는 중..." : "템플릿을 선택하세요"} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 flex gap-2">
              <Button 
                onClick={handleGenerateWord} 
                disabled={!selectedStudent || !selectedTemplate || isGenerating}
                className="flex-1"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                워드(DOCX) 다운로드
              </Button>
              <Button 
                variant="outline"
                onClick={handlePrint} 
                disabled={!selectedStudent || !selectedTemplate}
              >
                <Printer className="w-4 h-4 mr-2" />
                인쇄/PDF 저장
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 데이터 요약 영역 */}
        <Card>
          <CardHeader>
            <CardTitle>병합될 데이터 요약</CardTitle>
            <CardDescription>선택된 템플릿 내의 변수 자리에 아래 데이터가 입력됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedStudent ? (
              <div className="text-center py-8 text-muted-foreground">
                학생을 선택해주세요.
              </div>
            ) : (
              <div className="text-sm bg-slate-50 dark:bg-slate-900 p-4 rounded border space-y-2">
                {Object.entries(mergeData).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row gap-1 sm:gap-4 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                    <span className="font-semibold text-primary w-24 shrink-0">{`{${key}}`}</span>
                    <span className="text-muted-foreground break-all">{value as string || "(비어있음)"}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 인쇄 전용 영역: 평소에는 숨기고 print 시에만 표시 */}
      <div className="hidden print:block space-y-4">
        {selectedStudent && selectedTemplate ? (
          <div className="border p-8 bg-white text-black min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-center">{selectedTemplate.name}</h1>
            <div className="space-y-4 text-lg">
              <p><b>이름:</b> {mergeData.이름}</p>
              <p><b>생년월일:</b> {mergeData.생년월일}</p>
              <p><b>학부모명:</b> {mergeData.학부모명}</p>
              <p><b>진단결과:</b> {mergeData.진단결과}</p>
              <p><b>치료목표:</b> {mergeData.치료목표}</p>
              <p><b>최근치료내용:</b> {mergeData.최근치료내용}</p>
              <div className="mt-12 text-right">
                <p>작성일: {mergeData.현재날짜}</p>
              </div>
              <p className="mt-12 text-center text-sm text-gray-500">
                * 이 인쇄물은 브라우저 간편 인쇄용이며, 원본 서식을 완벽하게 유지하려면 '워드(DOCX) 다운로드'를 사용하세요.
              </p>
            </div>
          </div>
        ) : (
          <div>인쇄할 내용이 없습니다. 학생과 템플릿을 선택해주세요.</div>
        )}
      </div>
    </div>
  )
}
