export async function onRequestGet(context) {
  const query = context.env.db.prepare("SELECT * FROM stories")
  const results = await query.raw()
  return Response.json(results)
}

export async function onRequestPost(context) {
  const currentCode = await context.env.kv.get("code");
  const body = await context.request.json()
  const timestamp = Date.now()

  if (body.code == currentCode) {
    try {
      const result = await context.env.db
        .prepare("INSERT INTO stories (timestamp, content) VALUES (?, ?)")
        .bind(timestamp, JSON.stringify(body.content))
        .run()

      if (result.success) {
        return Response.json(
          {
            message: "Story received successfully.",
            timestamp,
          }
        )
      } else {
        return Response.json(
          {
            message: "Failed to record story on backend.",
          }
        )
      }
    } catch (error) {
      console.error(error)
      return Response.json(
        {
          message: "There was a database error."
        },
        {
          status: 500
        }
      )
    }
  } else {
    return Response.json(
      {
        message: "The code " + body.code + " has expired or was invalid."
      },
      {
        status: 400
      }
    )
  }
}