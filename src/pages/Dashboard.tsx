import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Users, Calendar as CalendarIcon, Activity, TrendingUp, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDashboard } from '@/hooks/useDashboard'

export function Dashboard() {
  const navigate = useNavigate()
  const { data, loading, error } = useDashboard()

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">대시보드</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse bg-slate-50 dark:bg-slate-900/50">
              <CardHeader className="h-24"></CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">대시보드</h2>
      </div>

      {/* KPI 위젯 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 재원생 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeStudentCount}명</div>
            <p className="text-xs text-muted-foreground">현재 센터에서 치료를 받고 있는 학생</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 세션 진행</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.monthlySessionCount}건</div>
            <p className="text-xs text-muted-foreground">이번 달(1일~말일) 기준</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 예정 세션</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.todaySessions.length}건</div>
            <p className="text-xs text-muted-foreground">오늘 등록된 치료 스케줄</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 차트 위젯 */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> 
              최근 7일 세션 진행 추이
            </CardTitle>
            <CardDescription>일별로 진행된 세션 건수를 보여줍니다.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                    name="세션 건수"
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 오늘 일정 및 최근 활동 위젯 */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">오늘의 세션</CardTitle>
            </CardHeader>
            <CardContent>
              {data.todaySessions.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">
                  오늘 등록된 세션이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.todaySessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{session.students?.name || '알 수 없음'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.session_date), 'HH:mm')}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => navigate(`/students/${session.student_id}`)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">최근 기록된 일지</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentActivities.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">
                  최근 기록된 일지가 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.recentActivities.map(session => (
                    <div 
                      key={session.id} 
                      className="group cursor-pointer border rounded-md p-3 hover:bg-slate-50 transition-colors"
                      onClick={() => navigate(`/students/${session.student_id}`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{session.students?.name} 학생</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(session.created_at), 'MM/dd HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {session.content || '내용이 입력되지 않았습니다.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
