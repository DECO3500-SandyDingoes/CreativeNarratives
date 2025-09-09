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
    const canvas = new StaticCanvas(canvasElement, { width: 600, height: 20 })

    const text = new Textbox("Lorem ipsum, dolor sit amet consectetur adipisicing elit. Consequatur, ipsa!",
      {
        top: -2,
        left: 40,
        width: 600,
        fontSize: 20,
        fill: "transparent",
        stroke: "limegreen",
        strokeWidth: 0.25,
      }
    )

    canvas.add(text)

    // const rectangle = new Rect({ top: 0, left: 40, width: 40, height: 40, fill: "red" })

    // setInterval(() => {
    //   angle += 1
    //   rectangle.rotate(angle)
    //   canvas.renderAll()
    // }, .1)

    // canvas.add(rectangle)
  }
}

initFrontCanvas()


