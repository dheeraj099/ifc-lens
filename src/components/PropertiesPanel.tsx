import { useState } from 'react'
import { ChevronDown, ChevronRight, MousePointer } from 'lucide-react'
import type { SelectedElement, IFCPropertySet } from '../types'

interface Props {
  selected: SelectedElement | null
}

function PropertySetSection({ pset }: { pset: IFCPropertySet }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border border-[#2a2a38] rounded-lg overflow-hidden mb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[#1c1c26] hover:bg-[#222232] transition-colors text-left"
      >
        {open ? (
          <ChevronDown size={12} className="text-zinc-500 shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-zinc-500 shrink-0" />
        )}
        <span className="text-[11px] font-semibold text-zinc-400 truncate">{pset.name}</span>
        <span className="text-[10px] text-zinc-700 ml-auto shrink-0">{pset.properties.length}</span>
      </button>

      {open && (
        <div className="divide-y divide-[#1f1f2e]">
          {pset.properties.map((prop, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-1.5 hover:bg-[#181825]">
              <span className="text-[11px] text-zinc-500 flex-1 min-w-0 truncate" title={prop.name}>
                {prop.name}
              </span>
              <span
                className="text-[11px] font-mono text-zinc-300 text-right max-w-[50%] truncate"
                title={prop.value}
              >
                {prop.value || '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PropertiesPanel({ selected }: Props) {
  if (!selected) {
    return (
      <aside className="w-72 shrink-0 bg-[#111118] border-l border-[#1f1f2e] flex flex-col items-center justify-center gap-3 p-6">
        <div className="w-10 h-10 rounded-full bg-[#1c1c26] flex items-center justify-center">
          <MousePointer size={16} className="text-zinc-600" />
        </div>
        <p className="text-xs text-zinc-600 text-center leading-relaxed">
          Click an element in the 3D view to inspect its BIM properties
        </p>
      </aside>
    )
  }

  const { typeName, name, globalId, description, tag, propertySets, expressId } = selected

  return (
    <aside className="w-72 shrink-0 bg-[#111118] border-l border-[#1f1f2e] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-[#1f1f2e] shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/20">
            {typeName}
          </span>
          <span className="text-[10px] text-zinc-700 ml-auto font-mono">#{expressId}</span>
        </div>
        <p className="text-sm font-semibold text-[#e4e4f0] truncate" title={name}>
          {name || <span className="text-zinc-600 font-normal italic">Unnamed</span>}
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {/* Identity fields */}
        <div className="border border-[#2a2a38] rounded-lg overflow-hidden mb-2">
          <div className="px-3 py-2 bg-[#1c1c26]">
            <span className="text-[11px] font-semibold text-zinc-400">Identity</span>
          </div>
          <div className="divide-y divide-[#1f1f2e]">
            {[
              ['Type', typeName],
              ['Name', name],
              ['Global ID', globalId],
              ['Description', description],
              ['Tag', tag],
            ]
              .filter(([, v]) => v)
              .map(([label, val]) => (
                <div key={label} className="flex items-start gap-2 px-3 py-1.5">
                  <span className="text-[11px] text-zinc-500 w-24 shrink-0">{label}</span>
                  <span
                    className="text-[11px] font-mono text-zinc-300 flex-1 truncate"
                    title={val}
                  >
                    {val}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Property sets */}
        {propertySets.length > 0 ? (
          propertySets.map((pset, i) => <PropertySetSection key={i} pset={pset} />)
        ) : (
          <p className="text-[11px] text-zinc-700 text-center py-4">No property sets found</p>
        )}
      </div>
    </aside>
  )
}
