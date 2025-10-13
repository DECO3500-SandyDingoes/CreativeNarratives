import './style.css'

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

const handleKeyboardPress = (key: string) => {
  switch (key) {
    case "delete":
    case "break":
    case "space":
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
    default:
      break;
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