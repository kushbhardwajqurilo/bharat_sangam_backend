export const generateTicketHTML = (data) => {
  console.log("tiket data", data);
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bharat Bhakti Sangam Ticket</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: "Poppins", sans-serif;
      font-weight: 600;
    }

    html{
    background: transparent !important;
    }

    body {
      background: transparent !important;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }

    .ticket {
      width: 100%;
      max-width: 450px;
      background:
        radial-gradient(
          circle at 50% 20%,
          rgba(255, 140, 0, 0.15),
          transparent 40%
        ),
        radial-gradient(
          circle at 80% 80%,
          rgba(255, 255, 255, 0.05),
          transparent 50%
        ),
        linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 40%, #000000 100%);
     
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
      border: 1px solid #333;
      position: relative;
    }

    .header {
      text-align: center;
      padding: 25px 20px 15px;
    }

    .logo-placeholder {
      width: 180px;
      height: 80px;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .event-subtitle {
      color: #ffcc00;
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .event-title {
      color: #ff6600;
      font-size: 18px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .event-info {
      padding: 20px;
      display: flex;
      gap: 15px;
    }

    .event-poster {
      width: 90px;
      height: 110px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .event-poster img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .event-details {
      flex: 1;
      color: #fff;
    }

    .event-name {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .event-location {
      font-size: 15px;
      color: #ccc;
      margin-bottom: 8px;
    }

    .event-date {
      font-size: 15px;
      color: #ddd;
      margin-bottom: 8px;
    }

    .event-venue {
      font-size: 14px;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .location-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .qr-section {
      padding: 25px 20px;
      text-align: center;
    }

    .qr-code {
      background: white;
      padding: 15px;
      display: inline-block;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
    }

    .qr-code img {
      width: 220px;
      height: 220px;
    }

    .booking-id {
      position: absolute;
      right: 20px;
      top: 285px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      color: #fff;
      font-size: 13px;
      letter-spacing: 2px;
      transform: rotate(180deg);
    }

    .visitors {
      text-align: center;
      color: #fff;
      font-size: 16px;
      margin: 10px 0 20px;
    }

    .perforation_main {
      position: relative;
      height: 20px;
    }

    .perforation {
      height: 1px;
      background: repeating-linear-gradient(
        90deg,
        #5f5f5f,
        #5f5f5f 10px,
        transparent 10px,
        transparent 20px
      );
      margin: 10px 0;
    }

    .circel_1 {
      width: 25px;
      height: 25px;
      background-color: #000;
      position: absolute;
      top: 50%;
      left: -12px;
      transform: translateY(-50%);
      border-radius: 50%;
      border-right: 1px solid #5f5f5f;
    }

    .circel_2 {
      width: 25px;
      height: 25px;
      background-color: #000;
      position: absolute;
      top: 50%;
      right: -12px;
      transform: translateY(-50%);
      border-radius: 50%;
      border-left: 1px solid #5f5f5f;
    }

    .bottom-section {
      padding: 20px;
      display: flex;
      gap: 15px;
    }

    .band-poster {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .band-poster img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .band-details {
      flex: 1;
      color: #fff;
    }

    .band-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .band-desc {
      font-size: 13px;
      color: #bbb;
      line-height: 1.4;
    }

    .hashtag {
      text-align: right;
      color: #666;
      font-size: 13px;
      margin-top: 10px;
      padding: 0 20px 15px;
    }
  </style>
</head>
<body>

  <div class="ticket">

    <!-- Header -->
    <div class="header">
      <div class="logo-placeholder">
        <img
          src="${data.logo}"
          alt="Bharat Bhakti Logo"
          style="max-width: 100%; max-height: 70px;"
        />
      </div>
    </div>

    <!-- Event Info -->
    <div class="event-info">
      <div class="event-poster">
        <img src="${data.poster}" alt="Event Poster" />
      </div>
      <div class="event-details">
        <div class="event-name">${data.eventName}</div>
        <div class="event-location">${data.location}</div>
        <div class="event-date">${data.date} ${data.time}</div>
        
        <div class="event-venue">
          <svg class="location-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 115.23">
            <defs>
              <style>
                .cls-1 { fill: #212121; }
                .cls-2 { fill: #f44336; }
              </style>
            </defs>
            <path class="cls-1" d="M25.32,75.31a3.59,3.59,0,1,1,0,7.18H18.58L9.7,108.07H112.93l-9.64-25.58H97.72a3.59,3.59,0,0,1,0-7.18h10.7l14.46,39.92H0L13.32,75.31Z"/>
            <path class="cls-2" d="M79.06,83.64A70.16,70.16,0,0,1,63.78,96.28a2.15,2.15,0,0,1-2.45.08,86.21,86.21,0,0,1-21.25-19C32.34,67.69,27.46,56.92,25.8,46.55s-.11-20.63,5.12-28.86a35.35,35.35,0,0,1,7.91-8.76C46.21,3.05,54.64-.06,63,0A34.1,34.1,0,0,1,86,9.38a33.87,33.87,0,0,1,6.13,7.47c5.63,9.27,6.84,21.09,4.37,33.07a72.84,72.84,0,0,1-17.46,33.7v0ZM61.44,18.7A18.06,18.06,0,1,1,43.38,36.76,18.06,18.06,0,0,1,61.44,18.7Z"/>
          </svg>
          ${data.venue}
        </div>
      </div>
    </div>

    <!-- QR Code Section -->
    <div class="qr-section">
      <div class="qr-code">
        <img src="${data.qr}" alt="QR Code" />
      </div>
      <div class="booking-id">BOOKING ID: ${data.u_id}</div>
    </div>

    <div class="visitors">No. of Guests - ${data.visitors}</div>

    <!-- Perforation with Circles -->
    <div class="perforation_main">
      <div class="perforation"></div>
      <div class="circel_1"></div>
      <div class="circel_2"></div>
    </div>

    <!-- Bottom Band Section -->
    <div class="bottom-section">
      <div class="band-poster">
        <img src="${data.artistImage}" alt="North Rock Band" />
      </div>
      <div class="band-details">
        <div class="band-name">${data.artistName || "North Rock Band"}</div>
        <div class="band-desc">${data.artistDesc || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do"}</div>
      </div>
    </div>

    <div class="hashtag">#bharatbhaktisangam</div>

  </div>

</body>
</html>
`;
};
