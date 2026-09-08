import crypto from "crypto";
import Payment from "../models/payment.model.mjs";
import BookingReservation from "../models/bookingReserveModel.mjs";
import eventModel from "../models/eventModel.js";
import { RAZORPAY_WEBHOOK_SECRET } from "../config/razorpay.config.mjs";

/**
 * Razorpay Webhook Handler for asynchronous events:
 * - payment.captured
 * - payment.failed
 * - refund.processed
 */
export const handleRazorpayWebhook = async (req, res) => {
  const webhookSignature = req.headers["x-razorpay-signature"];

  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.warn("⚠️ RAZORPAY_WEBHOOK_SECRET is not configured");
    return res.status(200).json({ status: "ignored_no_secret" });
  }

  if (!webhookSignature) {
    return res.status(400).json({ error: "Missing signature header" });
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    const isMatch =
      expectedSignature.length === webhookSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf8"),
        Buffer.from(webhookSignature, "utf8"),
      );

    if (!isMatch) {
      console.error("❌ Invalid Razorpay webhook signature");
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const { event, payload } = req.body;
    console.log(`🔔 Razorpay Webhook received: ${event}`);

    const paymentEntity = payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;

    if (orderId) {
      const paymentDoc = await Payment.findOne({ orderId });

      if (paymentDoc) {
        paymentDoc.webhookLogs = paymentDoc.webhookLogs || [];
        paymentDoc.webhookLogs.push({
          event,
          payload,
          createdAt: new Date(),
        });

        if (event === "payment.captured") {
          paymentDoc.status = "paid";
          paymentDoc.paymentId = paymentId || paymentDoc.paymentId;
          paymentDoc.method = paymentEntity?.method || paymentDoc.method;
          paymentDoc.paidAt = paymentDoc.paidAt || new Date();
        } else if (event === "payment.failed") {
          if (paymentDoc.status !== "paid") {
            paymentDoc.status = "failed";
          }
        } else if (event === "refund.processed") {
          paymentDoc.status = "refunded";
        }

        await paymentDoc.save();
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return res.status(500).json({ error: "Webhook internal error" });
  }
};
