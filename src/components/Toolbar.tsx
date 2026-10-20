import { useRef } from 'react'
import { Box, Upload, Maximize, Grid3x3, RotateCcw } from 'lucide-react'

interface Props {
  filename: string
  wireframe: boolean
  onNewFile: (file: File) => void
  onFit: () => void
  onWireframe: () => void
}

export default function Toolbar({ filename, wireframe, onNewFile, onFit, onWireframe }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onNewFile(file)
    e.target.value = ''
  }

  return (
    <header className="flex items-center gap-3 px-4 h-12 bg-[#111118] border-b border-[#1f1f2e] shrink-0">
      <div className="flex items-center gap-2 mr-2">
        <div className="w-6 h-6 rounded bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <Box size={13} className="text-violet-400" />
        </div>
        <span className="font-semibold text-[#e4e4f0] text-sm tracking-tight">
          ifc<span className="text-violet-400">·</span>lens
        </span>
      </div>

      {filename && (
        <span className="text-xs text-zinc-500 font-mono bg-[#1c1c26] border border-[#2a2a38] px-2 py-0.5 rounded truncate max-w-64">
          {filename}
        </span>
      )}

      <div className="flex-1" />

      <button
        onClick={onWireframe}
        title="Toggle wireframe"
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border transition-colors ${
          wireframe
            ? 'text-violet-300 bg-violet-500/10 border-violet-500/30'
            : 'text-zinc-500 border-[#2a2a38] hover:text-zinc-300 hover:border-zinc-600'
        }`}
      >
        <Grid3x3 size={12} />
        Wireframe
      </button>

      <button
        onClick={onFit}
        title="Fit view"
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 px-2.5 py-1 rounded border border-[#2a2a38] hover:border-zinc-600 transition-colors"
      >
        <Maximize size={12} />
        Fit View
      </button>

      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded border border-[#2a2a38] hover:border-zinc-600 transition-colors"
      >
        <Upload size={12} />
        Open File
      </button>

      <input ref={inputRef} type="file" accept=".ifc" className="hidden" onChange={handleChange} />

      <div className="flex items-center gap-1.5 text-[11px] text-zinc-700 pl-2">
        <RotateCcw size={10} />
        Orbit · Scroll zoom · Right-drag pan
      </div>
    </header>
  )
}
