import type { Mesh } from 'three'

// Clickable artwork meshes, keyed by artwork id. Player raycasts against these.
export const registry = new Map<string, Mesh>()
