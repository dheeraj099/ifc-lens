import { useRef } from 'react'
import { useViewer } from '../hooks/useViewer'
import Toolbar from './Toolbar'
import PropertiesPanel from './PropertiesPanel'

interface Props {
  initialFile: File
}

export default function Viewer({ initialFile }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const didInit = useRef(false)

  const {
    isLoading,
    progress,
    selected,
    wireframe,
    filename,
    loadModel,
    fitToModel,
    toggleWireframe,
    handleCanvasClick,
  } = useViewer(canvasRef)

  // Load initial file once scene is ready
  const initCanvas = (node: HTMLCanvasElement | null) => {
    ;(canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = node
    if (node && !didInit.current) {
      didInit.current = true
      // Small delay to let Three.js init finish
      setTimeout(() => loadModel(initialFile), 200)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        filename={filename}
        wireframe={wireframe}
        onNewFile={loadModel}
        onFit={fitToModel}
        onWireframe={toggleWireframe}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* 3D Canvas */}
        <canvas
          ref={initCanvas}
          onClick={handleCanvasClick}
          className="flex-1 block cursor-crosshair"
          style={{ touchAction: 'none' }}
        />

        {/* Properties panel */}
        <PropertiesPanel selected={selected} />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c0c10]/80 backdrop-blur-sm z-10">
            <div className="w-64">
              <p className="text-sm text-zinc-400 mb-3 text-center">Loading IFC model…</p>
              <div className="w-full bg-[#1c1c26] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-600 text-center mt-2">{progress}%</p>
            </div>
          </div>
        )}

        {/* Hint overlay when no element selected */}
        {!isLoading && !selected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <p className="text-xs text-zinc-700 bg-[#111118]/80 px-3 py-1.5 rounded-full border border-[#2a2a38]">
              Click any element to inspect its BIM properties
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
