import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { cn } from "@/lib/utils"
import type { Student, StudentInsert, StudentStatus } from "@/types/student"

interface StudentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student | null
  onSave: (student: StudentInsert) => Promise<void>
}

export function StudentFormModal({ open, onOpenChange, student, onSave }: StudentFormModalProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [parentName, setParentName] = useState("")
  const [parentPhone, setParentPhone] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<StudentStatus>("재원")
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined)
  
  const [isSaving, setIsSaving] = useState(false)

  // 모달이 열리거나 선택된 학생이 바뀔 때 상태 초기화
  useEffect(() => {
    if (student) {
      setName(student.name || "")
      setPhone(student.phone || "")
      setParentName(student.parent_name || "")
      setParentPhone(student.parent_phone || "")
      setDiagnosis(student.diagnosis || "")
      setNotes(student.notes || "")
      setStatus(student.status)
      setBirthDate(student.birth_date ? new Date(student.birth_date) : undefined)
    } else {
      setName("")
      setPhone("")
      setParentName("")
      setParentPhone("")
      setDiagnosis("")
      setNotes("")
      setStatus("재원")
      setBirthDate(undefined)
    }
  }, [student, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await onSave({
        name,
        phone: phone || null,
        parent_name: parentName || null,
        parent_phone: parentPhone || null,
        diagnosis: diagnosis || null,
        notes: notes || null,
        status,
        birth_date: birthDate ? format(birthDate, "yyyy-MM-dd") : null,
        therapy_history: student?.therapy_history || null,
        goals: student?.goals || null,
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? "학생 정보 수정" : "새 학생 등록"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="예: 홍길동"
              />
            </div>
            
            <div className="space-y-2">
              <Label>생년월일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !birthDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, "yyyy-MM-dd") : <span>날짜 선택</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">학생 연락처</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">상태</Label>
              <Select value={status} onValueChange={(val) => setStatus(val as StudentStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="재원">재원</SelectItem>
                  <SelectItem value="휴원">휴원</SelectItem>
                  <SelectItem value="종결">종결</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parentName">보호자 성함</Label>
              <Input
                id="parentName"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="예: 홍아빠"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentPhone">보호자 연락처</Label>
              <Input
                id="parentPhone"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="010-0000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">진단 결과</Label>
            <Input
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="예: 언어발달지연"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">특이사항</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="기타 참고사항"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isSaving || !name}>
              {isSaving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
