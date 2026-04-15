import jwt from "jsonwebtoken";
export const generateQRToken = (ticket) => {
  return jwt.sign(
    {
      ticketId: ticket.ticketId,
      eventId: ticket.eventId,
      user: ticket.username,
      email: ticket.useremail,
      isVarify: ticket.verify,
    },
    process.env.TICKET_SECRET,
    { expiresIn: "12h" },
  );
};
