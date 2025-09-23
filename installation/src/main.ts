import { BASE_URL, type Run } from "../../shared/shared"
import "./text-styles.css"

//// Simulator fullscreen toggle ////

const simulatorElement = document.getElementById("simulator")!
simulatorElement.addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    simulatorElement.requestFullscreen()
  }
})

//// PIN Code Handling ////

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

//// Story Content Handling ////

/**
 * Represents a story submitted to the installation.
 */
interface Story {
  content: Run[]
  timestamp: number
}

/**
 * Stores the stories that have been fetched from the backend.
 * 
 * [0] is the first beam.
 * [1] is the second beam.
 * [2] is the third beam.
 */
const stories: Story[][] = [[], [], []]

/**
 * The timestamp of the last fetch from the backend.
 */
let lastFetchTimestamp = 0

/**
 * Fetch the latest stories (since lastFetchTimestamp) from the backend, and append to `stories`.
 */
const fetchLatestStories = () => {
  fetch(BASE_URL + "/stories?timestamp=" + lastFetchTimestamp, {
    method: "GET",
    headers: {
      "X-INSTALLATION-KEY": INSTALLATION_KEY,
    }
  })
    .then(response => response.json())
    .then((newStories: Array<Story>) => {
      newStories.sort((a, b) => a.timestamp - b.timestamp)
      newStories.forEach(s => addStory(s))
    })
    .catch(error => {
      console.error("Failed to fetch new stories: " + error)
    })

  lastFetchTimestamp = Date.now()
}

// Fetch existing stories and then fetch new stories every two seconds
fetchLatestStories()
setInterval(() => fetchLatestStories(), 2 * 1000)

/**
 * The index of the last beam which had a story added to it. Used for roundrobin appending.
 */
let lastBeamIndex = 0

/**
 * Add a story the beams. The beams are selected roundrobin style (for now).
 * @param story to add
 */
const addStory = (story: Story) => {
  // Prepend story to the front
  stories[lastBeamIndex] = [story, ...stories[lastBeamIndex]]

  // Increment index to next beam for the next story added.
  lastBeamIndex = (lastBeamIndex + 1) % 3
  updateStoryDisplay()
}

/**
 * Render the styled text elements of the currently stored stories to the screen.
 */
const updateStoryDisplay = () => {
  const beamElements = [
    document.getElementById("first-beam")!,
    document.getElementById("second-beam")!,
    document.getElementById("third-beam")!
  ]

  for (let beamIndex = 0; beamIndex < 3; beamIndex++) {
    const beamElement = beamElements[beamIndex]
    const beamStories = stories[beamIndex]

    beamElement.innerHTML = ""

    for (let storyIndex = 0; storyIndex < beamStories.length; storyIndex++) {
      const story = beamStories[storyIndex];

      // Keeping plain text version to be used for calculating layout
      // and filtering "bad" words. 
      //
      const plainText = story.content.reduce((text, run) => text + run.text, "")

      // Build formatted text spans inside an article container
      const storyContainer = document.createElement("article")

      // Make long text double lined
      if (plainText.length > 20) {
        storyContainer.classList.add("double-line")
        storyContainer.style.width = plainText.length / 3 + "vw"
      }

      for (const run of story.content) {
        const runText = document.createElement("span")
        runText.innerText = run.text
        runText.classList.add(mapFont(run.fontFamily))
        runText.classList.add(mapColour(run.color))
        storyContainer.appendChild(runText)
      }


      // Append article container to the beam element
      beamElement.appendChild(storyContainer)
    }
  }
}

/**
 * Map the font names used on the editor app to the font classes used by the installation. 
 * 
 * @param name editor app font name
 * @returns css class name for corresponding font
 */
const mapFont = (name: string): string => {
  switch (name) {
    case "Montserrat":
      return "font-montserrat"
    case "Super Woobly":
      return "font-super-woobly"
    case "Bebas Neue":
      return "font-bebas-neue"
    case "Redoura":
      return "font-redoura-serif"
    case "Graffiti Youth":
    default:
      return "font-graffiti-youth"
  }
}

/**
 * Map the colours used on the editor app to the colour classes used by the installation. 
 * 
 * @param name editor app colour value
 * @returns css class name for corresponding colour
 */
const mapColour = (name: string): string => {
  switch (name) {
    case "#FF3B30":
      return "colour-red"
    case "#007AFF":
      return "colour-blue"
    case "#AF52DE":
      return "colour-purple"
    case "#FF9500":
      return "colour-orange"
    case "#FFD60A":
      return "colour-yellow"
    case "#34C759":
    default:
      return "colour-green"
  }
}