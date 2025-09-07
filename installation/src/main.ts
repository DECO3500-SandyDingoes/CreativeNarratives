import './style.css'
import { helloShared } from "../../shared/shared";
import { Rect, StaticCanvas, Textbox } from 'fabric';


const message = document.getElementById("message")
if (message) {
  message.innerText = helloShared("installation")
}

let angle = 0

const initFrontCanvas = () => {
  const canvasElement = (document.getElementById("front-canvas") as HTMLCanvasElement)
  if (canvasElement) {
    const canvas = new StaticCanvas(canvasElement, { width: 800, height: 30 })

    const text = new Textbox("What's going on?",
      {
        top: 5,
        left: 400,
        width: 200,
        fontSize: 20,
        fill: "white",
      }
    )

    const rectangle = new Rect({ top: 10, left: 10, width: 10, height: 10, fill: "red" })

    setInterval(() => {
      angle += 1
      rectangle.rotate(angle)
      canvas.renderAll()
    }, .1)

    canvas.add(rectangle, text)
  }
}

initFrontCanvas()


