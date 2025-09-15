import { startListening, type Message, type Status } from "../../shared/shared"
import './style.css'

const handleMessage = (msg: Message): Status => {
  console.log(msg.text)
  return "failure"
}
startListening(handleMessage)