import { Send, CheckCircle2, XCircle, Clock } from "lucide-react"
import { format } from "date-fns"

import { useSmsLogs } from "@/hooks/useSmsLogs"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SmsLogs() {
  const { logs, loading } = useSmsLogs()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Send className="h-8 w-8" /> 발송 내역
          </h2>
          <p className="text-muted-foreground mt-1">
            학부모님들께 발송된 문자 메시지 기록을 확인합니다.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>전체 발송 기록</CardTitle>
          <CardDescription>최근 발송된 순서대로 정렬되어 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">발송 일시</TableHead>
                  <TableHead className="w-[100px]">상태</TableHead>
                  <TableHead>수신자</TableHead>
                  <TableHead className="max-w-[300px]">본문 내용</TableHead>
                  <TableHead className="w-[100px]">제공자</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      발송 내역을 불러오는 중입니다...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      발송된 문자 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(log.sent_at), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.status === 'success' ? (
                          <span className="flex items-center text-green-600 font-medium">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> 성공
                          </span>
                        ) : log.status === 'failed' ? (
                          <span className="flex items-center text-red-600 font-medium" title={log.error_detail || ''}>
                            <XCircle className="h-4 w-4 mr-1" /> 실패
                          </span>
                        ) : (
                          <span className="text-yellow-600 font-medium">일부 실패</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.recipients.length}명
                          <span className="text-xs text-muted-foreground block mt-0.5">
                            {log.recipients.map(r => r.name).slice(0, 3).join(', ')}
                            {log.recipients.length > 3 ? ` 외 ${log.recipients.length - 3}명` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground" title={log.body}>
                        {log.body}
                      </TableCell>
                      <TableCell className="text-muted-foreground uppercase text-xs font-semibold">
                        {log.provider}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
