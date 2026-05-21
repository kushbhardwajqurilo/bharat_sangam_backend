import nodemailer from "nodemailer";
import { forgotMail } from "../templates/forgotMailTemplate.mjs";

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

export const sendForgetTemplateEmail = async (email, url) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: "kushbhardwaj8800@gmail.com",
        pass: "uogewzjkcrdioxoc",
      },

      tls: {
        rejectUnauthorized: false,
      },
    });

    const result = await transporter.sendMail({
      from: process.env.FORGET_EMAIL,
      to: email,
      subject: "Forgot Password",
      html: await forgotMail(url),
    });
    // console.log("result", result);
    // console.log("✅ Email sent successfully");
  } catch (error) {
    console.log("❌ Mail Error:", error);
  }
};
