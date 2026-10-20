import { useRef, useState } from 'react'
import { Upload, Box } from 'lucide-react'

interface Props {
  onFile: (file: File) => void
}

export default function UploadScreen({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith('.ifc')) onFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-[#0c0c10] p-8">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Box size={20} className="text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#e4e4f0] tracking-tight">
            ifc<span className="text-violet-400">·</span>lens
          </h1>
        </div>

        <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
          Upload an IFC file to explore the 3D model and inspect BIM properties element by element.
        </p>

        {/* Drop zone */}
        <div
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all ${
            dragging
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-[#2a2a38] hover:border-violet-500/50 hover:bg-violet-500/5'
          }`}
        >
          <Upload
            size={36}
            className={`mx-auto mb-4 transition-colors ${
              dragging ? 'text-violet-400' : 'text-zinc-600'
            }`}
          />
          <p className="text-zinc-400 text-sm font-medium mb-1">
            Drop an IFC file here
          </p>
          <p className="text-zinc-600 text-xs">or click to browse</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".ifc"
          className="hidden"
          onChange={handleChange}
        />

        <p className="mt-6 text-xs text-zinc-700 leading-relaxed">
          Sample IFC files:{' '}
          <a
            href="https://github.com/buildingSMART/Sample-Test-Files"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-violet-400 underline underline-offset-2 transition-colors"
          >
            buildingSMART samples
          </a>
          {' '}·{' '}
          <a
            href="https://github.com/ifcopenshell/IfcOpenShell/tree/master/test/input"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-violet-400 underline underline-offset-2 transition-colors"
          >
            IfcOpenShell test files
          </a>
        </p>
      </div>
    </div>
  )
}
