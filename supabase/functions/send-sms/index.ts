import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { HmacSha256 } from "https://deno.land/std@0.160.0/hash/sha256.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SmsMessage {
  to: string
  from: string
  text: string
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json() as { messages: SmsMessage[] }
    
    if (!messages || messages.length === 0) {
      throw new Error("발송할 메시지가 없습니다.")
    }

    const apiKey = Deno.env.get('SOLAPI_API_KEY')
    const apiSecret = Deno.env.get('SOLAPI_API_SECRET')

    if (!apiKey || !apiSecret) {
      throw new Error("Solapi API 키 또는 시크릿이 설정되지 않았습니다.")
    }

    // 1. Solapi Auth Header 생성
    const date = new Date().toISOString()
    const salt = crypto.randomUUID().replace(/-/g, '')
    
    const hmac = new HmacSha256(apiSecret)
    hmac.update(date + salt)
    const signature = hmac.hex()

    const authHeader = `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`

    // 2. Solapi API 발송 요청 (여러 건 동시 발송)
    const response = await fetch("https://api.solapi.com/messages/v4/send-many", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify({
        agent: {
          sdkVersion: "deno/1.0",
          osPlatform: "supabase-edge"
        },
        messages: messages
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Solapi 에러:", result)
      return new Response(
        JSON.stringify({ success: false, error: result.errorMessage || "문자 발송 실패" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error: any) {
    console.error("Edge Function 에러:", error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
