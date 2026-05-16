// config/mail.config.mjs

import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";
import { catchAsync } from "../utils/handler.mjs";

dotenv.config();
// console.log("ENV Mail", process.env.EMAIL);
//  Setup Brevo client
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

// kush testing for volunteer template
// const client = SibApiV3Sdk.ApiClient.instance;
// client.authentications["api-key"].apiKey = process.env.KUSH_BRAVO_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

//  MAIN FUNCTION
export const sendTicketEmailFromBravo = async (
  email,
  buffer,
  u_id,
  data,
  username,
) => {
  // console.log("emails", email);
  // console.log("emails data", data);

  try {
    const base64 = buffer.toString("base64");

    const res = await tranEmailApi.sendTransacEmail({
      sender: {
        email: `${process.env.ORDER_EMAIL}`, // testing info@bharatbhaktisangam.com
        name: "Bharat Bhakti Sangam",
      },

      to: [{ email }],

      templateId: 1,
      params: {
        id: u_id,
        name: username, // ✅ ADD
        eventName: data.eventName,
        venue: data.venue,
        time: data?.time,
        date: data?.date,

        schedule: data.date, // ✅ ADD

        contact: `${process.env.CONTACT}`, // ✅ ADD
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

const volunteerEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export const volunteerEmailSend = catchAsync(
  async (username, email, password) => {
    const res = await volunteerEmailApi.sendTransacEmail({
      sender: {
        email: process.env.INFO_EMAIL,
        name: "Bharat Bhakti Sangam",
      },
      to: [{ email }],
      templateId: 4,
      params: {
        username,
        email,
        password,
      },
    });

    return res;
  },
);

export const personalMailMessage = async (subject, body, email, attachment) => {
  // console.log({ subject, body, email, attachment });
  try {
    const res = await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.INFO_EMAIL,
        name: "Bharat Bhakti Sangam",
      },
      to: [{ email }],
      templateId: 7,
      params: {
        subject: subject,
        body: body,
      },
      attachment: [
        {
          content: attachment?.base64Content,
          name: attachment?.name,
        },
      ],
    });
    if (res.messageId.trim() === "") {
      return false;
    } else return true;
  } catch (error) {
    console.error("❌ Email error:", error.response?.body || error);
  }
};
