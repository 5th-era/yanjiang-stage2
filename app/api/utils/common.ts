import { type NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { v4 } from 'uuid'
import { API_KEY, API_URL, APP_ID } from '@/config'

const userPrefix = `user_${APP_ID}:`

export const getInfo = (request: NextRequest) => {
  const sessionId = request.cookies.get('session_id')?.value || v4()
  const user = userPrefix + sessionId
  return {
    sessionId,
    user,
  }
}

export const setSession = (sessionId: string) => {
  return { 'Set-Cookie': `session_id=${sessionId}` }
}

export const client = new ChatClient(API_KEY, API_URL || undefined)
export const client_contextUI = new ChatClient('app-3nQl7W7oW5WDHgmh9UfsXEcX', API_URL || undefined)
export const client_speechEvaluation = new ChatClient('app-Vztg0DBSrLrrDwLkZIQTjL5y', API_URL || undefined)
export const client_aboutMuyu = new ChatClient('app-wKSp9w6Nd3frxCVfTwCNvkrH', API_URL || undefined)
