export async function onRequestGet(context) {
  try {
    const installationKey = await context.env.kv.get("INSTALLATION_KEY");
    const { searchParams } = new URL(context.request.url)
    const requestKey = context.request.headers.get("X-INSTALLATION-KEY")

    if (requestKey == installationKey) {
      if (searchParams.has("timestamp")) {
        const result = await context.env.db
          .prepare("SELECT * FROM stories WHERE timestamp >= ? ORDER BY timestamp DESC")
          .bind(searchParams.get("timestamp"))
          .run()
        return Response.json(result.results)
      } else {
        const result = await context.env.db.prepare("SELECT * FROM stories ORDER BY timestamp DESC LIMIT 100").run()
        return Response.json(result.results)
      }
    } else {
      return Response.json(
        {
          message: "Missing or invalid installation key."
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
        message: "There was a database error."
      },
      {
        status: 500
      }
    )
  }
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