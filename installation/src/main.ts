import { startListening, type Message, type Run, type Status } from "../../shared/shared"
import './style.css'

const INSTALLATION_KEY = "c757ae22-2be3-461c-9ab4-53da3ea87a29"

// Handle updating and displaying PIN code
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

// Handle story content on beams
interface Story {
  text: Run[]
}

const beamStories: Story[][] = [[], [], []]

const addStory = (story: Story) => {
  beamStories[1].push(story)
  updateStoryDisplay()
}

const updateStoryDisplay = () => {
  const secondBeamElement = document.getElementById("second-beam")
  if (secondBeamElement) {
    secondBeamElement.innerHTML = ""
    const secondBeamStories = beamStories[1]
    for (let i = secondBeamStories.length - 1; i > 0; i--) {
      const story = secondBeamStories[i];
      secondBeamElement.innerHTML += JSON.stringify(story.text)
    }
  }
}


// Handle incoming messsages
const handleMessage = (msg: Message): Status => {
  if (msg.pin == currentPin) {
    console.log("PIN Accepted, text: " + msg.text)
    addStory({ text: msg.text })
    return "success"
  } else {
    console.log("Pin rejected")
    return "wrong-pin"
  }
}
startListening(handleMessage)