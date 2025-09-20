import { BASE_URL } from "../../shared/shared"
import './style.css'

const INSTALLATION_KEY = "c757ae22-2be3-461c-9ab4-53da3ea87a29"

// Handle updating and displaying PIN code
const generatePin = (): string => {
  const pin = 1000 + Math.floor(Math.random() * 8999)
  return pin.toString()
}
let currentPin = ""
const updatePin = () => {
  const linkPinElement = document.getElementById("link-pin")
  currentPin = generatePin()
  fetch(BASE_URL + "/codes", {
    method: "PATCH",
    headers: {
      "X-INSTALLATION-KEY": INSTALLATION_KEY
    },
    body: JSON.stringify({ code: currentPin })
  })
    .then(res => {
      if (res.status == 200 && linkPinElement) {
        linkPinElement.innerText = currentPin
      } else {
        console.log("Failed to update PIN code on backend.")
      }
    })
    .catch(error => {
      console.error("PIN Code update request failed: " + error)
    })
}
setInterval(() => updatePin(), 5 * 60 * 1000)
updatePin()

// Handle story content on beams
// interface Story {
//   text: Run[]
// }

// const beamStories: Story[][] = [[], [], []]

// const addStory = (story: Story) => {
//   beamStories[1].push(story)
//   updateStoryDisplay()
// }

// const updateStoryDisplay = () => {
//   const secondBeamElement = document.getElementById("second-beam")
//   if (secondBeamElement) {
//     secondBeamElement.innerHTML = ""
//     const secondBeamStories = beamStories[1]
//     for (let i = secondBeamStories.length - 1; i > 0; i--) {
//       const story = secondBeamStories[i];
//       secondBeamElement.innerHTML += JSON.stringify(story.text)
//     }
//   }
// }


// TODO: Fetch new stories on interval.
// addStory({})