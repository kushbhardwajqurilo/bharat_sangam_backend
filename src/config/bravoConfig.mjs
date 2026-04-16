// config/mail.config.mjs

import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

// 🔥 Setup Brevo client
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// ✅ MAIN FUNCTION
export const sendTicketEmailFromBravo = async (email, buffer, u_id, data) => {
  console.log("emails", email);

  console.log("emails data", data);

  try {
    const base64 = buffer.toString("base64");

    const res = await tranEmailApi.sendTransacEmail({
      sender: {
        email: "kushqurilo@gmail.com", // testing
        name: "Bharat Bhakti Sangam",
      },

      to: [{ email }],

      templateId: 2, // 👈 YOUR TEMPLATE ID

      params: {
        id: u_id,
        name: "Kush", // ✅ ADD
        eventName: data.eventName,
        venue: data.venue,
        time: data?.time,
        date: data?.date,

        schedule: data.date, // ✅ ADD

        contact: "+91 1234567890", // ✅ ADD
      },

      // 📎 Download attachment
      attachment: [
        {
          content: base64,
          name: `ticket-${u_id}.png`,
        },
      ],

      // 🖼 Show inside email
      inlineImage: [
        {
          content: base64,
          name: "ticket.png",
          contentId: "ticketImage", // 👈 match template
        },
      ],
    });

    console.log("✅ Email sent:", res);
    return res;
  } catch (err) {
    console.error("❌ Email error:", err.response?.body || err);
  }
};
