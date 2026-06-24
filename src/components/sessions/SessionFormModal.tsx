import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import { cn } from "@/lib/utils"
import { useStudents } from "@/hooks/useStudents"
import type { Session, SessionInsert } from "@/types/session"

interface SessionFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId?: string
  session?: Session | null
  onSave: (session: SessionInsert) => Promise<void>
}

export function SessionFormModal({ open, onOpenChange, studentId, session, onSave }: SessionFormModalProps) {
  const { students } = useStudents()
  const [selectedStudentId, setSelectedStudentId] = useState<string>(studentId || "")
  const [sessionDate, setSessionDate] = useState<Date | undefined>(new Date())
  const [content, setContent] = useState("")
  const [progress, setProgress] = useState("")
  const [nextGoal, setNextGoal] = useState("")
  const [score, setScore] = useState<string>("")
  
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (session) {
      setSessionDate(new Date(session.session_date))
      setContent(session.content || "")
      setProgress(session.progress || "")
      setNextGoal(session.next_goal || "")
      setScore(session.score !== null ? String(session.score) : "")
    } else {
      setSessionDate(new Date())
      setContent("")
      setProgress("")
      setNextGoal("")
      setScore("")
    }
    
    if (studentId) {
      setSelectedStudentId(studentId)
    } else if (session) {
      setSelectedStudentId(session.student_id)
    } else {
      setSelectedStudentId("")
    }
  }, [session, open, studentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionDate) return
    if (!selectedStudentId) {
      alert("학생을 선택해주세요.")
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        student_id: selectedStudentId,
        session_date: sessionDate.toISOString(),
        content: content || null,
        progress: progress || null,
        next_goal: nextGoal || null,
        score: score ? Number(score) : null,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{session ? "세션 기록 수정" : "새 세션 기록 추가"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* 학생 선택 (studentId가 외부에서 주어지지 않은 경우에만 표시) */}
          {!studentId && (
            <div className="space-y-2">
              <Label>학생 선택 *</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={!!session}>
                <SelectTrigger>
                  <SelectValue placeholder="학생을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>세션 날짜 *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !sessionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {sessionDate ? format(sessionDate, "yyyy-MM-dd") : <span>날짜 선택</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={sessionDate}
                    onSelect={setSessionDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="score">평가 점수 (선택)</Label>
              <Input
                id="score"
                type="number"
                step="0.1"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="예: 85.5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">세션 내용</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="오늘 진행한 치료 내용, 활동 등을 기록합니다."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="progress">진척 상황 및 관찰 내용</Label>
            <Textarea
              id="progress"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder="학생의 반응, 개선점, 특이사항 등을 기록합니다."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextGoal">다음 목표</Label>
            <Input
              id="nextGoal"
              value={nextGoal}
              onChange={(e) => setNextGoal(e.target.value)}
              placeholder="다음 세션에서 진행할 단기 목표"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isSaving || !sessionDate}>
              {isSaving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
