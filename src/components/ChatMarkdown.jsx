import { memo, useMemo, useState } from 'react'
import { Check, Copy, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

function CodeBlock({ children, language, inline }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const codeString = String(children).replace(/\n$/, '')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDownload = () => {
    const blob = new Blob([codeString], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code_${Date.now()}.${language || 'txt'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const lines = codeString.split('\n')
  const shouldTruncate = lines.length > 50 && !expanded
  const displayCode = shouldTruncate ? lines.slice(0, 50).join('\n') + '\n...' : codeString

  if (inline) {
    return (
      <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-200">
        {codeString}
      </code>
    )
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2">
        <span className="text-xs font-medium text-slate-400">{language || 'code'}</span>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Copy code">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Download code">
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          {lines.length > 50 && (
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Toggle code">
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language || 'text'}
          style={oneDark}
          showLineNumbers
          lineNumberStyle={{ color: '#484f58', fontSize: '0.75rem', minWidth: '2.5em', textAlign: 'right', paddingRight: '1em' }}
          customStyle={{ margin: 0, borderRadius: 0, background: 'transparent', padding: '1rem', fontSize: '0.85rem' }}
          wrapLongLines={false}
        >
          {displayCode}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

function ChatMarkdown({ content }) {
  const elements = useMemo(() => {
    if (!content) return []
    const blocks = []
    let remaining = content
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
    let lastIndex = 0
    let match
    let codeIndex = 0
    let textIndex = 0

    while ((match = codeBlockRegex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        blocks.push({ type: 'text', content: remaining.slice(lastIndex, match.index), id: `text-${textIndex++}` })
      }
      blocks.push({ type: 'code', language: match[1] || 'text', content: match[2], id: `code-${codeIndex++}` })
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < remaining.length) {
      blocks.push({ type: 'text', content: remaining.slice(lastIndex), id: `text-${textIndex++}` })
    }

    return blocks.map((block) => {
      if (block.type === 'code') {
        return (
          <CodeBlock key={block.id} language={block.language}>
            {block.content}
          </CodeBlock>
        )
      }
      const lines = block.content.split('\n')
      const elements = []
      let i = 0
      while (i < lines.length) {
        const line = lines[i]
        const trimmed = line.trim()
        if (/^#{1,6}\s/.test(trimmed)) {
          const level = trimmed.match(/^(#{1,6})/)[1].length
          const text = trimmed.replace(/^#{1,6}\s+/, '')
          const sizes = ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm', 'text-xs']
          elements.push(<h2 key={i} className={`${sizes[level - 1] || 'text-base'} mt-4 mb-2 font-bold text-white`}>{renderInline(text)}</h2>)
        } else if (/^```/.test(trimmed)) {
          const codeLines = []
          i++
          while (i < lines.length && !lines[i].trim().startsWith('```')) {
            codeLines.push(lines[i])
            i++
          }
          elements.push(
            <CodeBlock key={i} language="text">
              {codeLines.join('\n')}
            </CodeBlock>
          )
        } else if (/^>\s/.test(trimmed)) {
          const quoteLines = []
          while (i < lines.length && /^>\s?/.test(lines[i].trim() || lines[i])) {
            quoteLines.push(lines[i].replace(/^>\s?/, ''))
            i++
          }
          elements.push(<blockquote key={i} className="my-2 border-l-4 border-indigo-400 pl-4 text-slate-300 italic">{renderInline(quoteLines.join('\n'))}</blockquote>)
          continue
        } else if (/^[-*+]\s+\[[ x]\]/.test(trimmed)) {
          const taskItems = []
          while (i < lines.length && /^[-*+]\s+\[[ x]\]/.test(lines[i].trim())) {
            const taskLine = lines[i].trim()
            const checked = taskLine.includes('[x]')
            const text = taskLine.replace(/^[-*+]\s+\[[ x]\]\s*/, '')
            taskItems.push(
              <li key={i} className="flex items-start gap-2">
                <span className={`mt-1.5 inline-block h-4 w-4 shrink-0 rounded border ${checked ? 'border-indigo-400 bg-indigo-500/30' : 'border-white/20'} flex items-center justify-center`}>
                  {checked && <Check className="h-2.5 w-2.5 text-indigo-300" />}
                </span>
                <span className={checked ? 'text-slate-400 line-through' : 'text-slate-200'}>{renderInline(text)}</span>
              </li>
            )
            i++
          }
          elements.push(<ul key={i} className="my-2 space-y-1 pl-1">{taskItems}</ul>)
          continue
        } else if (/^[-*+]\s+/.test(trimmed)) {
          const listItems = []
          while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
            listItems.push(<li key={i} className="ml-5 list-disc text-slate-300">{renderInline(lines[i].trim().replace(/^[-*+]\s+/, ''))}</li>)
            i++
          }
          elements.push(<ul key={i} className="my-2 space-y-1">{listItems}</ul>)
          continue
        } else if (/^\d+\.\s+/.test(trimmed)) {
          const listItems = []
          while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
            listItems.push(<li key={i} className="ml-5 list-decimal text-slate-300">{renderInline(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>)
            i++
          }
          elements.push(<ol key={i} className="my-2 space-y-1">{listItems}</ol>)
          continue
        } else if (/^\|?(.+)\|$/.test(trimmed) && trimmed.includes('|')) {
          const tableLines = []
          while (i < lines.length && lines[i].trim().includes('|')) {
            tableLines.push(lines[i].trim())
            i++
          }
          elements.push(renderTable(tableLines))
          continue
        } else if (trimmed === '') {
          i++
          continue
        } else {
          elements.push(<p key={i} className="my-1.5 text-slate-200 leading-7">{renderInline(line)}</p>)
        }
        i++
      }
      return <div key={block.id}>{elements}</div>
    })
  }, [content])

  return <div className="prose-chat space-y-1">{elements}</div>
}

function renderTable(lines) {
  if (lines.length < 2) return null
  const parseRow = (line) => line.split('|').map((cell) => cell.trim()).filter(Boolean)
  const headers = parseRow(lines[0])
  const rows = lines.slice(2).map(parseRow)
  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-full text-sm">
        <thead className="bg-white/5">
          <tr>{headers.map((h, i) => <th key={i} className="px-4 py-2 text-left font-semibold text-white">{renderInline(h)}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, i) => (
            <tr key={i} className="transition hover:bg-white/5">
              {row.map((cell, j) => <td key={j} className="px-4 py-2 text-slate-300">{renderInline(cell)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderInline(text) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-200">{part.slice(1, -1)}</code>
    }
    if (part.startsWith('[')) {
      const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (match) {
        return <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-indigo-300 underline hover:text-indigo-200">{match[1]}</a>
      }
    }
    return <span key={i}>{part}</span>
  })
}

export { ChatMarkdown, CodeBlock }
export default memo(ChatMarkdown)
