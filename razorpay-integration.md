# Razorpay Payment Integration Guide

This document explains how Razorpay payments work in this Next.js app, why each file exists, and what happens from the moment a user clicks the booking button until the ticket is created in the backend.

The current implementation uses Razorpay Standard Checkout with a secure server-side order and verification flow.

## Big Picture

The booking form does not create a ticket immediately.

Instead, the flow is:

1. User fills the booking form.
2. The browser asks this Next.js app to create a Razorpay order.
3. The Next.js server validates the latest event and ticket price.
4. The Next.js server asks the backend to reserve the requested tickets.
5. The backend atomically decrements `availableTickets` and returns a `reservationId`.
6. The Next.js server creates an order with Razorpay, including `reservationId` in the order notes.
7. The browser opens Razorpay Checkout using the returned order id.
8. The user completes payment in Razorpay.
9. Razorpay returns payment ids and a signature to the browser.
10. The browser sends those details back to this Next.js app.
11. The Next.js server verifies the Razorpay signature.
12. The Next.js server fetches the Razorpay order and checks that the amount and notes match the booking and reservation.
13. The Next.js server fetches the Razorpay payment and checks that it belongs to the verified order.
14. Only after verification succeeds, the Next.js server calls the Express backend to confirm the reservation and create the ticket.

This keeps sensitive payment logic on the server and prevents the frontend from deciding the payment amount.

## Important Files

### Booking Form UI

`app/_features/bookings/components/BookingForm.tsx`

This is the visible booking form. It shows:

- Customer name, email, and phone fields.
- Ticket/pass selection.
- Ticket count.
- Total amount.
- Payment button.

The button text changes to show the amount, for example:

```text
Pay ₹999
```

This is only for user experience. The final trusted amount is recalculated on the server.

### Booking Page

`app/(marketing)/booking/BookingPageClient.tsx`

This component passes event details and ticket types into the booking form and hook.

It also tracks successful bookings using analytics events after the booking status becomes `success`.

### Booking Hook

`app/_hooks/useBookingForm.ts`

This hook controls the full browser-side payment flow.

When the form is submitted, it:

1. Loads Razorpay Checkout script from:

```text
https://checkout.razorpay.com/v1/checkout.js
```

2. Calls:

```text
POST /api/payments/razorpay/order
```

3. Opens Razorpay Checkout.

The checkout options include a public HTTPS logo:

```text
https://www.bharatbhaktisangam.com/logo.png
```

Do not use `localhost`, `127.0.0.1`, private network, or dev-tunnel image URLs for Razorpay Checkout branding. Razorpay renders Checkout from its own origin, so browsers block it from reading loopback/private address-space assets.

4. Receives Razorpay success response:

```ts
{
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
```

5. Sends that response to:

```text
POST /api/payments/razorpay/verify
```

6. Shows success or error UI.

The hook never sees `RAZORPAY_KEY_SECRET`.

### Razorpay Env Helper

`app/_features/payments/razorpay/env.ts`

This file reads Razorpay credentials from environment variables:

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

It imports `server-only`, which means Next.js will prevent this file from being imported into client components.

`RAZORPAY_KEY_SECRET` must never be exposed to the browser.

### Razorpay Server Logic

`app/_features/payments/razorpay/server.ts`

This is the main secure payment logic.

It does four important jobs:

1. Validates booking data.
2. Calculates the trusted amount.
3. Creates and fetches Razorpay orders.
4. Verifies Razorpay signatures.
5. Creates Razorpay orders only after the backend returns a successful reservation.

It also imports `server-only`.

## Capacity Protection

Capacity is checked on the server, not in the browser.

The payment server reads event details from:

```text
GET <API_URL>/event/latest
```

The app also has a no-cache capacity API helper for display and defensive non-reservation checks:

```text
GET <API_URL>/event/latest-capacity
```

The capacity call uses `cache: "no-store"` and must return:

```ts
{
  eventId: string;
  maxSeats: number;
  bookedSeats: number;
  availableTickets: number;
  isSoldOut: boolean;
}
```

For reservation-first checkout, the backend reservation endpoint is the actual inventory gate. If this app ever handles a non-reserved flow, the payment server rejects the request if:

