// Respond to OPTIONS method to enable CORS requests from the installation
export async function onRequestOptions(context) {
  const origin = context.request.headers.get("Origin")

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS, POST, PATCH",
      "Access-Control-Max-Age": "86400",
    },
  });
};

// Add CORS headers to all other API requests
export async function onRequest(context) {
  const response = await context.next();
  const origin = context.request.headers.get("Origin")
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
};