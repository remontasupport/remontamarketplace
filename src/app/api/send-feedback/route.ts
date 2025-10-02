import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Simple rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(ip)

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }) // 1 minute window
    return true
  }

  if (limit.count >= 5) {
    // Max 5 requests per minute
    return false
  }

  limit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { firstName, lastName, email, phone, feedbackType, message } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !feedbackType || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Sanitize inputs to prevent injection
    const sanitize = (str: string) => str.trim().slice(0, 1000)
    const sanitizedData = {
      firstName: sanitize(firstName),
      lastName: sanitize(lastName),
      email: sanitize(email),
      phone: phone ? sanitize(phone) : 'Not provided',
      feedbackType: sanitize(feedbackType),
      message: sanitize(message),
    }

    // Validate environment variables
    const { RESEND_API_KEY, EMAIL_FROM, EMAIL_TO } = process.env

    if (!RESEND_API_KEY || !EMAIL_FROM || !EMAIL_TO) {
      console.error('Missing email configuration environment variables')
      return NextResponse.json(
        { error: 'Email service is not configured properly' },
        { status: 500 }
      )
    }

    // Initialize Resend
    const resend = new Resend(RESEND_API_KEY)

    // Send email
    await resend.emails.send({
      from: `Remonta Feedback <${EMAIL_FROM}>`,
      to: EMAIL_TO,
      replyTo: sanitizedData.email,
      subject: `New ${sanitizedData.feedbackType} from ${sanitizedData.firstName} ${sanitizedData.lastName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0C1628; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #0C1628; }
            .value { margin-top: 5px; }
            .message-box { background-color: white; padding: 15px; border-left: 4px solid #0C1628; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Feedback Submission</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Type:</div>
                <div class="value">${sanitizedData.feedbackType}</div>
              </div>
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${sanitizedData.firstName} ${sanitizedData.lastName}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${sanitizedData.email}">${sanitizedData.email}</a></div>
              </div>
              <div class="field">
                <div class="label">Phone:</div>
                <div class="value">${sanitizedData.phone}</div>
              </div>
              <div class="field">
                <div class="label">Message:</div>
                <div class="message-box">${sanitizedData.message.replace(/\n/g, '<br>')}</div>
              </div>
              <div class="field" style="margin-top: 20px; font-size: 12px; color: #666;">
                <div>Submitted: ${new Date().toLocaleString()}</div>
                <div>IP: ${ip}</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json(
      { message: 'Feedback submitted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending feedback email:', error)

    // Return generic error to client (don't expose internal details)
    return NextResponse.json(
      { error: 'Failed to send feedback. Please try again later.' },
      { status: 500 }
    )
  }
}