- The latest event id does not match the booking event id.
- The capacity event id does not match the booking event id.
- `isSoldOut` is `true`.
- `availableTickets` is less than the requested ticket count.
- The capacity API is unavailable or returns an invalid payload.

The reservation-first payment flow no longer depends on this public capacity number to protect checkout. It uses the backend reservation endpoint as the inventory gate before Razorpay opens.

Important: this Next.js app does not decrement inventory itself. The production guarantee lives in the Express backend reservation endpoint because only the backend owns booking creation and seat counts. The backend must reserve tickets atomically before this app creates the Razorpay order.

## Preventing Payment When Tickets Run Out

A capacity check immediately before creating a Razorpay order is useful, but it is not enough by itself.

Razorpay Checkout can stay open for seconds or minutes. During that time another customer can complete checkout and consume the last available tickets. If this app only checks capacity again after payment, Razorpay may capture the payment and the backend may then return `Tickets sold out`.

To prevent that, use a reservation-first flow:

1. Browser submits booking details to `POST /api/payments/razorpay/order`.
2. Next.js calls the backend `POST /booking/reservations`.
3. Backend atomically checks `availableTickets >= totalTicket` and decrements `availableTickets`.
4. Backend creates a short-lived reservation, for example 10 minutes.
5. Next.js creates the Razorpay order only after the reservation succeeds.
6. Razorpay order notes include `reservationId`.
7. After payment verification, Next.js calls `POST /booking/create-ticket` with `reservationId` and payment details.
8. Backend converts the reservation into a confirmed ticket.
9. If payment fails, payment is cancelled, or the reservation expires, backend releases the reserved tickets.

With this model, users cannot enter Razorpay payment unless seats have already been reserved for them.

The backend reservation update should be atomic:

```ts
const event = await eventModel.findOneAndUpdate(
  {
    _id: eventId,
    isActive: true,
    availableTickets: { $gte: totalTicket },
  },
  {
    $inc: {
      availableTickets: -totalTicket,
      bookedSeats: totalTicket,
    },
  },
  { new: true, session },
);

if (!event) {
  throw new AppError("Tickets sold out", 400);
}
```

Recommended reservation schema:

```ts
const bookingReservationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    phone: {
      type: Number,
      required: true,
      index: true,
    },
    email: String,
    username: String,
    totalTicket: {
      type: Number,
      required: true,
    },
    ticketType: String,
    status: {
      type: String,
      enum: ["reserved", "confirmed", "released", "expired"],
      default: "reserved",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    orderId: String,
    paymentId: String,
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
      default: null,
    },
  },
  { timestamps: true },
);

bookingReservationSchema.index(
  { eventId: 1, phone: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "reserved" },
  },
);
```

Important reservation rule: the backend needs a cleanup job that finds expired `reserved` records and releases tickets back to `availableTickets`. Do not rely only on MongoDB TTL deletion, because TTL deletion alone will not increment `availableTickets`.

## API Routes

### Create Razorpay Order

`app/api/payments/razorpay/order/route.ts`

Endpoint:

```text
POST /api/payments/razorpay/order
```

The browser sends booking details:

```ts
{
  fullName: string;
  email: string;
  mobile: string;
  tickets: number;
  ticketType: string;
  eventId: string;
}
```

The route then:

1. Validates the request using the booking schema.
2. Loads the latest event from the backend API.
3. Checks that the event id matches the booking request.
4. Checks that booking is active.
5. Finds the selected ticket type.
6. Calculates amount in paise.
7. Calls the backend reservation endpoint.
8. Creates a Razorpay order only if reservation succeeds.
9. Stores `reservationId` in Razorpay order notes.

Razorpay expects the amount in the smallest currency unit.

For INR:

```text
₹500 = 50000 paise
```

The route returns:

```ts
{
  success: true,
  data: {
    orderId: string;
    keyId: string;
    amount: number;
    currency: "INR";
    eventName: string;
    ticketType: string;
    tickets: number;
    reservationId: string;
    reservationExpiresAt?: string;
  }
}
```

`keyId` is safe to send to the browser. Razorpay Checkout needs it.

`keySecret` is not sent to the browser.

### Verify Razorpay Payment

`app/api/payments/razorpay/verify/route.ts`

