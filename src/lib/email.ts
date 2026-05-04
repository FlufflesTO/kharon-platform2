export function getTicketRecipient(type: string): string {
  if (type === 'emergency') return 'technical@kharon.co.za';
  if (type === 'quote') return 'engineering@kharon.co.za';
  if (type === 'maintenance') return 'maintenance@kharon.co.za';
  return 'technical@kharon.co.za';
}

export async function sendEmail(env: any, payload: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return { skipped: true, reason: 'Missing email env vars' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html
    })
  });

  if (!res.ok) {
    return { skipped: false, error: await res.text() };
  }

  return await res.json();
}

export async function sendTicketCreatedEmail(env: any, ticket: any) {
  const to = getTicketRecipient(ticket.type);

  return sendEmail(env, {
    to,
    subject: 'Kharon SLA Ticket: ' + ticket.type + ' / ' + ticket.priority,
    html:
      '<h1>New SLA Ticket</h1>' +
      '<p><strong>Type:</strong> ' + ticket.type + '</p>' +
      '<p><strong>Priority:</strong> ' + ticket.priority + '</p>' +
      '<p><strong>Name:</strong> ' + ticket.name + '</p>' +
      '<p><strong>Email:</strong> ' + ticket.email + '</p>' +
      '<p><strong>Message:</strong> ' + ticket.message + '</p>' +
      '<p><strong>SLA Due:</strong> ' + ticket.sla_due_at + '</p>'
  });
}
