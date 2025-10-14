export async function onRequestGet(context) {
  // TODO: Expire any posts which haven't been updated recently, ignoring post with null update times.

  try {
    const installationKey = await context.env.kv.get("INSTALLATION_KEY");
    const requestKey = context.request.headers.get("X-INSTALLATION-KEY")

    if (requestKey == installationKey) {
      const result = await context.env.db.prepare("SELECT * FROM posts ORDER BY created_time DESC LIMIT 50").run()

      // De-stringify (parse) content structure back into an object. 
      const posts = result.results.map(post => ({ ...post, content: JSON.parse(post.content) }))

      return Response.json(posts)
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

  if (body.code == currentCode) {
    const createdTime = Date.now()
    const postId = crypto.randomUUID()
    const initialContent = {}

    try {
      const result = await context.env.db
        .prepare("INSERT INTO posts (id, created_time, updated_time, content) VALUES (?, ?, ?, ?)")
        .bind(postId, createdTime, createdTime, JSON.stringify(initialContent))
        .run()

      if (result.success) {
        return Response.json(
          {
            message: "Post created successfully.",
            id: postId
          }
        )
      } else {
        return Response.json(
          {
            message: "Failed to create post backend.",
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

export async function onRequestPatch(context) {
  // TODO: Add a saved property, that when true sets the updated_time to null so that
  // the post won't expire.

  const body = await context.request.json()

  const post = await context.env.db.prepare("SELECT * FROM posts WHERE id = ?")
    .bind(body.id)
    .first()

  if (post && body.content) {
    const updatedTime = Date.now()

    try {
      const result = await context.env.db
        .prepare("UPDATE posts SET updated_time = ?,  content = ? WHERE id = ?")
        .bind(body.save ? null : updatedTime, JSON.stringify(body.content), post.id)
        .run()

      if (result.success) {
        return Response.json(
          {
            message: "Post updated successfully.",
          }
        )
      } else {
        return Response.json(
          {
            message: "Failed to update post.",
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
        message: "Post with " + body.id + " was not found."
      },
      {
        status: 404
      }
    )
  }
}