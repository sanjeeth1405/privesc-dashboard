export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTP(phoneNumber, otp) {
  try {
    // Strip +91 country code — Fast2SMS needs plain 10-digit Indian number
    const number = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '')

    const url = 'https://www.fast2sms.com/dev/bulkV2' +
      '?authorization=' + process.env.FAST2SMS_API_KEY +
      '&message=Your PrivEsc Detector OTP is ' + otp + '. Valid 10 minutes. Do not share.' +
      '&language=english' +
      '&route=q' +
      '&numbers=' + number

    const res  = await fetch(url)
    const data = await res.json()

    if (data.return === true) {
      return { success: true }
    } else {
      console.error('Fast2SMS error:', data)
      return { success: false, error: data.message || 'SMS failed' }
    }
  } catch (err) {
    console.error('Fast2SMS fetch error:', err)
    return { success: false, error: err.message }
  }
}
