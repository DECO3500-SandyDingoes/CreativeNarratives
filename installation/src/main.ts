import { startListening, type Message, type Status } from "../../shared/shared"
import './style.css'



const generatePin = (): string => {
  const pin = 1000 + Math.floor(Math.random() * 8999)
  return pin.toString()
}
let currentPin = "0000"
const updatePin = () => {
  currentPin = generatePin()
  const linkPinElement = document.getElementById("link-pin")
  if (linkPinElement) {
    linkPinElement.innerText = currentPin
  }
}
setInterval(() => updatePin(), 5 * 60 * 1000)
updatePin()


const handleMessage = (msg: Message): Status => {
  if (msg.pin == currentPin) {
    console.log("PIN Accepted, text: " + msg.text)
    return "success"
  } else {
    console.log("Pin rejected")
    return "wrong-pin"
  }
}
startListening(handleMessage)