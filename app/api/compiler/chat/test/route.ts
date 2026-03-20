export async function GET() {
  return Response.json({
    status: "ok",
    env: {
      hasGroq: !!process.env.GROQ_API_KEY,
      nodeVersion: process.version,
    }
  });
}