Endpoint:

```text
POST /api/payments/razorpay/verify
```

The browser sends:

```ts
{
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  booking: {
    fullName: string;
    email: string;
    mobile: string;
    tickets: number;
    ticketType: string;
    eventId: string;
    reservationId: string;
  }
}
```

This route:

1. Validates the request shape.
2. Validates the booking data again.
3. Verifies the Razorpay signature.
4. Rebuilds the expected order details from trusted latest event data and the submitted reservation id.
5. Fetches the Razorpay order from Razorpay.
6. Checks that the Razorpay order amount, currency, event id, ticket type, ticket count, and reservation id match the booking.
7. Fetches the Razorpay payment from Razorpay.
8. Checks that the Razorpay payment order id, amount, and currency match the verified order.
9. Calls the existing Express backend booking API.

If all checks pass, the user sees the booking success screen.

## How Signature Verification Works

After a successful payment, Razorpay sends:

```ts
razorpay_order_id
razorpay_payment_id
razorpay_signature
```

The server creates its own signature using:

```text
order_id + "|" + payment_id
```

and signs it with:

```text
RAZORPAY_KEY_SECRET
```

using HMAC SHA256.

If the generated signature matches `razorpay_signature`, the payment response is authentic.

In this app, signature comparison uses `crypto.timingSafeEqual` to avoid timing-based comparison leaks.

## Why The Amount Is Recalculated Server-Side

Never trust prices from the frontend.

A user can edit browser JavaScript, request payloads, or form values.

So even though the UI shows a price, the server recalculates the amount by:

1. Fetching the latest event.
2. Finding the selected ticket type.
3. Multiplying ticket price by ticket count.
4. Converting the result to paise.

This prevents a user from paying a lower amount by changing frontend data.

## Why The Razorpay Order Is Fetched Again

Signature verification proves that Razorpay returned a valid payment response for an order and payment.

But the app also fetches the Razorpay order and compares it with expected booking data.

This protects against cases where someone tries to reuse a valid order created for a different amount or ticket type.

The server checks:

- Amount
- Currency
- Event id
- Ticket type
- Ticket count

## Express Backend Integration

The final ticket is created by the existing booking service:

`app/_features/bookings/services/booking.service.ts`

That function calls:

```text
<NEXT_PUBLIC_API_URL>/booking/create-ticket
```

with:

```ts
{
  username: payload.fullName;
  eventId: eventId;
  email: payload.email;
  totalTicket: payload.tickets;
  phone: payload.mobile;
}
```

This call only happens after Razorpay verification succeeds.

## Payment Data Sent To The Express Backend

After Razorpay verification succeeds, the Next.js verify route sends payment metadata to the Express backend along with the booking details.

The backend receives:

```ts
{
  username: string;
  eventId: string;
  email: string;
  totalTicket: number;
  phone: string;
  payment: {
    provider: "razorpay";
    orderId: string;
    eventId: string;
    paymentId: string;
    amount: number;
    currency: "INR";
    receipt: string;
    status: "created" | "attempted" | "paid" | "failed" | "refunded";
    phone: number;
    notes: Record<string, string>;
    method?: string;
    email?: string;
    razorpaySignature: string;
    paidAt?: string;
  }
}
```

This matches the important fields from your Mongoose payment schema:

```ts
{
  orderId: string;
  eventId: ObjectId;
  paymentId: string;
  amount: number;
  currency: "INR";
  receipt: string;
  status: "created" | "attempted" | "paid" | "failed" | "refunded";
  phone: number;
  notes: object;
  method?: string;
  email?: string;
  razorpaySignature: string;
  paidAt?: Date;
}
```

The `amount` value is the Razorpay amount in paise.

For example:

```text
₹500 = 50000
```

The backend should either save `payment.amount` as paise or convert it intentionally before saving. Avoid silently mixing rupees and paise.

The `receipt` is the actual receipt returned by Razorpay for the order. The verification route fetches the Razorpay order again and forwards the fetched receipt to the backend.

## Backend Payment Schema

Your Express backend can save the payment data using this Mongoose schema:

