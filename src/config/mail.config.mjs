import nodemailer from "nodemailer";

export const sendTicketEmail = async (email, buffer, u_id) => {
  console.log("email", email);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "kushbhardwaj8800@gmail.com",
      pass: "uogewzjkcrdioxoc", // not normal password
    },
  });

  await transporter.sendMail({
    from: "kushbhardwaj8800@gmail.com",
    to: email,
    subject: "🎟️ Your Event Ticket",
    html: `<h2>Your Ticket (ID: ${u_id})</h2><p>Show this at entry.</p>`,
    attachments: [
      {
        filename: "ticket.png",
        content: buffer,
      },
    ],
  });
};
