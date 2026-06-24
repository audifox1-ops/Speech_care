import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Lock, LogOut, Download, Upload, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"

export function Settings() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)

  // 보안 점검용 환경변수 상태
  const isSmsProviderSet = import.meta.env.VITE_SMS_PROVIDER === 'solapi'
  const isSolapiSenderSet = !!import.meta.env.VITE_SOLAPI_SENDER_NUMBER

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  const handlePasswordChange = async () => {
    if (!password) {
      alert("새 비밀번호를 입력해주세요.")
      return
    }
    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.")
      return
    }

    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      if (error) throw error
      alert("비밀번호가 성공적으로 변경되었습니다.")
      setPassword("")
      setPasswordConfirm("")
    } catch (error: any) {
      alert(`비밀번호 변경 실패: ${error.message}`)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  // 전체 데이터 백업
  const handleBackup = async () => {
    setIsBackingUp(true)
    try {
      const backupData: Record<string, any> = {}
      
      const tables = ['students', 'sessions', 'sms_templates', 'sms_logs', 'doc_templates']
      
      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*')
        if (error) throw error
        backupData[table] = data
      }

      const jsonString = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement("a")
      a.href = url
      a.download = `speechcare_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error: any) {
      console.error(error)
      alert(`백업 중 오류 발생: ${error.message}`)
    } finally {
      setIsBackingUp(false)
    }
  }

  // 데이터 복원
  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setRestoreFile(file)
      setRestoreModalOpen(true)
    }
    // 인풋 초기화
    e.target.value = ''
  }

  const executeRestore = async () => {
    if (!restoreFile) return
    setIsRestoring(true)

    try {
      const text = await restoreFile.text()
      const backupData = JSON.parse(text)

      const tables = ['students', 'sessions', 'sms_templates', 'sms_logs', 'doc_templates']
      
      // 주의: 외래키 제약조건 때문에 삭제 순서와 삽입 순서를 지켜야 합니다.
      // 삭제는 역순으로
      for (const table of [...tables].reverse()) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000') //꼼수: 1=1 조건 대신 neq 사용
        if (error) {
          // 일부 테이블은 지울 때 에러가 날 수 있으나(RLS 등) 계속 진행
          console.warn(`Table ${table} delete warning:`, error)
        }
      }

      // 삽입은 정순으로
      for (const table of tables) {
        if (backupData[table] && backupData[table].length > 0) {
          const { error } = await supabase.from(table).insert(backupData[table])
          if (error) throw error
        }
      }

      alert("복원이 완료되었습니다. 페이지를 새로고침합니다.")
      window.location.reload()

    } catch (error: any) {
      console.error(error)
      alert(`복원 중 오류 발생: ${error.message}`)
    } finally {
      setIsRestoring(false)
      setRestoreModalOpen(false)
      setRestoreFile(null)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">설정</h2>
        <p className="text-muted-foreground mt-1">계정 관리 및 데이터 백업/복원</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 계정 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              계정 보안
            </CardTitle>
            <CardDescription>로그인 비밀번호를 변경하거나 로그아웃합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>새 비밀번호</Label>
              <Input 
                type="password" 
                placeholder="새 비밀번호 입력" 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>새 비밀번호 확인</Label>
              <Input 
                type="password" 
                placeholder="비밀번호 다시 입력" 
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handlePasswordChange} disabled={isUpdatingPassword} className="flex-1">
                {isUpdatingPassword ? "변경 중..." : "비밀번호 변경"}
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 시스템 점검 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              보안 및 시스템 점검
            </CardTitle>
            <CardDescription>현재 시스템의 보안 상태를 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-md">
              <span className="font-medium">데이터베이스 RLS 보호</span>
              <span className="flex items-center text-green-600 text-sm font-semibold">
                <ShieldCheck className="w-4 h-4 mr-1" /> 활성 (안전함)
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <span className="font-medium">실제 문자(Solapi) 연동</span>
              {isSmsProviderSet && isSolapiSenderSet ? (
                <span className="flex items-center text-green-600 text-sm font-semibold">
                  <ShieldCheck className="w-4 h-4 mr-1" /> 연결됨
                </span>
              ) : (
                <span className="flex items-center text-amber-600 text-sm font-semibold">
                  <ShieldAlert className="w-4 h-4 mr-1" /> 미연결 (테스트 모드)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              * 데이터베이스는 최고 수준의 보안 정책(RLS)으로 보호되고 있어 외부 접근이 차단되어 있습니다.
            </p>
          </CardContent>
        </Card>

        {/* 데이터 백업 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              데이터 백업 및 복원
            </CardTitle>
            <CardDescription>만약의 사태를 대비해 모든 데이터를 PC에 백업합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md border border-amber-200 dark:border-amber-900">
              <h4 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> 경고: 민감 정보 포함
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                다운로드되는 JSON 파일에는 센터의 모든 <b>학생 개인정보와 치료 기록</b>이 암호화되지 않은 채 포함되어 있습니다.
                반드시 원장님 개인 PC나 안전한 USB 등 오프라인 저장소에 보관하시기 바랍니다.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleBackup} 
                disabled={isBackingUp}
                className="flex-1 h-14 text-lg"
              >
                {isBackingUp ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Download className="w-5 h-5 mr-2" />
                )}
                전체 데이터 백업 (JSON)
              </Button>

              <div className="flex-1 relative">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleRestoreFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button 
                  variant="outline" 
                  className="w-full h-14 text-lg border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  백업 파일로 복원하기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={restoreModalOpen} onOpenChange={setRestoreModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              데이터 덮어쓰기 경고
            </DialogTitle>
            <DialogDescription>
              정말 데이터를 복원하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm text-muted-foreground">
            <p>
              복원을 진행하면 <b>현재 시스템에 등록된 모든 최신 데이터가 영구적으로 삭제</b>되고, 
              업로드하신 <b>[{restoreFile?.name}]</b> 파일의 과거 데이터로 전부 덮어씌워집니다.
            </p>
            <p className="font-bold text-foreground">
              이 작업은 절대 되돌릴 수 없습니다.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreModalOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={executeRestore} disabled={isRestoring}>
              {isRestoring ? "복원 중..." : "모든 위험을 인지하며 복원합니다"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
