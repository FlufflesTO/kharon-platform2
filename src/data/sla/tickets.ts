export type TicketPriority = "emergency" | "standard" | "scheduled";

export type TicketStatus =
  | "new"
  | "triaged"
  | "assigned"
  | "in-progress"
  | "resolved"
  | "closed";

export type SlaTicket = {
  id: string;
  createdAt: string;
  intakeType: "emergency" | "quote" | "maintenance";
  priority: TicketPriority;
  status: TicketStatus;
  name: string;
  email: string;
  environment?: string;
  contractReference?: string;
  message: string;
  routedTo: string;
};