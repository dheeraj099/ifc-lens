import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as WEBIFC from 'web-ifc'
import { getSelectedElement } from '../utils/ifc'
import type { SelectedElement } from '../types'

const HIGHLIGHT_MAT = new THREE.MeshLambertMaterial({
  color: 0x7c3aed,
  emissive: 0x4c1d95,
  emissiveIntensity: 0.4,
  transparent: true,
  opacity: 0.85,
  side: THREE.DoubleSide,
})

export function useViewer(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const ifcAPIRef = useRef<WEBIFC.IfcAPI | null>(null)
  const modelIDRef = useRef<number>(-1)
  const modelGroupRef = useRef<THREE.Group | null>(null)
  const selectedMeshRef = useRef<THREE.Mesh | null>(null)
  const originalMatRef = useRef<THREE.Material | THREE.Material[] | null>(null)
  const animFrameRef = useRef<number>(0)

  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selected, setSelected] = useState<SelectedElement | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [wireframe, setWireframe] = useState(false)
  const [filename, setFilename] = useState('')

  // ─── Scene init ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0c0c10')
    sceneRef.current = scene

    const { clientWidth: w, clientHeight: h } = canvas
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 2000)
    camera.position.set(15, 10, 15)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambient)
    const sun = new THREE.DirectionalLight(0xffffff, 1.2)
    sun.position.set(20, 40, 20)
    sun.castShadow = true
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.4)
    fill.position.set(-20, 10, -20)
    scene.add(fill)

    const grid = new THREE.GridHelper(100, 100, 0x1e1e2e, 0x1a1a28)
    scene.add(grid)

    const axes = new THREE.AxesHelper(3)
    scene.add(axes)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 0.5
    controls.maxDistance = 500
    controlsRef.current = controls

    const ro = new ResizeObserver(() => {
      const { clientWidth: cw, clientHeight: ch } = canvas
      if (!cw || !ch) return
      camera.aspect = cw / ch
      camera.updateProjectionMatrix()
      renderer.setSize(cw, ch)
    })
    ro.observe(canvas)

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Init IFC API
    const api = new WEBIFC.IfcAPI()
    api.SetWasmPath('/wasm/')
    api.Init().then(() => {
      ifcAPIRef.current = api
    })

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      ro.disconnect()
      renderer.dispose()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Load IFC ─────────────────────────────────────────────────────────────
  const loadModel = useCallback(async (file: File) => {
    const api = ifcAPIRef.current
    const scene = sceneRef.current
    if (!api || !scene) return

    setIsLoading(true)
    setProgress(0)
    setSelected(null)
    setFilename(file.name)

    // Remove previous model
    if (modelGroupRef.current) {
      scene.remove(modelGroupRef.current)
      modelGroupRef.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material.dispose()
        }
      })
      modelGroupRef.current = null
    }
    if (modelIDRef.current >= 0) {
      try { api.CloseModel(modelIDRef.current) } catch { /* ignore */ }
      modelIDRef.current = -1
    }

    selectedMeshRef.current = null
    originalMatRef.current = null

    try {
      const buffer = new Uint8Array(await file.arrayBuffer())
      setProgress(20)

      const modelID = api.OpenModel(buffer, { COORDINATE_TO_ORIGIN: true })
      modelIDRef.current = modelID
      setProgress(40)

      const group = new THREE.Group()
      modelGroupRef.current = group
      scene.add(group)

      const flatMeshes = api.LoadAllGeometry(modelID)
      const total = flatMeshes.size()

      for (let i = 0; i < total; i++) {
        const flatMesh = flatMeshes.get(i)
        const expressID = flatMesh.expressID
        const geometries = flatMesh.geometries

        for (let j = 0; j < geometries.size(); j++) {
          const placed = geometries.get(j)
          const geom = api.GetGeometry(modelID, placed.geometryExpressID)

          const verts = api.GetVertexArray(geom.GetVertexData(), geom.GetVertexDataSize())
          const idxs = api.GetIndexArray(geom.GetIndexData(), geom.GetIndexDataSize())

          if (verts.length === 0 || idxs.length === 0) {
            geom.delete()
            continue
          }

          const vertCount = verts.length / 6
          const positions = new Float32Array(vertCount * 3)
          const normals = new Float32Array(vertCount * 3)

          for (let k = 0; k < vertCount; k++) {
            positions[k * 3]     = verts[k * 6]
            positions[k * 3 + 1] = verts[k * 6 + 1]
            positions[k * 3 + 2] = verts[k * 6 + 2]
            normals[k * 3]       = verts[k * 6 + 3]
            normals[k * 3 + 1]   = verts[k * 6 + 4]
            normals[k * 3 + 2]   = verts[k * 6 + 5]
          }

          const bufGeom = new THREE.BufferGeometry()
          bufGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
          bufGeom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
          bufGeom.setIndex(new THREE.Uint32BufferAttribute(idxs, 1))

          const matrix = new THREE.Matrix4().fromArray(placed.flatTransformation)
          bufGeom.applyMatrix4(matrix)

          const { x: r, y: g, z: b, w: a } = placed.color
          const mat = new THREE.MeshLambertMaterial({
            color: new THREE.Color(r, g, b),
            transparent: a < 0.99,
            opacity: a,
            side: THREE.DoubleSide,
          })

          const mesh = new THREE.Mesh(bufGeom, mat)
          mesh.userData.expressId = expressID
          mesh.receiveShadow = true
          mesh.castShadow = true
          group.add(mesh)

          geom.delete()
        }

        if (i % 100 === 0) setProgress(40 + Math.round((i / total) * 55))
      }

      // flatMeshes cleanup (delete if available)
      if (typeof (flatMeshes as unknown as { delete?: () => void }).delete === 'function') {
        (flatMeshes as unknown as { delete: () => void }).delete()
      }
      setProgress(100)
      setModelLoaded(true)

      fitToModel()
    } catch (err) {
      console.error('IFC load error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Fit camera to model ──────────────────────────────────────────────────
  const fitToModel = useCallback(() => {
    const group = modelGroupRef.current
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!group || !camera || !controls) return

    const box = new THREE.Box3().setFromObject(group)
    if (box.isEmpty()) return
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const dist = maxDim * 1.8

    camera.position.set(center.x + dist * 0.7, center.y + dist * 0.6, center.z + dist * 0.7)
    camera.near = maxDim * 0.001
    camera.far = maxDim * 100
    camera.updateProjectionMatrix()
    controls.target.copy(center)
    controls.update()
  }, [])

  // ─── Wireframe toggle ─────────────────────────────────────────────────────
  const toggleWireframe = useCallback(() => {
    const group = modelGroupRef.current
    if (!group) return
    setWireframe((prev) => {
      const next = !prev
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const mat = obj.material as THREE.MeshLambertMaterial
          if (mat && mat !== HIGHLIGHT_MAT) mat.wireframe = next
        }
      })
      return next
    })
  }, [])

  // ─── Canvas click → element pick ─────────────────────────────────────────
  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      const camera = cameraRef.current
      const group = modelGroupRef.current
      const api = ifcAPIRef.current
      if (!canvas || !camera || !group || !api || modelIDRef.current < 0) return

      const rect = canvas.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(group.children, false)

      // Restore previous selection
      if (selectedMeshRef.current && originalMatRef.current) {
        selectedMeshRef.current.material = originalMatRef.current
      }

      if (!hits.length) {
        selectedMeshRef.current = null
        originalMatRef.current = null
        setSelected(null)
        return
      }

      const mesh = hits[0].object as THREE.Mesh
      selectedMeshRef.current = mesh
      originalMatRef.current = mesh.material as THREE.Material
      mesh.material = HIGHLIGHT_MAT

      const expressId = mesh.userData.expressId as number
      if (!expressId) return

      try {
        const element = await getSelectedElement(api, modelIDRef.current, expressId)
        setSelected(element)
      } catch (err) {
        console.error('Property fetch error:', err)
      }
    },
    []
  )

  return {
    isLoading,
    progress,
    selected,
    modelLoaded,
    wireframe,
    filename,
    loadModel,
    fitToModel,
    toggleWireframe,
    handleCanvasClick,
  }
}
