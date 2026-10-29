// A tiny, safe markdown renderer. Everything is HTML-escaped FIRST, then we add
// only the few tags we support (headings, bullet lists, bold, italic, code).
// No links and no raw HTML, so AI-written or user-edited notes can't inject scripts.

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function inline(escaped: string): string {
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=$|[\s).,!?:;])/g, '$1<em>$2</em>')
}

export function renderMarkdown(md: string): string {
  const out: string[] = []
  let inList = false
  let para: string[] = []

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(' '))}</p>`)
      para = []
    }
  }
  const closeList = () => {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }

  for (const raw of md.replace(/\r\n/g, '\n').split('\n')) {
    const line = escapeHtml(raw.trim())
    if (!line) {
      flushPara()
      closeList()
      continue
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      flushPara()
      closeList()
      const level = Math.min(heading[1].length + 1, 4) // "#" -> h2, "##" -> h3
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`)
      continue
    }
    const item = /^[-*]\s+(.*)$/.exec(line)
    if (item) {
      flushPara()
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${inline(item[1])}</li>`)
      continue
    }
    closeList()
    para.push(line)
  }
  flushPara()
  closeList()
  return out.join('\n')
}
