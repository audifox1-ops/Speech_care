export interface SmsRecipient {
  studentId: string
  name: string
  phone: string
  parentName?: string
}

export interface SmsResult {
  success: boolean
  errorDetail?: string
}

export interface SmsProvider {
  /**
   * 문자 발송을 수행하는 메서드
   * @param recipients 수신자 목록
   * @param body 문자 본문 (변수 치환 완료된 상태)
   * @returns 발송 결과
   */
  send(recipients: SmsRecipient[], body: string): Promise<SmsResult>
}
