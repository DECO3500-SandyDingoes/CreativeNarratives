import { BASE_URL } from "../../shared/shared"
import './style.css'

/**
 * The key used to authenticate the installation with the backend service.
 */
const INSTALLATION_KEY = "c757ae22-2be3-461c-9ab4-53da3ea87a29"

/**
 * Generate a new random 4 digit code.
 *
 * @returns 4 digit code
 */
const generateCode = (): string => {
  const pin = 1000 + Math.floor(Math.random() * 8999)
  return pin.toString()
}

/**
 * Contains the current PIN code that the installation will accept submissions from.
 */
let code = ""

/**
 * Generate a new PIN code and update on the backend service.
 */
const updateCode = () => {
  const linkPinElement = document.getElementById("link-pin")
  code = generateCode()
  fetch(BASE_URL + "/codes", {
    method: "PATCH",
    headers: {
      "X-INSTALLATION-KEY": INSTALLATION_KEY
    },
    body: JSON.stringify({ code: code })
  })
    .then(res => {
      if (res.status == 200 && linkPinElement) {
        linkPinElement.innerText = code
      } else {
        console.error("Failed to update PIN code on backend.")
      }
    })
    .catch(error => {
      console.error("PIN Code update request failed: " + error)
    })
}

// Setup and initial PIN code and then regenerate it every 5 minutes. 
updateCode()
setInterval(() => updateCode(), 5 * 60 * 1000)

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