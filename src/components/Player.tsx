import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore, controlsRef, playerState } from '../store'
import { canWalk, roomAt, EYE_H } from '../data/layout'
import { registry } from './registry'

const CENTER = new THREE.Vector2(0, 0)
const keys: Record<string, boolean> = {}

export default function Player() {
  const { camera } = useThree()
  const raycaster = useRef(new THREE.Raycaster()).current
  const dir = useRef(new THREE.Vector3()).current
  const right = useRef(new THREE.Vector3()).current
  const up = useRef(new THREE.Vector3(0, 1, 0)).current
  const vel = useRef(new THREE.Vector3()).current // smoothed planar velocity
  const bob = useRef(0)

  const setLocked = useStore((s) => s.setLocked)
  const setRoom = useStore((s) => s.setRoom)
  const setHovered = useStore((s) => s.setHovered)
  const openModal = useStore((s) => s.openModal)

  useEffect(() => {
    camera.position.set(0, EYE_H, 5)
    setRoom(roomAt(0, 5, useStore.getState().membership))

    const interact = () => {
      const h = useStore.getState().hoveredId
      if (h) openModal(h)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true
      if (e.code === 'KeyE' && document.pointerLockElement) interact()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false
    }
    const onLockChange = () => setLocked(!!document.pointerLockElement)
    const onMouseDown = () => {
      if (document.pointerLockElement) interact()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [camera, setLocked, setRoom, openModal])

  useFrame((_, rawDt) => {
    if (!document.pointerLockElement) return
    const dt = Math.min(rawDt, 0.05)

    // --- movement with smooth accel/decel ---
    const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0)
    const r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0)
    const speed = keys.ShiftLeft || keys.ShiftRight ? 6.5 : 3.8

    camera.getWorldDirection(dir)
    dir.y = 0
    dir.normalize()
    right.crossVectors(dir, up)

    let tx = dir.x * f + right.x * r
    let tz = dir.z * f + right.z * r
    const tlen = Math.hypot(tx, tz)
    if (tlen > 0) {
      tx = (tx / tlen) * speed
      tz = (tz / tlen) * speed
    }
    const k = 1 - Math.exp(-11 * dt)
    vel.x += (tx - vel.x) * k
    vel.z += (tz - vel.z) * k

    const membership = useStore.getState().membership
    const p = camera.position
    const nx = p.x + vel.x * dt
    const nz = p.z + vel.z * dt
    if (canWalk(nx, nz, membership)) {
      p.x = nx
      p.z = nz
    } else if (canWalk(nx, p.z, membership)) {
      p.x = nx
      vel.z = 0
    } else if (canWalk(p.x, nz, membership)) {
      p.z = nz
      vel.x = 0
    } else {
      vel.x = 0
      vel.z = 0
    }

    // --- head bob ---
    const moving = Math.hypot(vel.x, vel.z)
    if (moving > 0.3) bob.current += moving * dt * 2.4
    p.y = EYE_H + Math.sin(bob.current) * 0.035 * Math.min(moving / speed, 1)

    // --- minimap + room state ---
    playerState.x = p.x
    playerState.z = p.z
    playerState.yaw = Math.atan2(dir.x, -dir.z)
    setRoom(roomAt(p.x, p.z, membership))

    // --- artwork hover (raycast from screen center) ---
    // Distance cap generous enough to reach the niche paintings recessed
    // off the (widened) Gold corridor — those sit ~8.5 units from the
    // corridor centerline, well past what the original hall's proportions
    // needed.
    raycaster.setFromCamera(CENTER, camera)
    const hits = raycaster.intersectObjects([...registry.values()], false)
    const hit = hits[0]
    setHovered(hit && hit.distance < 10 ? (hit.object.userData.artId as string) : null)
  })

  return (
    <PointerLockControls
      ref={(c: { lock: () => void; unlock: () => void } | null) => {
        controlsRef.current = c
      }}
    />
  )
}
