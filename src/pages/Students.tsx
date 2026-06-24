import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Trash2, Send } from "lucide-react"

import { useStudents } from "@/hooks/useStudents"
import { StudentFormModal } from "@/components/students/StudentFormModal"
import { SmsSendModal } from "@/components/messages/SmsSendModal"
import type { Student, StudentInsert } from "@/types/student"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function Students() {
  const { students, loading, addStudent, updateStudent, deleteStudent } = useStudents()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  // 다중 선택 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false)

  // 필터링 적용
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || student.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const allFilteredIds = filteredStudents.map(s => s.id)
  const isAllSelected = filteredStudents.length > 0 && allFilteredIds.every(id => selectedIds.has(id))
  const isSomeSelected = filteredStudents.length > 0 && allFilteredIds.some(id => selectedIds.has(id)) && !isAllSelected

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allFilteredIds))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleOpenNewModal = () => {
    setEditingStudent(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation() // 행 클릭(상세페이지 이동) 방지
    setEditingStudent(student)
    setIsModalOpen(true)
  }

  const handleDeleteClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (window.confirm("정말로 이 학생을 삭제하시겠습니까? (휴지통으로 이동)")) {
      await deleteStudent(id)
    }
  }

  const handleRowClick = (id: string) => {
    navigate(`/students/${id}`)
  }

  const handleSaveStudent = async (studentData: StudentInsert) => {
    if (editingStudent) {
      await updateStudent(editingStudent.id, studentData)
    } else {
      await addStudent(studentData)
    }
  }

  const selectedStudentsForSms = students.filter(s => selectedIds.has(s.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">학생 관리</h2>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button variant="secondary" onClick={() => setIsSmsModalOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              {selectedIds.size}명 문자 보내기
            </Button>
          )}
          <Button onClick={handleOpenNewModal}>
            <Plus className="mr-2 h-4 w-4" />
            학생 등록
          </Button>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름으로 검색..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="재원">재원</SelectItem>
            <SelectItem value="휴원">휴원</SelectItem>
            <SelectItem value="종결">종결</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 학생 목록 테이블 */}
      <div className="rounded-md border bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={isAllSelected || (isSomeSelected ? "indeterminate" : false)}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>이름</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>보호자</TableHead>
              <TableHead>진단 결과</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  데이터를 불러오는 중입니다...
                </TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  등록된 학생이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow 
                  key={student.id} 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  onClick={() => handleRowClick(student.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedIds.has(student.id)}
                      onCheckedChange={() => toggleOne(student.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      student.status === '재원' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      student.status === '휴원' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {student.status}
                    </span>
                  </TableCell>
                  <TableCell>{student.phone || '-'}</TableCell>
                  <TableCell>
                    {student.parent_name || '-'} {student.parent_phone ? `(${student.parent_phone})` : ''}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {student.diagnosis || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => handleEditClick(e, student)}
                    >
                      수정
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteClick(e, student.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StudentFormModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        student={editingStudent}
        onSave={handleSaveStudent}
      />

      <SmsSendModal 
        open={isSmsModalOpen}
        onOpenChange={setIsSmsModalOpen}
        selectedStudents={selectedStudentsForSms}
        onSuccess={() => setSelectedIds(new Set())}
      />
    </div>
  )
}
