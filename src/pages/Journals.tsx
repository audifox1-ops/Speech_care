import { useState, useMemo } from 'react'
import { format, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns'
import { Plus, Search, Calendar as CalendarIcon, FileText, Trash2, Edit } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { SessionFormModal } from '@/components/sessions/SessionFormModal'
import { useAllSessions } from '@/hooks/useAllSessions'
import type { SessionWithStudent } from '@/hooks/useAllSessions'
import type { SessionInsert } from '@/types/session'

export function Journals() {
  const { sessions, loading, addSession, updateSession, deleteSession } = useAllSessions()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // all, today, week, month

  const [modalOpen, setModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<SessionWithStudent | null>(null)

  // 필터링 로직
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // 1. 텍스트 검색 (학생 이름 또는 내용)
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        session.student?.name.toLowerCase().includes(searchLower) ||
        (session.content && session.content.toLowerCase().includes(searchLower)) ||
        (session.progress && session.progress.toLowerCase().includes(searchLower))

      if (!matchesSearch) return false

      // 2. 날짜 필터
      const sessionDate = parseISO(session.session_date)
      switch (dateFilter) {
        case 'today':
          return isToday(sessionDate)
        case 'week':
          return isThisWeek(sessionDate, { weekStartsOn: 1 }) // 월요일 시작
        case 'month':
          return isThisMonth(sessionDate)
        default:
          return true
      }
    })
  }, [sessions, searchTerm, dateFilter])

  const handleOpenNewModal = () => {
    setEditingSession(null)
    setModalOpen(true)
  }

  const handleOpenEditModal = (session: SessionWithStudent) => {
    setEditingSession(session)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('이 치료 기록을 정말 삭제하시겠습니까?')) {
      const { error } = await deleteSession(id)
      if (error) {
        alert(`삭제 실패: ${error}`)
      }
    }
  }

  const handleSaveSession = async (sessionData: SessionInsert) => {
    if (editingSession) {
      const { error } = await updateSession(editingSession.id, sessionData)
      if (error) throw new Error(error)
    } else {
      const { error } = await addSession(sessionData)
      if (error) throw new Error(error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">치료 일지 (전체)</h2>
          <p className="text-muted-foreground mt-1">
            모든 학생의 세션 기록을 한눈에 확인하고 새 일지를 작성합니다.
          </p>
        </div>
        <Button onClick={handleOpenNewModal}>
          <Plus className="w-4 h-4 mr-2" />
          새 일지 작성
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="학생 이름이나 내용 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="기간 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 기간</SelectItem>
                  <SelectItem value="today">오늘</SelectItem>
                  <SelectItem value="week">이번 주</SelectItem>
                  <SelectItem value="month">이번 달</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">날짜</TableHead>
                  <TableHead className="w-[100px]">학생 이름</TableHead>
                  <TableHead>내용 / 진척사항</TableHead>
                  <TableHead className="w-[150px]">다음 목표</TableHead>
                  <TableHead className="w-[80px] text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      불러오는 중...
                    </TableCell>
                  </TableRow>
                ) : filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-muted-foreground/50" />
                        <p>해당 조건의 세션 기록이 없습니다.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(parseISO(session.session_date), 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell className="font-bold whitespace-nowrap">
                        {session.student?.name || '알 수 없음'}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="space-y-1">
                          {session.content && (
                            <p className="text-sm truncate" title={session.content}>
                              <span className="font-semibold text-xs text-muted-foreground mr-1">[내용]</span>
                              {session.content}
                            </p>
                          )}
                          {session.progress && (
                            <p className="text-sm truncate text-muted-foreground" title={session.progress}>
                              <span className="font-semibold text-xs mr-1">[관찰]</span>
                              {session.progress}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm truncate max-w-[150px]" title={session.next_goal || ''}>
                        {session.next_goal || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenEditModal(session)}
                          >
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(session.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SessionFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        session={editingSession}
        onSave={handleSaveSession}
      />
    </div>
  )
}
