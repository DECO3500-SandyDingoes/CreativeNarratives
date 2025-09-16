import { Peer } from "peerjs"

export type Run = { text: string; fontFamily: string; color: string };

export interface Message {
  pin: string,
  text: Run[],
}

export type Status = "success" | "format-issue" | "wrong-pin"

export type MessageHandler = (msg: Message) => Status

// This is the ID used to identify the installation
const peerId = "3a56a8aa-6cb4-49fa-93d6-737ef9f1b103"

export const startListening = (handle: MessageHandler) => {
  const peer = new Peer(peerId, { debug: 3 })

  console.log("Starting to listen for connections at: " + peerId)
  peer.on("connection", conn => {
    console.log("Connection opened from: " + conn.peer)
    conn.on("data", data => {
      console.log(data)
      try {
        conn.send(handle(JSON.parse(data as string)))
      } catch (error) {
        conn.send("format-issue")
        console.error("Failed to parse message: " + error)
      }
    })
  })
}

export const send = async (msg: Message): Promise<Status> => {
  return new Promise<Status>((resolve, reject) => {
    const peer = new Peer(crypto.randomUUID(), { debug: 0 })
    const timeout = setTimeout(() => {
      peer.disconnect()
      reject("timed out")
    }, 5000)
    peer.on("open", _id => {
      const conn = peer.connect(peerId, { reliable: true })
      conn.on("open", () => {
        conn.send(JSON.stringify(msg))
      })
      conn.on("data", data => {
        clearTimeout(timeout)
        resolve(data as Status)
        conn.close()
        peer.disconnect()
      })
      conn.on("error", error => {
        conn.close()
        peer.disconnect()
        reject(error)
      })
    })
  })
}
