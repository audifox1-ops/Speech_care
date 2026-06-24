import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, User, Calendar as CalendarIcon, FileText, Plus, Trash2, Edit2 } from "lucide-react"
import { format } from "date-fns"

import { supabase } from "@/lib/supabase"
import type { Student } from "@/types/student"
import type { Session, SessionInsert } from "@/types/session"
import { useSessions } from "@/hooks/useSessions"
import { SessionFormModal } from "@/components/sessions/SessionFormModal"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function StudentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  // 세션 관련 훅
  const { sessions, loading: sessionsLoading, addSession, updateSession, deleteSession } = useSessions(id)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)

  useEffect(() => {
    const fetchStudent = async () => {
      if (!id) return
      setLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()
      
      if (!error && data) {
        setStudent(data as Student)
      }
      setLoading(false)
    }

    fetchStudent()
  }, [id])

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">불러오는 중...</div>
  }

  if (!student) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/students')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> 목록으로 돌아가기
        </Button>
        <div className="p-8 text-center text-destructive">학생 정보를 찾을 수 없습니다.</div>
      </div>
    )
  }

  const handleOpenNewSession = () => {
    setEditingSession(null)
    setIsModalOpen(true)
  }

  const handleEditSession = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation()
    setEditingSession(session)
    setIsModalOpen(true)
  }

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (window.confirm("정말로 이 세션 기록을 삭제하시겠습니까? (복구할 수 없습니다)")) {
      await deleteSession(sessionId)
    }
  }

  const handleSaveSession = async (sessionData: SessionInsert) => {
    if (editingSession) {
      await updateSession(editingSession.id, sessionData)
    } else {
      await addSession(sessionData)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/students')} className="-ml-4 text-muted-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> 학생 목록
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {student.name}
            <span className={`text-sm px-2.5 py-0.5 rounded-full font-semibold ${
                student.status === '재원' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                student.status === '휴원' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {student.status}
            </span>
          </h2>
          <p className="text-muted-foreground mt-1">학생 상세 정보 및 치료 이력 관리</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 핵심 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> 기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-1 border-b pb-3">
              <span className="text-muted-foreground font-medium">생년월일</span>
              <span className="col-span-2">{student.birth_date || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 border-b pb-3">
              <span className="text-muted-foreground font-medium">학생 연락처</span>
              <span className="col-span-2">{student.phone || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 border-b pb-3">
              <span className="text-muted-foreground font-medium">보호자 성함</span>
              <span className="col-span-2">{student.parent_name || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="text-muted-foreground font-medium">보호자 연락처</span>
              <span className="col-span-2">{student.parent_phone || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* 치료 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> 진단 및 치료 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 border-b pb-3">
              <span className="text-muted-foreground font-medium block">진단 결과</span>
              <p className="text-sm">{student.diagnosis || '입력된 진단 결과가 없습니다.'}</p>
            </div>
            <div className="space-y-1 border-b pb-3">
              <span className="text-muted-foreground font-medium block">치료 목표</span>
              <p className="text-sm">{student.goals || '입력된 치료 목표가 없습니다.'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium block">특이사항</span>
              <p className="text-sm whitespace-pre-wrap">{student.notes || '없음'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 치료 일지(세션 타임라인) */}
      <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" /> 치료 일지 기록
          </h3>
          <Button onClick={handleOpenNewSession}>
            <Plus className="mr-2 h-4 w-4" /> 세션 기록 추가
          </Button>
        </div>

        {sessionsLoading ? (
          <div className="text-center py-12 text-muted-foreground">기록을 불러오는 중입니다...</div>
        ) : sessions.length === 0 ? (
          <Card className="border-dashed bg-slate-50 dark:bg-slate-900/50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800 mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium mb-1">등록된 세션 기록이 없습니다.</h4>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                우측 상단의 '세션 기록 추가' 버튼을 눌러 첫 치료 일지를 작성해보세요.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {sessions.map((session) => (
              <AccordionItem 
                key={session.id} 
                value={session.id} 
                className="bg-white dark:bg-slate-950 border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <div className="font-semibold text-lg text-left">
                        {format(new Date(session.session_date), "yyyy년 MM월 dd일")}
                      </div>
                      {session.score !== null && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                          평가 점수: {session.score}
                        </span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  <div className="space-y-4 text-sm">
                    {session.content && (
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
                        <strong className="block mb-2 text-foreground">세션 내용</strong>
                        <p className="whitespace-pre-wrap text-muted-foreground">{session.content}</p>
                      </div>
                    )}
                    {session.progress && (
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
                        <strong className="block mb-2 text-foreground">진척 상황 및 관찰</strong>
                        <p className="whitespace-pre-wrap text-muted-foreground">{session.progress}</p>
                      </div>
                    )}
                    {session.next_goal && (
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
                        <strong className="block mb-2 text-foreground">다음 목표</strong>
                        <p className="whitespace-pre-wrap text-muted-foreground">{session.next_goal}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={(e) => handleEditSession(e, session)}>
                        <Edit2 className="h-4 w-4 mr-2" /> 수정
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={(e) => handleDeleteSession(e, session.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> 삭제
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <SessionFormModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        studentId={id || ""}
        session={editingSession}
        onSave={handleSaveSession}
      />
    </div>
  )
}
