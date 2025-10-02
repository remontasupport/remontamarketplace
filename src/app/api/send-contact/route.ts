import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Simple rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(ip)

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 })
    return true
  }

  if (limit.count >= 5) {
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
    const {
      supportType,
      email,
      firstName,
      lastName,
      pronouns,
      enquiryAbout,
      subject,
      description,
    } = body

    // Validate required fields
    if (!email || !firstName || !lastName || !subject || !description) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
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

    // Sanitize inputs
    const sanitize = (str: string) => str.trim().slice(0, 1000)
    const sanitizedData = {
      supportType: sanitize(supportType || 'Community Support'),
      email: sanitize(email),
      firstName: sanitize(firstName),
      lastName: sanitize(lastName),
      pronouns: pronouns ? sanitize(pronouns) : 'Not specified',
      enquiryAbout: enquiryAbout ? sanitize(enquiryAbout) : 'Not specified',
      subject: sanitize(subject),
      description: sanitize(description),
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
      from: `Remonta Contact <${EMAIL_FROM}>`,
      to: EMAIL_TO,
      replyTo: sanitizedData.email,
      subject: sanitizedData.subject,
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
            .description-box { background-color: white; padding: 15px; border-left: 4px solid #0C1628; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Inquiry Submission</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Support Type:</div>
                <div class="value">${sanitizedData.supportType}</div>
              </div>
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${sanitizedData.firstName} ${sanitizedData.lastName}</div>
              </div>
              <div class="field">
                <div class="label">Pronouns:</div>
                <div class="value">${sanitizedData.pronouns}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${sanitizedData.email}">${sanitizedData.email}</a></div>
              </div>
              <div class="field">
                <div class="label">Enquiry About:</div>
                <div class="value">${sanitizedData.enquiryAbout}</div>
              </div>
              <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${sanitizedData.subject}</div>
              </div>
              <div class="field">
                <div class="label">Description:</div>
                <div class="description-box">${sanitizedData.description.replace(/\n/g, '<br>')}</div>
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
      { message: 'Contact form submitted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending contact email:', error)

    return NextResponse.json(
      { error: 'Failed to send contact form. Please try again later.' },
      { status: 500 }
    )
  }
}