```ts
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "events",
    },
    paymentId: {
      type: String,
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    receipt: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["created", "attempted", "paid", "failed", "refunded"],
      default: "created",
    },
    phone: {
      type: Number,
      required: true,
    },
    notes: {
      type: Object,
      default: {},
    },
    method: String,
    email: String,
    razorpaySignature: String,
    paidAt: Date,
    webhookLogs: [
      {
        event: String,
        payload: Object,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
```

### How The Payload Maps To This Schema

The Next.js app sends `payment` inside the booking request. The backend should use that object to create or update a `Payment` document.

Field mapping:

```ts
{
  orderId: payment.orderId,
  eventId: payment.eventId,
  paymentId: payment.paymentId,
  amount: payment.amount,
  currency: payment.currency,
  receipt: payment.receipt,
  status: payment.status,
  phone: payment.phone,
  notes: payment.notes,
  method: payment.method,
  email: payment.email,
  razorpaySignature: payment.razorpaySignature,
  paidAt: payment.paidAt ? new Date(payment.paidAt) : undefined,
}
```

### Why `orderId` Is Unique

`orderId` is marked as `unique: true`.

That is good for production because it prevents the same Razorpay order from creating duplicate payment records. The backend should handle duplicate-key errors gracefully. If the same `orderId` is received again, the backend can fetch or update the existing payment record instead of creating a duplicate.

### Recommended Backend Save Flow

When `/booking/create-ticket` receives a request with `payment`, the backend should:

1. Validate the booking fields.
2. Validate `payment.orderId`, `payment.paymentId`, `payment.amount`, and `payment.status`.
3. Create or upsert the `Payment` record by `orderId`.
4. Create the booking/ticket record.
5. Link the booking record to the payment record if your booking schema supports it.

Example backend idea:

```ts
const paymentDoc = await Payment.findOneAndUpdate(
  { orderId: payment.orderId },
  {
    $set: {
      eventId: payment.eventId,
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      receipt: payment.receipt,
      status: payment.status,
      phone: payment.phone,
      notes: payment.notes,
      method: payment.method,
      email: payment.email,
      razorpaySignature: payment.razorpaySignature,
      paidAt: payment.paidAt ? new Date(payment.paidAt) : undefined,
    },
  },
  {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  },
);
```

### Important Backend Notes

The backend should not trust payment data from an unauthenticated public client by itself.

In this project, the payment object is sent by the Next.js verify route only after:

- Razorpay signature verification succeeds.
- Razorpay order details are fetched from Razorpay.
- Amount, currency, event id, ticket type, and ticket count are matched.
- Razorpay payment details are fetched from Razorpay.
- Razorpay payment order id, amount, and currency are matched against the verified order.
- The Razorpay order reservation id is matched against the booking reservation id.

That makes the Next.js verify route the trusted payment gate before the Express backend saves the payment.

For production reliability, add Razorpay webhooks to the backend. Webhooks let the backend update `status`, `paidAt`, refunds, and `webhookLogs` even if the user closes the browser after payment.

### Required Backend Reservation Contract

The backend must treat `/booking/reservations` as the inventory gate and `/booking/create-ticket` as the reservation confirmation step.

When a reservation request arrives, the backend should do this atomically:

1. Validate booking fields.
2. Check that the phone has no confirmed booking for the event.
3. Reuse an active reservation for the same event and phone when one exists.
4. Decrement `availableTickets` only if enough seats remain.
5. Create the reservation with an expiry timestamp.
6. Commit all changes together.

The exact field names can differ, but the key rule is the same: the capacity check and decrement must happen in one database write condition. Do not read capacity first and update later in separate steps.

When a verified paid booking arrives at `/booking/create-ticket`, the backend should do this atomically:

1. Validate booking, payment, and `reservationId`.
2. Check idempotency by `payment.paymentId` or `payment.orderId`.
3. Reject duplicates by returning the existing booking result instead of creating a second ticket.
4. Verify the reservation is still `reserved`, belongs to the same event and phone, and has not expired.
5. Create the booking/ticket record.
6. Save or update the payment record.
7. Mark the reservation `confirmed` and link it to the booking.
8. Commit all changes together.

The confirmation step should not decrement `availableTickets` again because the reservation already holds those tickets.

With the current backend schemas, `maxSeats` is the original event capacity and `availableTickets` is the remaining saleable inventory. Use `availableTickets` in the atomic condition. `maxSeats` should not be decremented during booking.

