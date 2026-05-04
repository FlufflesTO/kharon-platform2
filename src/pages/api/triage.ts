import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const triageSchema = z.object({
  intakeType: z.enum(['emergency', 'quote', 'maintenance']),
  name: z.string().min(2),
  email: z.string().email(),
  environment: z.string().optional(),
  contractReference: z.string().optional(),
  message: z.string().min(10),
  company: z.string().optional()
});

function getRecipient(intakeType: 'emergency' | 'quote' | 'maintenance') {
  if (intakeType === 'emergency') return 'technical@kharon.co.za';
  if (intakeType === 'maintenance') return 'maintenance@kharon.co.za';
  return 'engineering@kharon.co.za';
}

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const payload = Object.fromEntries(formData.entries());

  const parsed = triageSchema.safeParse(payload);

  if (!parsed.success) {
    return new Response('Invalid intake submission.', { status: 400 });
  }

  if (parsed.data.company) {
    return new Response('Submission accepted.', { status: 200 });
  }

  const recipient = getRecipient(parsed.data.intakeType);

  console.log('Kharon triage submission', {
    recipient,
    ...parsed.data
  });

  return new Response(
    JSON.stringify({
      ok: true,
      routedTo: recipient,
      intakeType: parsed.data.intakeType
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};