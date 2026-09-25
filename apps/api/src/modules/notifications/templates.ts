// The two sign-up emails (US-NOT-01, S1-design 3.4 R1/R2). Truthful: the account
// is ready now, so they say "sign in", not "verify your email". Plain HTML plus a
// text part; every interpolated value is escaped.

const APP_NAME = 'Remonta'

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:24px;background:#f5f5f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px">
${bodyHtml}
<p style="margin-top:32px;font-size:12px;color:#78716c">&copy; ${new Date().getUTCFullYear()} ${APP_NAME}. This is an automated email; please do not reply.</p>
</div></body></html>`
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="background:#1c1917;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">${escapeHtml(label)}</a></p>`
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export function registrationConfirmation(firstName: string, appBaseUrl: string): RenderedEmail {
  const signIn = `${appBaseUrl}/login`
  return {
    subject: `Welcome to ${APP_NAME} -- your account is ready`,
    html: layout(
      `Welcome to ${APP_NAME}`,
      `<h1 style="font-size:22px">Welcome to ${APP_NAME}, ${escapeHtml(firstName)}</h1>
<p>Your account is ready. You can sign in now to finish your profile and upload your documents.</p>
${button(signIn, 'Sign in')}
<p>If you did not create this account, you can ignore this email.</p>`,
    ),
    text: `Welcome to ${APP_NAME}, ${firstName}.

Your account is ready. You can sign in now to finish your profile and upload your documents:
${signIn}

If you did not create this account, you can ignore this email.`,
  }
}

export function existingAccountNotice(firstName: string, appBaseUrl: string): RenderedEmail {
  const signIn = `${appBaseUrl}/login`
  const reset = `${appBaseUrl}/forgot-password`
  return {
    subject: `Someone tried to create a ${APP_NAME} account with your email`,
    html: layout(
      `${APP_NAME} account`,
      `<h1 style="font-size:22px">Hi ${escapeHtml(firstName)}</h1>
<p>Someone tried to create a ${APP_NAME} account with this email address. You already have an account, so nothing was changed.</p>
<p>If it was you, sign in -- or reset your password if you have forgotten it.</p>
${button(signIn, 'Sign in')}
<p><a href="${escapeHtml(reset)}">Reset your password</a></p>
<p>If it was not you, you can ignore this email. Your account is safe.</p>`,
    ),
    text: `Hi ${firstName},

Someone tried to create a ${APP_NAME} account with this email address. You already have an account, so nothing was changed.

If it was you, sign in: ${signIn}
Forgotten your password? ${reset}

If it was not you, you can ignore this email. Your account is safe.`,
  }
}
