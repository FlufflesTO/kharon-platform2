export const prerender = false;
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const ticket = {
    id,
    type: body.type || 'general',
    status: 'open',
    priority: body.priority || 'normal',
    created_at: now,
    updated_at: now,
    name: body.name || '',
    email: body.email || '',
    message: body.message || '',
    assigned_to: ''
  };

  try {
    const db = (locals as any).runtime.env.DB;

    await db
      .prepare("INSERT INTO tickets (id, type, status, priority, created_at, updated_at, name, email, message, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(
        ticket.id,
        ticket.type,
        ticket.status,
        ticket.priority,
        ticket.created_at,
        ticket.updated_at,
        ticket.name,
        ticket.email,
        ticket.message,
        ticket.assigned_to
      )
      .run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: 'DB insert failed',
      details: String(err)
    }), {
      status: 500
    });
  }
};
