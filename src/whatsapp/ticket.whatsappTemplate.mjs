import dotenv from "dotenv";
dotenv.config();
async function sendWhatsAppTemplate({
  to,
  from,
  authorization,
  placeholders = [],
  mediaUrl,
  filename,
}) {
  if (!to) {
    throw new Error("WhatsApp recipient number is required");
  }

  console.log({
    to,
    from,
    authorization,
    placeholders,
    mediaUrl,
    filename,
  });
  try {
    const response = await fetch(
      `${process.env.WHATSAPP_TICKET_TEMPLATE_API_URL}`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          Authorization: authorization,
        },
        body: JSON.stringify({
          messages: [
            {
              to,
              from,
              content: {
                templateName: `${process.env.WHATSAPP_TICKET_TEMPLATE_NAME}`,
                language: "en",
                templateData: {
                  header: {
                    type: "IMAGE",
                    mediaUrl,
                    filename,
                  },
                  body: {
                    placeholders,
                  },
                  buttons: [
                    {
                      type: "URL",
                    },
                  ],
                },
              },
            },
          ],
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    console.log("Message Sent:", data);
    const message = data?.messages?.[0];
    if (message) {
      const validStatuses = ["SENT", "DELIVERED", "ENQUEUED"];

      if (!validStatuses.includes(message.status)) {
        console.warn(
          "WhatsApp message may not have been sent. Unexpected status:",
          message,
        );
      } else {
        console.log(
          "✅ Message successfully queued/sent. Status:",
          message.status,
        );
      }
    }
    return data;
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}
export default sendWhatsAppTemplate;
// sendWhatsAppTemplate({
//   from: "+918796086743",
//   to: "+919654165886",
//   authorization: process.env.WHATSAPP_TICKET_KEY,
//   mediaUrl:
//     "https://res.cloudinary.com/dqwc7j44b/image/upload/v1777468481/uploads/d5nfxbemknnicb0ekpga.png",
//   filename: "sample.png",
//   placeholders: [
//     "kush bhardwaj",
//     "Bharat bhakti sangam",
//     "gurugram haryana",
//     "14 June 2026",
//     "05:30PM To 10:00PM",
//     "5",
//     "BBS123345678",
//   ],
// });
//
