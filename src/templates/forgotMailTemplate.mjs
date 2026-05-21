export const forgotMail = async (data) => {
  return `
  <!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Reset Your Password – Bharat Bhakti Sangam</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Nunito:wght@300;400;600;700&family=DM+Mono:wght@400;500&display=swap");

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family:
          "Nunito",
          -apple-system,
          BlinkMacSystemFont,
          sans-serif;
        background-color: #0d0603;
        color: #f0e8d8;
        -webkit-font-smoothing: antialiased;
      }

      .email-wrapper {
        background: radial-gradient(ellipse at top, #1a0a02 0%, #0d0603 60%);
        padding: 48px 16px;
        min-height: 100vh;
      }

      .email-container {
        max-width: 600px;
        margin: 0 auto;
      }

      /* ── Header ── */
      .header {
        text-align: center;
        padding: 0 0 28px;
      }

      .logo-wrap {
        display: inline-flex;
        align-items: center;
        gap: 12px;
      }

      .logo-icon {
        width: 42px;
        height: 42px;
      }

      .logo-text {
        font-family: "Cinzel", serif;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 1px;
        color: #f5c842;
        line-height: 1.3;
        text-align: left;
      }

      .logo-sub {
        font-family: "Nunito", sans-serif;
        font-size: 10px;
        font-weight: 400;
        letter-spacing: 2.5px;
        text-transform: uppercase;
        color: #c8791a;
        display: block;
      }

      /* ── Om Divider ── */
      .om-divider {
        text-align: center;
        margin-bottom: 4px;
      }
      .om-divider span {
        font-size: 18px;
        color: #c8791a;
        opacity: 0.9;
        letter-spacing: 8px;
      }

      /* ── Card ── */
      .card {
        background: linear-gradient(
          160deg,
          #1c0d04 0%,
          #110702 50%,
          #0e0502 100%
        );
        border: 1px solid #3d1f08;
        border-radius: 20px;
        overflow: hidden;
        box-shadow:
          0 0 0 1px rgba(245, 200, 66, 0.08),
          0 0 80px rgba(200, 90, 20, 0.12),
          0 32px 80px rgba(0, 0, 0, 0.7),
          inset 0 1px 0 rgba(245, 200, 66, 0.06);
      }

      /* ── Hero ── */
      .hero {
        background:
          radial-gradient(
            ellipse at 50% -20%,
            rgba(200, 90, 20, 0.28) 0%,
            transparent 65%
          ),
          linear-gradient(180deg, #200d03 0%, #160802 100%);
        padding: 52px 48px 44px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      /* Decorative mandala ring */
      .hero::before {
        content: "";
        position: absolute;
        top: -60px;
        left: 50%;
        transform: translateX(-50%);
        width: 280px;
        height: 280px;
        border-radius: 50%;
        border: 1px solid rgba(245, 200, 66, 0.08);
        box-shadow:
          0 0 0 20px rgba(245, 200, 66, 0.03),
          0 0 0 40px rgba(245, 200, 66, 0.02);
        pointer-events: none;
      }

      .hero::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(245, 200, 66, 0.35),
          transparent
        );
      }

      .lock-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 76px;
        height: 76px;
        border-radius: 50%;
        background: linear-gradient(
          135deg,
          #e07820 0%,
          #c8540a 50%,
          #a33c05 100%
        );
        margin-bottom: 24px;
        box-shadow:
          0 0 0 8px rgba(200, 90, 20, 0.12),
          0 0 0 16px rgba(200, 90, 20, 0.05),
          0 8px 32px rgba(200, 90, 20, 0.45);
        position: relative;
        z-index: 1;
      }

      .lock-badge svg {
        width: 32px;
        height: 32px;
      }

      .hero-tag {
        font-family: "DM Mono", monospace;
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: #c8791a;
        margin-bottom: 12px;
        position: relative;
        z-index: 1;
      }

      .hero-title {
        font-family: "Cinzel", serif;
        font-size: 28px;
        font-weight: 700;
        color: #f5c842;
        letter-spacing: 0.5px;
        line-height: 1.25;
        margin-bottom: 12px;
        position: relative;
        z-index: 1;
      }

      .hero-subtitle {
        font-size: 14px;
        color: #c8976a;
        font-weight: 400;
        line-height: 1.7;
        position: relative;
        z-index: 1;
      }

      /* ── Body ── */
      .body {
        padding: 44px 48px;
      }

      .greeting {
        font-family: "Cinzel", serif;
        font-size: 16px;
        font-weight: 600;
        color: #f0d090;
        margin-bottom: 18px;
      }

      .body-text {
        font-size: 14px;
        color: #c8a882;
        line-height: 1.8;
        margin-bottom: 18px;
        font-weight: 400;
      }

      .body-text u {
        color: #e0a040;
        text-decoration-color: rgba(224, 160, 64, 0.4);
      }

      /* ── Info Box ── */
      .info-box {
        background: rgba(200, 90, 20, 0.06);
        border: 1px solid rgba(200, 90, 20, 0.25);
        border-left: 3px solid #c8791a;
        border-radius: 10px;
        padding: 16px 20px;
        margin: 28px 0;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .info-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        margin-top: 2px;
      }

      .info-text {
        font-size: 13px;
        color: #c09060;
        line-height: 1.65;
      }

      .info-text strong {
        color: #f0b050;
        font-weight: 700;
      }

      /* ── CTA ── */
      .cta-wrap {
        text-align: center;
        margin: 36px 0 32px;
      }

      .cta-btn {
        display: inline-block;
        background: linear-gradient(
          135deg,
          #e07820 0%,
          #c8540a 60%,
          #a33c05 100%
        );
        color: #fff5e0 !important;
        text-decoration: none;
        font-family: "Cinzel", serif;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        padding: 17px 52px;
        border-radius: 50px;
        box-shadow:
          0 0 0 1px rgba(245, 200, 66, 0.2),
          0 8px 28px rgba(200, 90, 20, 0.5),
          0 2px 8px rgba(0, 0, 0, 0.4);
      }

      /* ── Expiry Strip ── */
      .expiry-strip {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        background: rgba(245, 200, 66, 0.05);
        border: 1px solid rgba(245, 200, 66, 0.18);
        border-radius: 8px;
        padding: 13px 20px;
        margin: 0 0 32px;
      }

      .expiry-strip svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .expiry-text {
        font-size: 13px;
        color: #d4a840;
        font-weight: 600;
      }
      .expiry-text strong {
        color: #f5c842;
      }

      /* ── Divider ── */
      .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, #3d1f08, transparent);
        margin: 32px 0;
        position: relative;
      }
      .divider-om {
        text-align: center;
        margin: -20px 0 0;
        position: relative;
        z-index: 2;
      }
      .divider-om span {
        background: #110702;
        padding: 0 12px;
        font-size: 16px;
        color: #c8791a;
      }

      /* ── Fallback ── */
      .fallback-section {
        background: #0a0401;
        border: 1px solid #2a1005;
        border-radius: 10px;
        padding: 20px 24px;
        margin-bottom: 28px;
      }

      .fallback-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #a06030;
        margin-bottom: 10px;
      }

      .fallback-url {
        font-family: "DM Mono", monospace;
        font-size: 11px;
        color: #c8791a;
        word-break: break-all;
        line-height: 1.7;
      }

      /* ── Security Grid ── */
      .security-grid {
        display: table;
        width: 100%;
      }
      .security-row {
        display: table-row;
      }

      .security-item {
        display: table-cell;
        width: 50%;
        padding: 12px 16px 12px 0;
        vertical-align: top;
      }
      .security-item:last-child {
        padding-right: 0;
      }

      .sec-icon-wrap {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 5px;
      }

      .sec-icon {
        width: 14px;
        height: 14px;
      }
      .sec-title {
        font-size: 12px;
        font-weight: 700;
        color: #d4956a;
        letter-spacing: 0.3px;
      }
      .sec-desc {
        font-size: 12px;
        color: #a07050;
        line-height: 1.55;
      }

      /* ── Footer ── */
      .footer {
        padding: 32px 48px;
        border-top: 1px solid #1f0d03;
        text-align: center;
        background: #0a0401;
      }

      .footer-om {
        font-size: 24px;
        color: #c8791a;
        letter-spacing: 6px;
        margin-bottom: 20px;
      }

      .footer-links {
        margin-bottom: 20px;
      }
      .footer-links a {
        font-size: 12px;
        color: #b07840;
        text-decoration: none;
        margin: 0 10px;
        font-weight: 600;
        letter-spacing: 0.3px;
      }

      .footer-address {
        font-size: 12px;
        color: #906840;
        line-height: 1.9;
      }
      .footer-address strong {
        color: #d4956a;
      }

      .footer-notice {
        font-size: 11px;
        color: #70502a;
        margin-top: 16px;
        line-height: 1.7;
      }
      .footer-notice strong {
        color: #a07040;
      }

      /* ── Responsive ── */
      @media (max-width: 620px) {
        .email-wrapper {
          padding: 24px 8px;
        }
        .hero {
          padding: 40px 28px 36px;
        }
        .body {
          padding: 32px 28px;
        }
        .footer {
          padding: 28px;
        }
        .hero-title {
          font-size: 22px;
        }
        .security-item {
          display: block;
          width: 100%;
          padding-right: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <!-- Logo Header -->
        <div class="header">
          <div class="logo-wrap">
            <!-- Om / Lotus Icon -->
            <svg
              class="logo-icon"
              viewBox="0 0 42 42"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="21" cy="21" r="21" fill="#1c0d04" />
              <circle
                cx="21"
                cy="21"
                r="20"
                fill="none"
                stroke="#f5c842"
                stroke-width="0.6"
                opacity="0.4"
              />
              <!-- Simplified Om shape -->
              <text
                x="21"
                y="27"
                font-family="serif"
                font-size="20"
                text-anchor="middle"
                fill="#f5c842"
              >
                ॐ
              </text>
            </svg>
            <div>
              <span class="logo-text">BHARAT BHAKTI SANGAM</span>
              <span class="logo-sub">Bhajan Clubbing · Kirtan · Bhakti</span>
            </div>
          </div>
        </div>

        <!-- Om Divider -->
        <div class="om-divider">
          <span>✦ &nbsp; ✦ &nbsp; ✦</span>
        </div>

        <!-- Main Card -->
        <div class="card">
          <!-- Hero -->
          <div class="hero">

            <p class="hero-tag">⊰ Security Request ⊱</p>
            <h1 class="hero-title">Reset Your Password</h1>
            <p class="hero-subtitle">
              We received a request to reset the password<br />associated with
              your account.
            </p>
          </div>

          <!-- Body -->
          <div class="body">
            <p class="greeting">Jai Shri Krishna 🙏</p>

            <p class="body-text">
              Someone — hopefully you — has requested a password reset for your
              <u>Bharat Bhakti Sangam Admin Panel</u> account. If this was you,
              simply click the button below to create a new password and regain
              access.
            </p>

            <p class="body-text">
              If you didn't request this, you can safely ignore this email. Your
              password will remain unchanged and no action is required on your
              part.
            </p>

            <!-- Info Box -->
            <div class="info-box">
              <svg
                class="info-icon"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="9"
                  stroke="#c8791a"
                  stroke-width="1.5"
                />
                <path
                  d="M10 9v5M10 7v.5"
                  stroke="#c8791a"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              <p class="info-text">
                For your security, this link can only be used
                <strong>once</strong> and is tied exclusively to your account.
                Never share this link with anyone — Bharat Bhakti Sangam support
                will never ask for it.
              </p>
            </div>

            <!-- CTA -->
            <div class="cta-wrap">
              <a href=${data} class="cta-btn">Reset My Password</a>

            <!-- Expiry Strip -->
            <div class="expiry-strip">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="#f5c842"
                  stroke-width="1.2"
                />
                <path
                  d="M8 4.5V8l2.5 2"
                  stroke="#f5c842"
                  stroke-width="1.2"
                  stroke-linecap="round"
                />
              </svg>
              <p class="expiry-text">
                This link expires in <strong>10 minutes</strong>
              </p>
            </div>
          </div>
          <!-- /body -->
        </div>
        <!-- /card -->
      </div>
      <!-- /container -->
    </div>
  </body>
</html>
`;
};
