import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = (locals as any).runtime.env.DB;

    const { results } = await db
      .prepare("SELECT * FROM tickets ORDER BY created_at DESC")
      .all();

    return new Response(JSON.stringify(results), {
      status: 200
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: 'DB fetch failed',
      details: String(err)
    }), {
      status: 500
    });
  }
};
