import { memo } from 'react'
import { X, FileText, File, Image, FileType } from 'lucide-react'

function AttachmentPreview({ attachment, onRemove }) {
  const isImage = attachment?.type?.startsWith('image/')
  const isPdf = attachment.type === 'application/pdf'
  const isDocx = attachment.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  const isText = attachment.type === 'text/plain'

  const Icon = isImage ? Image : isPdf ? FileType : isDocx ? FileText : File
  const label = isImage ? 'Image' : isPdf ? 'PDF' : isDocx ? 'DOCX' : isText ? 'Text' : 'File'

  return (
    <div className="group relative inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 pr-8">
      {isImage && attachment.data ? (
        <img src={`data:${attachment.type};base64,${attachment.data}`} alt={attachment.name} className="h-10 w-10 rounded-lg object-cover" />
      ) : (
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-indigo-300">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-white">{attachment.name}</p>
        <p className="text-[0.7rem] text-slate-400">{label} {(attachment.size / 1024).toFixed(1)} KB</p>
      </div>
      {onRemove && (
        <button onClick={() => onRemove(attachment.id)} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-white/10 bg-[#0a0c14] text-slate-400 transition hover:text-white" aria-label="Remove attachment">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

export default memo(AttachmentPreview)
