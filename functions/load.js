export async function onRequest(context) {
  const hits = await context.env.data.get("hits")
  return new Response("Hits: " + hits);
}