Recommended indexes for the provided models:

```ts
bookingSchema.index({ eventId: 1, phone: 1 }, { unique: true });
bookingSchema.index({ u_id: 1 }, { unique: true });
paymentSchema.index({ orderId: 1 }, { unique: true });
paymentSchema.index(
  { paymentId: 1 },
  { unique: true, partialFilterExpression: { paymentId: { $type: "string" } } },
);
```

If an old backend path creates a booking before decrementing `availableTickets`, replace it with the reservation-first flow. Otherwise a sold-out request can leave behind a booking document.

## Environment Variables

Development:

`.env.development`

Production:

`.env.production`

Required:

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Also required for the existing backend calls:

```env
NEXT_PUBLIC_API_URL=
```

Do not prefix the secret with `NEXT_PUBLIC_`.

Bad:

```env
NEXT_PUBLIC_RAZORPAY_KEY_SECRET=
```

Good:

```env
RAZORPAY_KEY_SECRET=
```

Only variables prefixed with `NEXT_PUBLIC_` are meant to be exposed to browser code.

## Content Security Policy

The app has a Content Security Policy in:

`next.config.ts`

Razorpay Checkout needs permission to load scripts and frames.

The CSP allows:

```text
script-src https://checkout.razorpay.com https://cdn.razorpay.com
connect-src https://*.razorpay.com
img-src https://*.razorpay.com
frame-src https://*.razorpay.com
```

If Checkout does not open and the console shows a CSP error, check this file first.

After changing `next.config.ts`, restart the dev server.

## Testing Locally

1. Add Razorpay test credentials to `.env.development`.
2. Restart the Next.js dev server.
3. Open the booking page.
4. Fill the form.
5. Click the payment button.
6. Complete payment in Razorpay test mode.
7. Confirm that the success screen appears.
8. Confirm that the ticket was created in the backend.

## Common Errors

### Razorpay credentials are not configured

Cause:

```env
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
```

are missing.

Fix:

Add them to the correct env file and restart the server.

### Loading checkout.js violates CSP

Cause:

Razorpay is missing from `script-src`.

Fix:

Update `next.config.ts` and restart the server.

### Payment verification failed

Possible causes:

- Invalid signature.
- Wrong Razorpay secret.
- Test key and live key mismatch.
- Tampered payment response.

Fix:

Confirm that the key id and secret are from the same Razorpay mode.

### Payment order does not match the booking details

Possible causes:

- User changed booking data after order creation.
- Ticket price changed between order creation and verification.
- Wrong order id was submitted.

Fix:

Ask the user to retry the booking with fresh event data.

### Payment succeeded, but booking confirmation failed

This means Razorpay payment verification passed, but the Express backend rejected ticket creation.

Possible causes:

- Tickets sold out after payment.
- Phone number already used.
- Backend API error.

The error includes the payment id when available. Use it to manually reconcile the payment in Razorpay Dashboard.

For production, this path should trigger an operational reconciliation workflow: either create the ticket manually after confirming capacity, or refund/cancel the payment from Razorpay and mark the payment record accordingly.

## Production Recommendations

Before going live:

1. Store Razorpay payment metadata in the Express backend.
2. Add Razorpay webhooks for payment capture/refund reconciliation.
3. Make booking creation idempotent using `razorpay_payment_id`.
4. Make capacity reservation atomic in the backend reservation API.
5. Ensure Razorpay Dashboard auto-capture settings are correct.
6. Use live Razorpay keys only in production.
7. Keep test keys out of production.
8. Monitor failed verification and booking-confirmation errors.
9. Add admin tooling to search bookings by Razorpay payment id.

## Mental Model For Beginners

Think of the frontend as the cashier screen.

It can show the user what they are buying, but it is not trusted to decide the final price.

Think of the Next.js API routes as the payment counter.

They talk to Razorpay, verify payment, and only then tell the backend to issue the ticket.

Think of the Express backend as the ticket printer.

It should create tickets only when the payment counter says the payment is verified.

## Source References

Razorpay Standard Checkout:

```text
https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
```

Razorpay Orders API:

```text
https://razorpay.com/docs/api/orders/
```
