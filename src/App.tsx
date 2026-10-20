import { useState } from 'react'
import UploadScreen from './components/UploadScreen'
import Viewer from './components/Viewer'

export default function App() {
  const [file, setFile] = useState<File | null>(null)

  return (
    <div className="h-screen flex flex-col bg-[#0c0c10] overflow-hidden">
      {file ? (
        <Viewer key={file.name + file.size} initialFile={file} />
      ) : (
        <UploadScreen onFile={setFile} />
      )}
    </div>
  )
}
