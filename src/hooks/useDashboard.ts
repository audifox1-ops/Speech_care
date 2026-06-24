import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, format } from 'date-fns'
import type { Student } from '@/types/student'
import type { Session } from '@/types/session'

export interface DashboardData {
  activeStudentCount: number
  monthlySessionCount: number
  todaySessions: (Session & { students: Pick<Student, 'name'> | null })[]
  recentActivities: (Session & { students: Pick<Student, 'name'> | null })[]
  weeklyChartData: { date: string; count: number }[]
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const now = new Date()
      const todayStart = startOfDay(now).toISOString()
      const todayEnd = endOfDay(now).toISOString()
      const monthStart = startOfMonth(now).toISOString()
      const monthEnd = endOfMonth(now).toISOString()
      
      // 1. 재원생 수
      const { count: activeStudentCount, error: studentError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', '재원')
        .is('deleted_at', null)

      if (studentError) throw studentError

      // 2. 이번 달 세션 수
      const { count: monthlySessionCount, error: monthlySessionError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gte('session_date', monthStart)
        .lte('session_date', monthEnd)

      if (monthlySessionError) throw monthlySessionError

      // 3. 오늘 예정 세션 (최근 순)
      const { data: todaySessions, error: todaySessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          students:student_id ( name )
        `)
        .gte('session_date', todayStart)
        .lte('session_date', todayEnd)
        .order('session_date', { ascending: true })

      if (todaySessionsError) throw todaySessionsError

      // 4. 최근 활동 (최근 5개 세션 기록)
      const { data: recentActivities, error: recentActivitiesError } = await supabase
        .from('sessions')
        .select(`
          *,
          students:student_id ( name )
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentActivitiesError) throw recentActivitiesError

      // 5. 주간 차트 데이터 생성 (최근 7일)
      const past7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(now, 6 - i)
        return {
          date: format(d, 'MM/dd'),
          start: startOfDay(d).toISOString(),
          end: endOfDay(d).toISOString()
        }
      })

      // 각 날짜별 세션 수를 병렬로 가져오기
      const weeklyPromises = past7Days.map(async (day) => {
        const { count } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .gte('session_date', day.start)
          .lte('session_date', day.end)
        return {
          date: day.date,
          count: count || 0
        }
      })

      const weeklyChartData = await Promise.all(weeklyPromises)

      setData({
        activeStudentCount: activeStudentCount || 0,
        monthlySessionCount: monthlySessionCount || 0,
        todaySessions: todaySessions as any,
        recentActivities: recentActivities as any,
        weeklyChartData
      })
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    data,
    loading,
    error,
    refreshDashboard: fetchDashboardData
  }
}
