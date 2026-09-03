import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { MeshFormat } from '../types'

function frameObject(camera: THREE.PerspectiveCamera, controls: OrbitControls, object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  object.position.sub(center)

  const maxDim = Math.max(size.x, size.y, size.z, 0.001)
  const distance = maxDim * 1.8
  camera.position.set(distance, distance * 0.7, distance)
  camera.near = maxDim / 100
  camera.far = maxDim * 50
  camera.updateProjectionMatrix()
  controls.target.set(0, 0, 0)
  controls.update()
}

export default function MeshViewer({
  url,
  format,
  wireframe,
  autoRotate,
}: {
  url: string
  format: MeshFormat
  wireframe: boolean
  autoRotate: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<{
    object?: THREE.Object3D
    controls?: OrbitControls
    applyWireframe: (v: boolean) => void
  }>({ applyWireframe: () => {} })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let disposed = false

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#1c1c1c')
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 2.5

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.2))
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
    dirLight.position.set(3, 5, 4)
    scene.add(dirLight)

    function resize() {
      if (!container) return
      const w = container.clientWidth || 1
      const h = container.clientHeight || 1
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    function applyWireframe(on: boolean) {
      stateRef.current.object?.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mats = Array.isArray(child.material) ? child.material : [child.material]
          for (const m of mats) {
            if ('wireframe' in m) (m as THREE.MeshStandardMaterial).wireframe = on
          }
        }
      })
    }
    stateRef.current.applyWireframe = applyWireframe
    stateRef.current.controls = controls

    function addObject(object: THREE.Object3D) {
      if (disposed) return
      stateRef.current.object = object
      scene.add(object)
      applyWireframe(wireframe)
      frameObject(camera, controls, object)
    }

    const standardMaterial = new THREE.MeshStandardMaterial({ color: 0x9fb8ad, metalness: 0.15, roughness: 0.7 })

    if (format === 'stl') {
      new STLLoader().load(url, (geometry) => {
        geometry.computeVertexNormals()
        addObject(new THREE.Mesh(geometry, standardMaterial))
      })
    } else if (format === 'obj') {
      new OBJLoader().load(url, (object) => {
        object.traverse((child) => {
          if (child instanceof THREE.Mesh && !child.material) child.material = standardMaterial
        })
        addObject(object)
      })
    } else {
      new GLTFLoader().load(url, (gltf) => addObject(gltf.scene))
    }

    let frameId: number
    function animate() {
      frameId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, format])

  useEffect(() => {
    stateRef.current.applyWireframe(wireframe)
  }, [wireframe])

  useEffect(() => {
    if (stateRef.current.controls) stateRef.current.controls.autoRotate = autoRotate
  }, [autoRotate])

  return <div ref={containerRef} className="h-full w-full" />
}
