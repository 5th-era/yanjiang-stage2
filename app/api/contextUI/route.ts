import { type NextRequest } from 'next/server'
import { client_contextUI, getInfo } from '@/app/api/utils/common'

export async function POST(request: NextRequest) {
    const body = await request.json()
    const {
        inputs,
        query,
        conversation_id: conversationId,
        response_mode: responseMode,
    } = body
    const { user } = getInfo(request)

    const res = await client_contextUI.createChatMessage(inputs, query, user, responseMode, conversationId)
    return new Response(res.data as any)

}
