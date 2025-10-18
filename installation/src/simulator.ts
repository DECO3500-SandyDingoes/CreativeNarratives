import { BASE_URL } from "../../shared/shared"

//// Simulator fullscreen toggle ////

document.addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.body.requestFullscreen()
  }
})

//// PIN Code Handling ////

/**
 * The key used to authenticate the installation with the backend service.
 */
const INSTALLATION_KEY = import.meta.env.INSTALLATION_KEY

/**
 * Generate a new PIN code and update on the backend service.
 */
const updateCode = async () => {
  try {
    const linkPinElement = document.getElementById("link-pin")!
    const response = await fetch(BASE_URL + "/code", {
      method: "GET",
      headers: {
        "X-INSTALLATION-KEY": INSTALLATION_KEY
      },
    })

    const body = await response.json()

    if (response.status == 200 && body.code) {
      linkPinElement.innerText = body.code
    }
  } catch (error) {
    console.error("Failed to get connection code: " + error)
  }
}

// Setup and initial PIN code and then regenerate it every 5 minutes.
updateCode()
setInterval(() => updateCode(), 5000)

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
  const secondBeam = document.getElementById("second-beam")!
  const thirdBeam = document.getElementById("third-beam")!
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
      if (secondBeam.childElementCount <= thirdBeam.childElementCount) {
        secondBeam.prepend(createTextViewElement(post))
      } else {
        thirdBeam.prepend(createTextViewElement(post))
      }
    }
  }

  for (const textview of document.getElementsByClassName("text-viewer")) {
    const lastUpdatedAttribute = textview.getAttribute("last-updated")
    const expiry = Date.now() - 10 * 1000
    if (lastUpdatedAttribute && parseInt(lastUpdatedAttribute) < expiry) {
      console.log(textview.id + " has expired, removing.")
      textview.remove()
    }
  }

  // TODO: Posts beyond the first beam should get moved to the second beam.
}

updatePosts()
setInterval(() => {
  updatePosts()
}, 1000)