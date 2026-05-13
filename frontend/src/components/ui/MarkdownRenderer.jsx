/**
 * Renderer Markdown léger — sans dépendance externe.
 */

/* ─── Inline ─────────────────────────────────────────── */
function parseInline(text) {
  if (!text) return null
  const parts = []
  // Ordre : bold+italic → bold → italic → code
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`\n]+)`)/g
  let last = 0, m, idx = 0

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if      (m[2]) parts.push(<strong key={idx++}><em>{m[2]}</em></strong>)
    else if (m[3]) parts.push(<strong key={idx++}>{m[3]}</strong>)
    else if (m[4]) parts.push(<em key={idx++}>{m[4]}</em>)
    else if (m[5]) parts.push(
      <code key={idx++} style={{
        background: 'rgba(191,90,242,0.12)',
        borderRadius: 4, padding: '1px 5px',
        fontSize: '0.84em', fontFamily: 'monospace',
        color: 'var(--health-purple)',
      }}>{m[5]}</code>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  if (parts.length === 0) return null
  if (parts.length === 1 && typeof parts[0] === 'string') return parts[0]
  return <>{parts}</>
}

/* ─── Block parser ───────────────────────────────────── */
function parseBlocks(markdown) {
  const lines = markdown.split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // ── Code block ──────────────────────────────────────
    if (line.trim().startsWith('```')) {
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push({ type: 'code', content: codeLines.join('\n') })
      i++
      continue
    }

    // ── Headings (most specific first to avoid prefix clash) ──
    const hMatch = line.match(/^(#{1,4}) (.+)/)
    if (hMatch) {
      const lvl = hMatch[1].length
      const types = ['h2', 'h3', 'h4', 'h4']
      blocks.push({ type: types[lvl - 1], content: hMatch[2] })
      i++
      continue
    }

    // ── Horizontal rule ──────────────────────────────────
    if (line.trim().match(/^---+$/) || line.trim().match(/^\*\*\*+$/)) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // ── Unordered list (REQUIRES space after bullet) ─────
    if (line.match(/^[\-\*\+] /)) {
      const items = []
      while (i < lines.length && lines[i].match(/^[\-\*\+] /)) {
        items.push(lines[i].replace(/^[\-\*\+] /, ''))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // ── Ordered list ─────────────────────────────────────
    if (line.match(/^\d+\. /)) {
      const items = []
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // ── Blockquote ───────────────────────────────────────
    if (line.startsWith('> ')) {
      const qLines = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        qLines.push(lines[i].slice(2))
        i++
      }
      blocks.push({ type: 'blockquote', content: qLines.join('\n') })
      continue
    }

    // ── Empty line ───────────────────────────────────────
    if (line.trim() === '') {
      blocks.push({ type: 'br' })
      i++
      continue
    }

    // ── Paragraph — accumulate until a TRUE block starter ──
    // Note: only exclude lines that ARE definitively a block starter
    // (heading with space, blockquote with space, bullet with space, ordered list, code fence)
    // This prevents *italic* or -value from causing infinite loop.
    const isBlockStarter = (l) =>
      l.match(/^#{1,4} /) ||       // heading
      l.startsWith('> ') ||         // blockquote
      l.match(/^[\-\*\+] /) ||     // bullet list WITH space
      l.match(/^\d+\. /) ||        // ordered list
      l.trim().startsWith('```') || // code fence
      l.trim() === ''               // empty line

    const paraLines = []
    while (i < lines.length && !isBlockStarter(lines[i])) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length) {
      blocks.push({ type: 'p', content: paraLines.join('\n') })
    } else {
      // Safety: if somehow nothing matched and nothing was consumed, advance
      i++
    }
  }

  return blocks
}

/* ─── Render ─────────────────────────────────────────── */
function renderBlock(block, idx) {
  const headStyle = (size, mt = '0.8em') => ({
    fontSize: size, fontWeight: 700,
    marginTop: mt, marginBottom: '0.3em',
    color: 'var(--text-primary)',
  })

  switch (block.type) {
    case 'h2': return <h2 key={idx} style={headStyle('1.1em', '1em')}>{parseInline(block.content)}</h2>
    case 'h3': return <h3 key={idx} style={headStyle('1em')}>{parseInline(block.content)}</h3>
    case 'h4': return <h4 key={idx} style={headStyle('0.95em', '0.6em')}>{parseInline(block.content)}</h4>

    case 'code':
      return (
        <pre key={idx} style={{
          background: 'rgba(0,0,0,0.07)', borderRadius: 10,
          padding: '10px 14px', overflowX: 'auto',
          margin: '0.5em 0', fontSize: '0.82em', lineHeight: 1.5,
          fontFamily: 'monospace', color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
        }}>
          <code>{block.content}</code>
        </pre>
      )

    case 'ul':
      return (
        <ul key={idx} style={{ paddingLeft: '1.2em', margin: '0.3em 0', listStyleType: 'disc' }}>
          {block.items.map((item, j) => (
            <li key={j} style={{ marginBottom: '0.25em', lineHeight: 1.6 }}>{parseInline(item)}</li>
          ))}
        </ul>
      )

    case 'ol':
      return (
        <ol key={idx} style={{ paddingLeft: '1.4em', margin: '0.3em 0' }}>
          {block.items.map((item, j) => (
            <li key={j} style={{ marginBottom: '0.25em', lineHeight: 1.6 }}>{parseInline(item)}</li>
          ))}
        </ol>
      )

    case 'blockquote':
      return (
        <blockquote key={idx} style={{
          borderLeft: '3px solid var(--health-purple)',
          paddingLeft: '0.8em', margin: '0.4em 0',
          color: 'var(--text-secondary)', fontStyle: 'italic',
        }}>
          {parseInline(block.content)}
        </blockquote>
      )

    case 'hr':
      return <hr key={idx} style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '0.7em 0' }} />

    case 'br':
      return <div key={idx} style={{ height: '0.4em' }} />

    default: // paragraph
      return (
        <p key={idx} style={{ margin: '0.2em 0', lineHeight: 1.7 }}>
          {parseInline(block.content ?? '')}
        </p>
      )
  }
}

export default function MarkdownRenderer({ text, style }) {
  if (!text) return null
  return (
    <div style={{ fontSize: '0.875rem', ...style }}>
      {parseBlocks(text).map((b, i) => renderBlock(b, i))}
    </div>
  )
}
