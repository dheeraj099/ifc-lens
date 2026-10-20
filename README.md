# ifc·lens

> Browser-based IFC model viewer and BIM property inspector. Upload an IFC file, explore the 3D model, and click any element to inspect its properties and property sets — no plugins, no backend.

## What it does

ifc·lens parses IFC files entirely in the browser using the `web-ifc` WebAssembly engine, converts the geometry into Three.js meshes, and renders them in an interactive 3D viewport. Clicking an element highlights it and reveals its BIM properties — type, name, GlobalId, and all attached property sets — in a sidebar panel.

## Key Features

- **Full IFC geometry rendering** — converts IFC geometry to Three.js BufferGeometry with per-element color and transparency from the model
- **Element picking** — click any element in the 3D viewport to select and highlight it
- **BIM property inspection** — shows element type, identity attributes (Name, GlobalId, Description, Tag), and all attached property sets (Pset_WallCommon, etc.)
- **Wireframe toggle** — inspect model structure and overlapping geometry
- **Fit to model** — automatically frames the camera around the loaded model
- **Drag and drop** — drop an IFC file onto the upload screen to load it instantly
- **Load any file** — swap models any time via the toolbar

## How it works

```
IFC File (binary/STEP format)
  │
  ├─ web-ifc WASM parses the file → extracts FlatMesh geometry + colors
  ├─ Geometry converted to Three.js BufferGeometry (positions + normals)
  ├─ Each mesh tagged with expressID for picking
  │
  └─ Three.js renders the scene with OrbitControls
       │
       └─ On click: Raycaster → expressID → web-ifc GetLine() → properties
                                           → IFCRELDEFINESBYPROPERTIES → Psets
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vite + React 19 + TypeScript |
| 3D Rendering | Three.js |
| IFC Parsing | web-ifc (WebAssembly) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |

## Sample IFC Files

- [buildingSMART Sample Test Files](https://github.com/buildingSMART/Sample-Test-Files)
- [IfcOpenShell test input files](https://github.com/ifcopenshell/IfcOpenShell/tree/master/test/input)
- [IFC4 reference view sample](https://www.buildingsmart.org/standards/bsi-standards/industry-foundation-classes/)

## Running Locally

```bash
git clone https://github.com/dheeraj099/ifc-lens.git
cd ifc-lens
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Building

```bash
npm run build
```

Output in `dist/`. The build includes the WASM binary (`public/wasm/web-ifc.wasm`) — deploy to any static host.

**Note:** The WASM build requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers. These are set automatically in the Vite dev server and need to be configured on your production host.

## Architecture

```
ifc-lens/
  public/
    wasm/
      web-ifc.wasm       # WebAssembly IFC engine
  src/
    types/
      index.ts           # SelectedElement, IFCPropertySet, IFCProperty
    utils/
      ifc.ts             # Type name lookup, property extraction, Pset traversal
    hooks/
      useViewer.ts       # Three.js scene + IFCLoader + raycasting + state
    components/
      UploadScreen.tsx   # Initial drag-and-drop upload UI
      Toolbar.tsx        # File open, wireframe, fit view controls
      Viewer.tsx         # Canvas container + loading overlay + hint
      PropertiesPanel.tsx # BIM property sidebar with expandable Psets
    App.tsx              # Upload → Viewer state machine
    main.tsx
    index.css
```

## Limitations & Future Work

- Large IFC files (100MB+) may be slow to load since geometry conversion runs on the main thread. A web worker offload would improve this.
- Only `IFCRELDEFINESBYPROPERTIES` property sets are shown; quantity sets (`IFCRELDEFINESBYTYPE`) and type properties are not yet extracted.
- No spatial structure tree panel (to navigate by IFC storey/space hierarchy).
- No section cut or clipping plane tools yet.
- No model federation (loading multiple IFC files simultaneously).

## License

MIT
