export const BASE_URL = "https://under.place"

export type Run = { text: string; fontFamily: string; color: string };

export interface Message {
  code: string,
  content: Run[],
}

interface StoryPostResponseBody {
  message: string,
  timestamp: number
}

export const send = async (msg: Message): Promise<string> => {
  try {
    const res = await fetch(BASE_URL + "/stories", {
      method: "POST",
      body: JSON.stringify({
        code: msg.code,
        content: msg.content
      })
    })

    const body = await res.json() as StoryPostResponseBody

    if (res.status == 200) {
      return body.message
    } else {
      return Promise.reject(body.message)
    }
  } catch (error) {
    return Promise.reject(error)
  }
}
