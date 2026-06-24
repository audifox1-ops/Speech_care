import { MockProvider } from './MockProvider'
import { SolapiProvider } from './SolapiProvider'
import type { SmsProvider } from './SmsProvider'

// 환경 변수나 설정에 따라 실제 Provider를 반환하는 팩토리 함수
export function getSmsProvider(): SmsProvider {
  const providerType = import.meta.env.VITE_SMS_PROVIDER || 'mock'

  switch (providerType.toLowerCase()) {
    case 'solapi':
      return new SolapiProvider()
    case 'mock':
    default:
      return new MockProvider()
  }
}
