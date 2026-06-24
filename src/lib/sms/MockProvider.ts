import { supabase } from '../supabase'
import type { SmsProvider, SmsRecipient, SmsResult } from './SmsProvider'

export class MockProvider implements SmsProvider {
  async send(recipients: SmsRecipient[], body: string): Promise<SmsResult> {
    console.log('[MOCK SMS 전송 시작]')
    console.log(`수신자: ${recipients.length}명`, recipients)
    console.log(`본문:\n${body}`)

    try {
      // 1초 대기 (네트워크 지연 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // sms_logs 테이블에 기록
      const { error } = await supabase
        .from('sms_logs')
        .insert([{
          recipients: JSON.stringify(recipients),
          body: body,
          status: 'success',
          provider: 'mock',
        }])

      if (error) {
        console.error('[MOCK SMS DB 기록 실패]', error)
        return { success: false, errorDetail: error.message }
      }

      console.log('[MOCK SMS 전송 완료]')
      return { success: true }
    } catch (error: any) {
      console.error('[MOCK SMS 에러]', error)
      return { success: false, errorDetail: error.message }
    }
  }
}
