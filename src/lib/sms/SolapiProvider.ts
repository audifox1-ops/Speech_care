import { supabase } from '../supabase'
import type { SmsProvider, SmsRecipient, SmsResult } from './SmsProvider'

export class SolapiProvider implements SmsProvider {
  async send(recipients: SmsRecipient[], body: string): Promise<SmsResult> {
    try {
      // 1. 발송할 메시지 배열 만들기 (각 수신자별로 변수 치환)
      // 주의: 실제 발신번호(from)는 환경변수에 등록되어야 하므로 프론트에서 보내지 않거나, 
      // Edge Function이 환경변수에서 읽어오도록 설계하는 것이 안전합니다.
      // 여기서는 Edge Function이 VITE 환경변수가 아닌 백엔드 환경변수에서 읽어온다고 가정하고,
      // VITE_SOLAPI_SENDER_NUMBER가 세팅되어 있다면 넘기도록 구현합니다.
      const senderNumber = import.meta.env.VITE_SOLAPI_SENDER_NUMBER || "01000000000"

      const messages = recipients.map(recipient => {
        // 본문 변수 치환
        const personalizedBody = body
          .replace(/{이름}/g, recipient.name)
          .replace(/{학부모명}/g, recipient.parentName || '학부모')
          // ... 기타 변수 치환 로직

        // Solapi는 번호에서 '-'를 제거해야 합니다.
        const cleanPhone = recipient.phone.replace(/-/g, '')

        return {
          to: cleanPhone,
          from: senderNumber.replace(/-/g, ''),
          text: personalizedBody
        }
      })

      // 2. Supabase Edge Function 호출
      const { data: resultData, error: edgeError } = await supabase.functions.invoke('send-sms', {
        body: { messages }
      })

      if (edgeError || !resultData?.success) {
        throw new Error(edgeError?.message || resultData?.error || "Edge Function 호출 실패")
      }

      // 3. 성공 시 로그 기록
      await supabase.from('sms_logs').insert([{
        recipients: JSON.stringify(recipients),
        body: body, // 원본 템플릿 로깅
        status: 'success',
        provider: 'solapi',
      }])

      return { success: true }
    } catch (error: any) {
      console.error('[Solapi SMS 에러]', error)
      
      // 실패 시 로그 기록
      await supabase.from('sms_logs').insert([{
        recipients: JSON.stringify(recipients),
        body: body,
        status: 'failed',
        provider: 'solapi',
        error_detail: error.message
      }])

      return { success: false, errorDetail: error.message }
    }
  }
}
