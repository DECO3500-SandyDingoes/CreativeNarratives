import './style.css'
import { helloShared } from "../../shared/shared";


const message = document.getElementById("message")
if (message) {
  message.innerText = helloShared("installation")
}


