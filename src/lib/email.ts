import type { Env } from '../types/env';

export function getTicketRecipient(type: string): string {
  if (type === 'emergency') return 'technical@kharon.co.za';
  if (type === 'quote') return 'engineering@kharon.co.za';
  if (type === 'maintenance') return 'maintenance@kharon.co.za';
  return 'technical@kharon.co.za';
}

async function sendEmail(env: Env, payload: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.log('Email skipped (missing env)');
    return { skipped: true };
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
    console.error('Email failed:', await res.text());
    return { error: true };
  }

  return await res.json();
}

export async function sendInternalTicketEmail(env: Env, ticket: any) {
  return sendEmail(env, {
    to: getTicketRecipient(ticket.type),
    subject: 'New SLA Ticket: ' + ticket.type + ' / ' + ticket.priority,
    html:
      '<h1>New Ticket</h1>' +
      '<p><strong>Name:</strong> ' + ticket.name + '</p>' +
      '<p><strong>Email:</strong> ' + ticket.email + '</p>' +
      '<p><strong>Message:</strong> ' + ticket.message + '</p>' +
      '<p><strong>SLA Due:</strong> ' + ticket.sla_due_at + '</p>'
  });
}

export async function sendClientConfirmation(env: Env, ticket: any) {
  return sendEmail(env, {
    to: ticket.email,
    subject: 'Kharon Request Received',
    html:
      '<h1>Request Received</h1>' +
      '<p>We have received your request and will respond according to SLA.</p>' +
      '<p><strong>Type:</strong> ' + ticket.type + '</p>' +
      '<p><strong>Priority:</strong> ' + ticket.priority + '</p>' +
      '<p><strong>SLA Due:</strong> ' + ticket.sla_due_at + '</p>'
  });
}
