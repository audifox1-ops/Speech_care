import { useState, useEffect } from 'react'
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { LogOut, Home, Users, FileText, Settings, MessageSquare, Send, FileArchive, Printer, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from 'date-fns'

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [todaySessions, setTodaySessions] = useState<any[]>([])

  useEffect(() => {
    const fetchTodaySessions = async () => {
      const { data } = await supabase
        .from('sessions')
        .select(`
          id,
          session_date,
          student:students(name)
        `)
        // 임시로 오늘 이후 세션 모두를 가져오거나, 실제론 >= today 00:00 AND <= today 23:59 조건을 걸 수 있습니다.
        // 여기선 간단하게 테스트를 위해 최신 세션 5개를 가져오겠습니다 (실제로는 date 필터링)
        .order('session_date', { ascending: false })
        .limit(5)
      
      if (data) {
        setTodaySessions(data)
      }
    }
    fetchTodaySessions()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { name: '대시보드', path: '/', icon: Home },
    { name: '학생 관리', path: '/students', icon: Users },
    { name: '문자 템플릿 관리', path: '/messages/templates', icon: MessageSquare },
    { name: '발송 내역', path: '/messages/logs', icon: Send },
    { name: '문서 템플릿 관리', path: '/documents/templates', icon: FileArchive },
    { name: '문서 자동 생성', path: '/documents/generate', icon: Printer },
    { name: '치료 일지', path: '/journals', icon: FileText },
    { name: '설정', path: '/settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-950 border-r flex flex-col print:hidden">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-xl font-bold text-primary">말자람 시스템</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.path)
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-950 border-b flex items-center justify-between px-6 print:hidden">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
            })}
          </div>
          <div className="flex items-center gap-4">
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {todaySessions.length > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <h4 className="font-semibold text-sm">최근 / 오늘 예정 세션 알림</h4>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {todaySessions.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">알림이 없습니다.</div>
                  ) : (
                    <ul className="divide-y">
                      {todaySessions.map(session => (
                        <li key={session.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <p className="font-medium text-sm">
                            {session.student?.name} 학생 세션
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(session.session_date), 'yyyy년 MM월 dd일 a h:mm')}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-auto p-6 print:p-0 print:overflow-visible">
          <div className="max-w-6xl mx-auto print:max-w-none print:mx-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
