import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const triageSchema = z.object({
  intakeType: z.enum(["emergency", "quote", "maintenance"]),
  name: z.string().min(2),
  email: z.string().email(),
  environment: z.string().optional(),
  contractReference: z.string().optional(),
  message: z.string().min(10),
  company: z.string().optional()
});

function getRecipient(intakeType: "emergency" | "quote" | "maintenance") {
  if (intakeType === "emergency") return "technical@kharon.co.za";
  if (intakeType === "maintenance") return "maintenance@kharon.co.za";
  return "engineering@kharon.co.za";
}

function getPriority(intakeType: "emergency" | "quote" | "maintenance") {
  if (intakeType === "emergency") return "emergency";
  if (intakeType === "maintenance") return "scheduled";
  return "standard";
}

function createTicketId() {
  return `KH-${Date.now()}`;
}

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const payload = Object.fromEntries(formData.entries());

  const parsed = triageSchema.safeParse(payload);

  if (!parsed.success) {
    return new Response("Invalid intake submission.", { status: 400 });
  }

  if (parsed.data.company) {
    return new Response("Submission accepted.", { status: 200 });
  }

  const routedTo = getRecipient(parsed.data.intakeType);

  const ticket = {
    id: createTicketId(),
    createdAt: new Date().toISOString(),
    intakeType: parsed.data.intakeType,
    priority: getPriority(parsed.data.intakeType),
    status: "new",
    name: parsed.data.name,
    email: parsed.data.email,
    environment: parsed.data.environment,
    contractReference: parsed.data.contractReference,
    message: parsed.data.message,
    routedTo
  };

  console.log("SLA ticket created:", ticket);

  return new Response(JSON.stringify({ ok: true, ticket }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
};