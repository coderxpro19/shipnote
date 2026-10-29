import { escapeHtml, renderMarkdown } from './markdown'
import type { Env } from './supabase'

export type OutgoingEmail = {
  to: string
  subject: string
  html: string
  text: string
  headers?: Record<string, string>
}

/** Sends emails through Resend's batch API (max 100 per request). */
export async function sendEmails(
  env: Env,
  emails: OutgoingEmail[]
): Promise<{ sent: number; failed: number; lastError?: string }> {
  let sent = 0
  let failed = 0
  let lastError: string | undefined

  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100)
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(
        chunk.map((e) => ({
          from: env.RESEND_FROM_EMAIL,
          to: [e.to],
          subject: e.subject,
          html: e.html,
          text: e.text,
          headers: e.headers,
        }))
      ),
    })
    if (res.ok) {
      sent += chunk.length
    } else {
      failed += chunk.length
      lastError = `${res.status} ${(await res.text()).slice(0, 300)}`
      console.error('Resend error', lastError)
    }
  }
  return { sent, failed, lastError }
}

function layout(inner: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:10px;padding:28px;line-height:1.55">${inner}</div></body></html>`
}

export function confirmationEmail(opts: { projectName: string; confirmUrl: string }): Pick<OutgoingEmail, 'subject' | 'html' | 'text'> {
  const name = escapeHtml(opts.projectName)
  return {
    subject: `Confirm your subscription to ${opts.projectName}`,
    html: layout(`<h2 style="margin-top:0">Confirm your subscription</h2>
<p>You asked to get product updates from <strong>${name}</strong>.</p>
<p><a href="${escapeHtml(opts.confirmUrl)}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Yes, subscribe me</a></p>
<p style="color:#71717a;font-size:13px">If you didn't ask for this, you can ignore this email and nothing will happen.</p>`),
    text: `Confirm your subscription to ${opts.projectName}: ${opts.confirmUrl}\n\nIf you didn't ask for this, ignore this email.`,
  }
}

export function releaseEmail(opts: {
  projectName: string
  title: string
  notesMd: string
  siteUrl: string
  unsubscribeUrl: string
}): Pick<OutgoingEmail, 'subject' | 'html' | 'text' | 'headers'> {
  return {
    subject: `${opts.projectName}: ${opts.title}`,
    html: layout(`<p style="color:#71717a;margin:0 0 4px">${escapeHtml(opts.projectName)}</p>
<h2 style="margin-top:0">${escapeHtml(opts.title)}</h2>
${renderMarkdown(opts.notesMd)}
<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0">
<p style="color:#71717a;font-size:13px"><a href="${escapeHtml(opts.siteUrl)}" style="color:#71717a">See all updates</a> &middot;
<a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#71717a">Unsubscribe</a></p>`),
    text: `${opts.projectName}: ${opts.title}\n\n${opts.notesMd}\n\nAll updates: ${opts.siteUrl}\nUnsubscribe: ${opts.unsubscribeUrl}`,
    headers: {
      'List-Unsubscribe': `<${opts.unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  }
}
