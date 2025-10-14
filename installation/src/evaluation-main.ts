import { BASE_URL } from "../../shared/shared"

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

const createTextViewElement = (post: Post) => {
  const textview = document.createElement("article")
  textview.id = post.id
  textview.setAttribute("last-updated", String(post.updated_time))
  textview.classList.add("text-viewer")

  if (post.content && post.content.text && post.content.styles) {
    for (let index = 0; index < post.content.text.length; index++) {
      const character = post.content.text[index];
      const styles = post.content.styles[index];

      const styledCharacter = document.createElement("span")
      styledCharacter.innerText = character
      styledCharacter.classList.value = styles

      textview.appendChild(styledCharacter)
    }
  }

  return textview
}

const updateTextViewElement = (textview: HTMLElement, post: Post) => {
  const lastUpdatedAttribute = textview.getAttribute("last-updated")

  // Only update text with a last updated attribute
  if (lastUpdatedAttribute) {

    // Update if this is the last update of if the update 
    // contrent is newer than the element content
    const lastUpdated = parseInt(lastUpdatedAttribute)
    if (post.updated_time == null || post.updated_time > lastUpdated) {
      textview.innerText = ""
      for (let index = 0; index < post.content.text.length; index++) {
        const character = post.content.text[index];
        const styles = post.content.styles[index];

        const styledCharacter = document.createElement("span")
        styledCharacter.innerText = character
        styledCharacter.classList.value = styles

        textview.appendChild(styledCharacter)
      }

      // If the updated time was null then there will be no more updates
      // so we remove the last updated attribute. Otherwise, just
      // set the new updated time.
      if (post.updated_time == null) {
        textview.removeAttribute("last-updated")
      } else {
        textview.setAttribute("last-updated", String(post.updated_time))
      }
    }
  }
}

const updatePosts = async () => {
  const response = await fetch(BASE_URL + "/posts", {
    method: "GET",
    headers: {
      "X-INSTALLATION-KEY": INSTALLATION_KEY,
    }
  })



  const posts = await response.json() as Post[]

  posts.sort((a, b) => a.created_time - b.created_time)

  for (const post of posts) {
    const textview = document.getElementById(post.id)

    if (textview) {
      // Update existing text
      updateTextViewElement(textview, post)
    } else {
      // Create new text
      postGrid.prepend(createTextViewElement(post))
    }
  }


}

updatePosts()
setInterval(() => {
  updatePosts()
}, 1000)