document.getElementById("connect-button")
  ?.addEventListener("click", () => {
    const code = (document.getElementById("connect-code")! as HTMLInputElement).value
    // TODO: Request content ID from API here and redirect to editor
    window.location.assign("editor.html")
  })