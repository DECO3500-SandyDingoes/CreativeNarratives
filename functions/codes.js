export async function onRequestPatch(context) {
  try {
    const installationKey = await context.env.kv.get("INSTALLATION_KEY");
    const requestKey = context.request.headers.get("X-INSTALLATION-KEY")
    const body = await context.request.json()

    if (requestKey == installationKey && body.code) {
      await context.env.kv.put("code", body.code);
      return Response.json(
        {
          message: "Installation code updated."
        }
      )
    } else {
      return Response.json(
        {
          message: "Missing or invalid installation key or code."
        },
        {
          status: 400
        }
      )
    }
  } catch (error) {
    console.error(error)
    return Response.json(
      {
        message: "There was server error."
      },
      {
        status: 500
      }
    )
  }
}
