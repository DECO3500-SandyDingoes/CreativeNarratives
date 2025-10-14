import { BASE_URL } from "../../shared/shared"
import "./text-styles.css"

//// Simulator fullscreen toggle ////

const postGrid = document.getElementById("post-grid")!
postGrid.addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    postGrid.requestFullscreen()
  }
})

//// Connection Code Handling ////

/**
 * The key used to authenticate the installation with the backend service.
 */
const INSTALLATION_KEY = import.meta.env.INSTALLATION_KEY

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
 * Contains the current connection code that the installation will accept submissions from.
 */
let code = ""

/**
 * Generate a new connection code and update on the backend service.
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
        console.error("Failed to update connection code on backend.")
      }
    })
    .catch(error => {
      console.error("connection Code update request failed: " + error)
    })
}

// Setup and initial connection code and then regenerate it every 5 minutes. 
updateCode()
setInterval(() => updateCode(), 5 * 60 * 1000)

//// Content Handling ////

interface Post {
  id: string
  created_time: number
  updated_time: number | null
  content: Content
}

interface Content {
  text: string[]
  styles: string[]
}

const loadPosts = async () => {
  const response = await fetch(BASE_URL + "/posts", {
    method: "GET",
    headers: {
      "X-INSTALLATION-KEY": INSTALLATION_KEY,
    }
  })

  const posts = await response.json() as Post[]
  console.log(posts)

  for (const post of posts) {
    const postElement = document.createElement("article")

    for (let index = 0; index < post.content.text.length; index++) {
      const character = post.content.text[index];
      const styles = post.content.styles[index];

      const styledCharacter = document.createElement("span")
      styledCharacter.innerText = character
      styledCharacter.classList.value = styles

      postElement.appendChild(styledCharacter)
    }

    postGrid.appendChild(postElement)
  }


}

loadPosts()