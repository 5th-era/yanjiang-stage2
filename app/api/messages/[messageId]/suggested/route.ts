import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  // console.log("got api: messages-suggested.")

  const { sessionId, user } = getInfo(request)
  // console.log("user: ", user)

  const url_str = request.url.toString()
  // console.log("url_str: ", url_str)

  const messageId = url_str.match(/messages\/([0-9a-fA-F-]{36})\/suggested/)[1];
  // console.log("messageId: ", messageId)

  const endpoint = url_str.match(/\/api(.+)/)[1];
  // console.log("endpoint: ", endpoint)

  const _params = { user }
  const { data }: any = await client.sendRequest(
    "GET",
    endpoint,
    null,
    _params,
  );
  return NextResponse.json(data, {
    headers: setSession(sessionId),
  })
}
