import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailData {
  customerName: string;
  customerEmail: string;
  courseName: string;
  coursePrice: number;
  paymentReference: string;
  paymentDate: string;
  paymentMethod: string;
  dashboardUrl: string;
  invoiceNumber: string;
}

export class EmailService {
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  private static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(date);
  }

  // Registration success email function removed - we now only send one email after payment completion

  /**
   * Sends a welcome email with course access after successful payment.
   * This is the only email sent in the flow - it combines payment confirmation and course access.
   * Sent immediately after payment is confirmed, before user registration.
   */
  static async sendWelcomeEmail(emailData: EmailData): Promise<boolean> {
    try {
      console.log(`📧 Sending welcome email to: ${emailData.customerEmail}`);
      
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Welcome to Foundations of Remote Worker!</title>
    <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
    <![endif]-->
    <style type="text/css">
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .dark-mode-bg {
          background-color: #1a1a1a !important;
        }
        .dark-mode-text {
          color: #f0f0f0 !important;
        }
        .dark-mode-card {
          background-color: #2a2a2a !important;
        }
        .dark-mode-muted {
          color: #b0b0b0 !important;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .polaroid-frame {
          transform: none !important;
        }
      }

      /* Apple auto-link fixes */
      .apple-link a {
        color: inherit !important;
        text-decoration: none !important;
      }

      /* iOS font smoothing */
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      /* Responsive styles */
      @media screen and (max-width: 480px) {
        .mobile-full-width {
          width: 100% !important;
        }
        .mobile-padding {
          padding: 12px !important;
        }
        .mobile-text-center {
          text-align: center !important;
        }
        .polaroid-frame {
          transform: none !important;
        }
      }
    </style>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #fff6fb;
      font-family: 'Poppins', Arial, sans-serif;
      line-height: 1.5;
      color: #3a2e3f;
    "
  >
    <!-- Preheader (hidden) -->
    <div
      style="
        display: none;
        max-height: 0;
        overflow: hidden;
        font-size: 1px;
        line-height: 1px;
        color: #fff6fb;
      "
    >
      You're enrolled! Payment confirmed. Tap to start learning.
    </div>

    <!-- Main Container -->
    <table
      role="presentation"
      cellspacing="0"
      cellpadding="0"
      border="0"
      width="100%"
      style="background-color: #fff6fb"
    >
      <tr>
        <td align="center" style="padding: 0">
          <table
            role="presentation"
            cellspacing="0"
            cellpadding="0"
            border="0"
            width="100%"
            style="max-width: 600px; background-color: #fff6fb"
          >
            <!-- Header with Scalloped Band -->
            <tr>
              <td
                style="
                  padding: 24px 16px;
                  background-color: #fff6fb;
                  position: relative;
                "
              >
                <!-- Scalloped decoration with hearts/stars -->
                <div style="position: relative">
                  <svg
                    width="100%"
                    height="24"
                    viewBox="0 0 600 24"
                    style="display: block; opacity: 0.08"
                  >
                    <defs>
                      <pattern
                        id="confetti"
                        x="0"
                        y="0"
                        width="40"
                        height="20"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M10,10 L12,6 L14,10 L18,8 L16,12 L12,14 L8,12 L6,8 Z"
                          fill="#FF69B4"
                        />
                        <circle cx="25" cy="15" r="2" fill="#8A2BE2" />
                        <path d="M30,5 Q32,3 34,5 Q32,7 30,5" fill="#FFC7E6" />
                      </pattern>
                    </defs>
                    <path
                      d="M0,20 Q50,10 100,15 T200,12 T300,18 T400,8 T500,16 T600,12 L600,24 L0,24 Z"
                      fill="url(#confetti)"
                    />
                  </svg>

                  <table
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    width="100%"
                  >
                    <tr>
                      <td align="center" style="padding-top: 10px">
                        <h1
                          style="
                            margin: 0;
                            font-size: 24px;
                            font-weight: 700;
                            color: #8a2be2;
                            text-align: center;
                            font-family: 'Poppins', Arial, sans-serif;
                          "
                        >
                          Learn With Peni
                        </h1>
                      </td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>

            <!-- You're in! Badge -->
            <tr>
              <td style="padding: 16px 16px 0 16px; background-color: #fff6fb" align="center">
                <div
                  style="
                    display: inline-block;
                    background-color: #ffc7e6;
                    color: #8a2be2;
                    padding: 8px 16px;
                    border-radius: 9999px;
                    border: 2px dashed #ff69b4;
                    font-size: 14px;
                    font-weight: 600;
                    font-family: 'Poppins', Arial, sans-serif;
                  "
                  class="mobile-text-center"
                  aria-label="Enrollment confirmed sticker"
                >
                  You're in! ✨
                </div>
              </td>
            </tr>

            <!-- Hero Section -->
            <tr>
              <td
                style="padding: 32px 16px 24px 16px; background-color: #fff6fb"
              >
                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  width="100%"
                >
                  <tr>
                    <td align="center" style="position: relative">
                      <!-- Hero Title with Hand-drawn Underline -->
                      <h1
                        style="
                          margin: 0 0 8px 0;
                          font-size: 32px;
                          font-weight: 700;
                          color: #8a2be2;
                          text-align: center;
                          font-family: 'Poppins', Arial, sans-serif;
                          position: relative;
                          display: inline-block;
                        "
                      >
                        Welcome to ${emailData.courseName}!
                        <!-- Hand-drawn underline SVG -->
                        <svg
                          width="100%"
                          height="8"
                          viewBox="0 0 400 8"
                          style="position: absolute; bottom: -8px; left: 0"
                        >
                          <path
                            d="M10,6 Q50,2 100,4 T200,3 T300,5 T390,4"
                            stroke="#FF69B4"
                            stroke-width="3"
                            fill="none"
                            stroke-linecap="round"
                            opacity="0.7"
                          />
                        </svg>
                      </h1>

                      <!-- Subtitle -->
                      <p
                        style="
                          margin: 24px 0 0 0;
                          font-size: 18px;
                          color: #6d5e73;
                          text-align: center;
                          font-family: 'Poppins', Arial, sans-serif;
                          line-height: 1.4;
                        "
                      >
                        Hi ${emailData.customerName}, thanks for joining Learn With Peni — your
                        journey starts now ✨
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Payment Details Card -->
            <tr>
              <td style="padding: 0 16px 24px 16px; background-color: #fff6fb">
                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  width="100%"
                >
                  <tr>
                    <td
                      style="
                        background-color: #ffffff;
                        border-radius: 14px;
                        border: 1px solid #f6d7f0;
                        box-shadow: 0 2px 8px rgba(138, 43, 226, 0.08),
                          0 1px 4px rgba(138, 43, 226, 0.04);
                        padding: 24px 20px 20px 20px;
                      "
                      class="dark-mode-card"
                    >
                      <h2
                        style="
                          margin: 0 0 16px 0;
                          font-size: 20px;
                          font-weight: 600;
                          color: #ff69b4;
                          font-family: 'Poppins', Arial, sans-serif;
                        "
                      >
                        Payment Details
                      </h2>

                      <!-- Payment Details Table -->
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        width="100%"
                        style="font-family: 'Poppins', Arial, sans-serif"
                      >
                        <tr>
                          <td
                            style="
                              padding: 8px 0;
                              border-bottom: 1px solid #f6d7f0;
                              vertical-align: top;
                            "
                          >
                            <table
                              role="presentation"
                              cellspacing="0"
                              cellpadding="0"
                              border="0"
                              width="100%"
                            >
                              <tr>
                                <td
                                  style="
                                    font-weight: 600;
                                    color: #3a2e3f;
                                    font-size: 14px;
                                    width: 25%;
                                    padding-right: 12px;
                                  "
                                  class="dark-mode-text"
                                >
                                  Course:
                                </td>
                                <td
                                  style="color: #6d5e73; font-size: 14px"
                                  class="dark-mode-muted"
                                >
                                  ${emailData.courseName}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td
                            style="
                              padding: 8px 0;
                              border-bottom: 1px solid #f6d7f0;
                              vertical-align: top;
                            "
                          >
                            <table
                              role="presentation"
                              cellspacing="0"
                              cellpadding="0"
                              border="0"
                              width="100%"
                            >
                              <tr>
                                <td
                                  style="
                                    font-weight: 600;
                                    color: #3a2e3f;
                                    font-size: 14px;
                                    width: 25%;
                                    padding-right: 12px;
                                  "
                                  class="dark-mode-text"
                                >
                                  Amount:
                                </td>
                                <td
                                  style="
                                    color: #6d5e73;
                                    font-size: 14px;
                                    font-weight: 600;
                                  "
                                  class="dark-mode-muted"
                                >
                                  ${this.formatCurrency(emailData.coursePrice)}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td
                            style="
                              padding: 8px 0;
                              border-bottom: 1px solid #f6d7f0;
                              vertical-align: top;
                            "
                          >
                            <table
                              role="presentation"
                              cellspacing="0"
                              cellpadding="0"
                              border="0"
                              width="100%"
                            >
                              <tr>
                                <td
                                  style="
                                    font-weight: 600;
                                    color: #3a2e3f;
                                    font-size: 14px;
                                    width: 25%;
                                    padding-right: 12px;
                                  "
                                  class="dark-mode-text"
                                >
                                  Reference:
                                </td>
                                <td
                                  style="
                                    color: #6d5e73;
                                    font-size: 14px;
                                    font-family: monospace;
                                  "
                                  class="dark-mode-muted"
                                >
                                  ${emailData.paymentReference}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0 0 0; vertical-align: top">
                            <table
                              role="presentation"
                              cellspacing="0"
                              cellpadding="0"
                              border="0"
                              width="100%"
                            >
                              <tr>
                                <td
                                  style="
                                    font-weight: 600;
                                    color: #3a2e3f;
                                    font-size: 14px;
                                    width: 25%;
                                    padding-right: 12px;
                                  "
                                  class="dark-mode-text"
                                >
                                  Date:
                                </td>
                                <td
                                  style="color: #6d5e73; font-size: 14px"
                                  class="dark-mode-muted"
                                >
                                  ${emailData.paymentDate}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA Button -->
            <tr>
              <td
                style="padding: 0 16px 24px 16px; background-color: #fff6fb"
                align="center"
              >
                <!--[if mso]>
                  <v:roundrect
                    xmlns:v="urn:schemas-microsoft-com:vml"
                    xmlns:w="urn:schemas-microsoft-com:office:word"
                    href="${emailData.dashboardUrl}"
                    style="height: 48px; v-text-anchor: middle; width: 280px"
                    arcsize="50%"
                    stroke="f"
                    fillcolor="#8A2BE2"
                  >
                    <w:anchorlock />
                    <center
                      style="
                        color: #ffffff;
                        font-family: 'Poppins', Arial, sans-serif;
                        font-size: 16px;
                        font-weight: 600;
                      "
                    >
                      Access Your Course ➡️
                    </center>
                  </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a
                  href="${emailData.dashboardUrl}"
                  style="
                    display: inline-block;
                    background-color: #8a2be2;
                    color: #ffffff;
                    text-decoration: none;
                    padding: 14px 28px;
                    border-radius: 9999px;
                    font-family: 'Poppins', Arial, sans-serif;
                    font-size: 16px;
                    font-weight: 600;
                    text-align: center;
                    transition: background-color 0.3s ease;
                    outline: 2px dotted transparent;
                    outline-offset: 2px;
                  "
                  class="mobile-full-width"
                  onmouseover="this.style.background='linear-gradient(45deg, #FF69B4, #8A2BE2)'"
                  onmouseout="this.style.backgroundColor='#8A2BE2'"
                  onfocus="this.style.outline='2px dotted #FFC7E6';"
                >
                  Access Your Course ➡️
                </a>
                <!--<![endif]-->
              </td>
            </tr>

            <!-- Pro Tip -->
            <tr>
              <td
                style="padding: 0 16px 32px 16px; background-color: #fff6fb"
                align="center"
              >
                <p
                  style="
                    margin: 0;
                    font-size: 14px;
                    color: #6d5e73;
                    text-align: center;
                    font-family: 'Poppins', Arial, sans-serif;
                    font-style: italic;
                  "
                  class="dark-mode-muted"
                >
                  💡 Pro tip: Bookmark the course page so you can jump back in
                  anytime 💗
                </p>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding: 0 16px; background-color: #fff6fb">
                <div
                  style="
                    border-top: 2px dashed #ffc7e6;
                    margin: 0 auto;
                    width: 60%;
                  "
                ></div>
              </td>
            </tr>

            <!-- Support Section -->
            <tr>
              <td
                style="padding: 32px 16px 24px 16px; background-color: #fff6fb"
              >
                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  width="100%"
                >
                  <tr>
                    <td align="center">
                      <h3
                        style="
                          margin: 0 0 12px 0;
                          font-size: 18px;
                          font-weight: 600;
                          color: #8a2be2;
                          text-align: center;
                          font-family: 'Poppins', Arial, sans-serif;
                        "
                      >
                        Need help?
                      </h3>
                      <p
                        style="
                          margin: 0 0 16px 0;
                          font-size: 14px;
                          color: #6d5e73;
                          text-align: center;
                          font-family: 'Poppins', Arial, sans-serif;
                          line-height: 1.5;
                        "
                        class="dark-mode-muted"
                      >
                        Questions about your enrollment or access? Just contact
                        us at
                        <a
                          href="https://wa.me/6287863342502"
                          style="color: #ff69b4; text-decoration: underline"
                          >+6287863342502</a
                        >.
                      </p>
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        align="center"
                      >
                        <tr>
                          <td style="padding: 0 8px">
                            <a
                              href="https://learnwithpeni.com"
                              style="
                                color: #8a2be2;
                                text-decoration: underline;
                                font-size: 14px;
                                font-family: 'Poppins', Arial, sans-serif;
                              "
                              >Visit Learn With Peni</a
                            >
                          </td>
                          <td style="padding: 0 8px; color: #ffc7e6">•</td>
                          <td style="padding: 0 8px">
                            <a
                              href="https://learnwithpeni.com/"
                              style="
                                color: #8a2be2;
                                text-decoration: underline;
                                font-size: 14px;
                                font-family: 'Poppins', Arial, sans-serif;
                              "
                              >FAQ</a
                            >
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  padding: 24px 16px;
                  background-color: #fff6fb;
                  border-top: 1px solid #f6d7f0;
                "
              >
                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  width="100%"
                >
                  <tr>
                    <td align="center">
                      <!-- Social Links -->
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        align="center"
                        style="margin-bottom: 16px"
                      >
                        <tr>
                          <td style="padding: 0 12px">
                            <a
                              href="https://instagram.com/learnwithpeni"
                              style="
                                color: #8a2be2;
                                text-decoration: none;
                                font-size: 14px;
                                font-family: 'Poppins', Arial, sans-serif;
                              "
                              >📸 Instagram</a
                            >
                          </td>
                          <td style="padding: 0 12px">
                            <a
                              href="https://tiktok.com/@penirizkiy"
                              style="
                                color: #8a2be2;
                                text-decoration: none;
                                font-size: 14px;
                                font-family: 'Poppins', Arial, sans-serif;
                              "
                              >🎵 TikTok</a
                            >
                          </td>
                        </tr>
                      </table>

                      <!-- Copyright -->
                      <p
                        style="
                          margin: 0 0 8px 0;
                          font-size: 12px;
                          color: #6d5e73;
                          text-align: center;
                          font-family: 'Poppins', Arial, sans-serif;
                          line-height: 1.4;
                        "
                        class="dark-mode-muted"
                      >
                        © 2025 Learn With Peni • You're receiving this because
                        you enrolled in a course.
                      </p>

                      <!-- Address and Unsubscribe -->
                      <p
                        style="
                          margin: 0;
                          font-size: 12px;
                          color: #6d5e73;
                          text-align: center;
                          font-family: 'Poppins', Arial, sans-serif;
                          line-height: 1.4;
                        "
                        class="dark-mode-muted"
                      >
                        Bali, Indonesia
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
      
      await resend.emails.send({
        from: 'LearnWithPeni <noreply@verify.learnwithpeni.com>',
        to: [emailData.customerEmail],
        subject: `🎉 Welcome to ${emailData.courseName} - Your Course is Ready!`,
        html: htmlContent,
      });

      console.log(`✅ Welcome email sent successfully to: ${emailData.customerEmail}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send welcome email:`, error);
      return false;
    }
  }
}
