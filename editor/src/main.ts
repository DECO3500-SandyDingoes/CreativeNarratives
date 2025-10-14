import './text-styles.css'
import './start.css'
import './style.css'
import { BASE_URL } from "../../shared/shared"

// Global State
let currentKeyboardFont = "font-montserrat"
let currentKeyboardColour = "colour-red"

let currentPostId: string | null = null

/** timestamp in milliseconds */
let lastUpdateSent = 0

/** flag for content changed since last update */
let contentChanged = false

/** how often to force update in milliseconds */
const updateInterval = 5 * 1000

// Keyboard Layouts

const alphaLayout = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["aA", "z", "x", "c", "v", "b", "n", "m", "delete"],
  ["?123", ",", "space", ".", "break"]
]

const alphaUpperLayout = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Aa", "Z", "X", "C", "V", "B", "N", "M", "delete"],
  ["?123", ",", "space", ".", "break"]
]

const numericSymbolLayout = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["@", "#", "$", "_", "&", "-", "+", "(", ")", "/"],
  ["=\\<", "*", "\"", "'", ":", ";", "!", "?", "delete"],
  ["ABC", ",", "space", ".", "break"]
]

const numericSymbolExtraLayout = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["~", "`", "|", "^", "=", "{", "}", "[", "]", "\\"],
  ["?123", "%", "<", ">", "-", "-", "-", "-", "delete"],
  ["ABC", ",", "space", ".", "break"]
]

// Keyboard and text input handling

const handleKeyboardPress = (key: string) => {
  switch (key) {
    case "delete":
      removeBackspaceChar()
      break;
    case "break":
      break;
    case "ABC":
    case "Aa":
      renderKeyboard(alphaLayout)
      break;
    case "aA":
      renderKeyboard(alphaUpperLayout)
      break;
    case "?123":
      renderKeyboard(numericSymbolLayout)
      break;
    case "=\\<":
      renderKeyboard(numericSymbolExtraLayout)
      break;
    case "space":
      appendChar(" ")
      break;
    default:
      appendChar(key)
      break;
  }
  contentChanged = true
}

const appendChar = (char: string) => {
  const textBuffer = document.getElementById("text-buffer")!
  const characters = textBuffer.getElementsByClassName("char")

  // Prevent greater than 3 rows of 16 characters.
  if (characters.length >= 3 * 16) {
    return
  }

  // Create new styled character element
  const newCharacter = document.createElement("span")
  newCharacter.classList.add("char", "cursor", currentKeyboardFont, currentKeyboardColour)
  newCharacter.innerText = char
  newCharacter.onclick = () => moveCursor(newCharacter)

  // Attempt to place the new character after the current cursor character
  for (const character of characters) {
    if (character.classList.contains("cursor")) {
      character.classList.remove("cursor")
      character.insertAdjacentElement("afterend", newCharacter)
      return
    }
  }

  // If no cursor was found then we just append and set the cursor
  textBuffer.appendChild(newCharacter)
}

const removeBackspaceChar = () => {
  const textBuffer = document.getElementById("text-buffer")!
  const characters = textBuffer.getElementsByClassName("char")

  for (const character of characters) {
    if (character.classList.contains("cursor")) {
      if (character.previousElementSibling) {
        character.previousElementSibling.classList.add("cursor")
      }
      character.remove()
      break
    }
  }
}

const moveCursor = (to: HTMLElement) => {
  const textBuffer = document.getElementById("text-buffer")!
  const cursorCharacters = textBuffer.getElementsByClassName("cursor")

  for (const character of cursorCharacters) {
    character.classList.remove("cursor")
  }

  to.classList.add("cursor")
}

const clearBuffer = () => {
  const textBuffer = document.getElementById("text-buffer")!
  while (textBuffer.firstChild) {
    textBuffer.removeChild(textBuffer.lastChild!)
  }
}

const getTextBufferObject = () => {
  // Parallel arrays of style classes to character values 
  let text = []
  let styles = []

  const textBuffer = document.getElementById("text-buffer")!
  const characters = textBuffer.getElementsByClassName("char")

  for (const character of characters) {
    text.push((character as HTMLSpanElement).innerText)
    styles.push(character.classList.value)
  }

  return {
    text,
    styles
  }
}

const renderKeyboard = (layout: string[][]) => {
  const keyboard = document.getElementById("keyboard")!

  // remove all existing layout rows
  while (keyboard.firstChild) {
    keyboard.removeChild(keyboard.lastChild!)
  }

  // create new rows for provided layout
  for (const row of layout) {
    const keyboardRow = document.createElement("section")
    keyboardRow.classList.add("row")
    for (const key of row) {
      const keyboardKey = document.createElement("input")
      keyboardKey.setAttribute("type", "button")
      keyboardKey.value = key
      keyboardKey.onclick = () => handleKeyboardPress(key)
      if (key == "space") {
        keyboardKey.classList.add("space")
      } else if (key.length > 1) {
        keyboardKey.classList.add("special")
      } else {
        keyboardKey.classList.add("key")
      }
      keyboardRow.appendChild(keyboardKey)
    }
    keyboard.appendChild(keyboardRow)
  }
}

