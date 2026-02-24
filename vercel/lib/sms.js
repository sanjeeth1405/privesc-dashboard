import nodemailer from 'nodemailer'

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTP(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"PrivEsc Detector" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Login OTP — PrivEsc Detector',
      html: `
        <div style="background:#070a0e;padding:32px;font-family:monospace">
          <h2 style="color:#00d4ff;letter-spacing:2px">// PRIVESC DETECTOR</h2>
          <p style="color:#cdd6f4">Your login OTP is:</p>
          <div style="background:#0c1117;border:1px solid #1a2535;border-left:3px solid #00d4ff;
                      padding:20px;margin:16px 0;font-size:32px;letter-spacing:8px;color:#00d4ff">
            ${otp}
          </div>
          <p style="color:#6e7f9a;font-size:12px">Valid for 10 minutes. Do not share.</p>
        </div>
      `,
    })

    return { success: true }
  } catch (err) {
    console.error('Gmail error:', err)
    return { success: false, error: err.message }
  }
}