renderKeyboard(alphaLayout)

const colourClassOptions = [
  "colour-red",
  "colour-blue",
  "colour-green",
  "colour-purple",
  "colour-orange",
  "colour-yellow"
]

const fontClassOptions = [
  "font-montserrat",
  "font-super-woobly",
  "font-graffiti-youth",
  "font-bebas-neue",
  "font-redoura-serif"
]

const handleToolbarSelectColour = (selectedColourClass: string) => {
  // Set colour of any newly entered text
  currentKeyboardColour = selectedColourClass
  renderToolbar()
}


const handleToolbarSelectFont = (selectedFontClass: string) => {
  // Update keyboard font
  const keyboard = document.getElementById("keyboard")!
  keyboard.classList.add(selectedFontClass)
  for (const fontClass of fontClassOptions) {
    if (fontClass != selectedFontClass) {
      keyboard.classList.remove(fontClass)
    }
  }

  // Set font of any newly enter text
  currentKeyboardFont = selectedFontClass
}

const renderToolbar = () => {
  const toolbar = document.getElementById("toolbar")!

  // remove all existing elements
  while (toolbar.firstChild) {
    toolbar.removeChild(toolbar.lastChild!)
  }

  for (const colourClass of colourClassOptions) {
    const colourOption = document.createElement("div")
    colourOption.onclick = () => handleToolbarSelectColour(colourClass)
    colourOption.classList.add(colourClass, "colour-option")
    if (colourClass == currentKeyboardColour) {
      colourOption.classList.add("colour-selected")
    }
    toolbar.appendChild(colourOption)
  }

  for (const fontClass of fontClassOptions) {
    const fontOption = document.createElement("span")
    fontOption.innerText = "Aa"
    fontOption.onclick = () => handleToolbarSelectFont(fontClass)
    fontOption.classList.add(fontClass, "font-option")
    toolbar.appendChild(fontOption)
  }

  const randomOption = document.createElement("span")
  randomOption.innerText = "🔀"
  randomOption.classList.add("font-option")
  toolbar.appendChild(randomOption)
}

renderToolbar()

// Top bar behaviour

document.getElementById("clear-button")
  ?.addEventListener("click", () => {
    clearBuffer()
  })

document.getElementById("save-button")
  ?.addEventListener("click", () => {
    console.log(getTextBufferObject())
    switchInterfaceState("start")
  })

// Update pushing behaviour

setInterval(async () => {
  const timeSinceLastUpdateSent = Date.now() - lastUpdateSent

  if (currentPostId != null && (contentChanged || timeSinceLastUpdateSent >= updateInterval)) {
    contentChanged = false
    lastUpdateSent = Date.now()
    console.log("Sending update!")

    try {
      const response = await fetch(BASE_URL + "/posts", {
        method: "PATCH",
        body: JSON.stringify({
          id: currentPostId,
          content: getTextBufferObject()
        })
      })
      const body = await response.json()

      if (response.status != 200) {
        alert(body.message)
        currentPostId = null
      } else {
        console.log("Update successful!")
      }
    } catch (error) {
      alert(error)
      currentPostId = null
    }
  }
}, 300);


// Start screen connection behaviour

type InterfaceState = "start" | "editing"

const switchInterfaceState = (state: InterfaceState) => {
  const start = document.getElementById("start")!
  const editor = document.getElementById("editor")!

  if (state == "start") {
    start.style.display = "flex"
    editor.style.display = "none"
  } else if (state == "editing") {
    start.style.display = "none"
    editor.style.display = "grid"
  }
}

const connectButton = document.getElementById("connect-button")! as HTMLInputElement
const connectCode = document.getElementById("connect-code")! as HTMLInputElement

connectButton.addEventListener("click", async () => {
  const code = connectCode.value

  connectButton.disabled = true
  connectCode.disabled = true

  try {
    const response = await fetch(BASE_URL + "/posts", {
      method: "POST",
      body: JSON.stringify({ code })
    })
    const body = await response.json()

    if (response.status == 200) {
      console.log(body.id)
      currentPostId = body.id as string
      connectCode.value = ""
      switchInterfaceState("editing")
    } else {
      alert(body.message)
    }
  } catch (error) {
    alert(error)
  }

  connectButton.disabled = false
  connectCode.disabled = false
})