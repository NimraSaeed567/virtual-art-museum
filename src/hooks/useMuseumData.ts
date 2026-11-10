import { useMemo } from 'react'
import { useStore } from '../store'
import { SAMPLE_MUSEUM, type Museum, type Artwork } from '../data/museum'

export function useMuseumData(): Museum {
  const dynamicArtworks = useStore((s) => s.dynamicArtworks)

  const museum = useMemo<Museum>(() => {
    // Map dynamic artworks from DB to the Museum data model
    const mappedDynamicArtworks: Artwork[] = dynamicArtworks.map((da) => {
      const art: Artwork = {
        id: da.id,
        slug: da.id, // Use ID as slug for dynamic ones for now
        artistId: da.artistId,
        exhibitionId: da.exhibition_id ?? '',
        title: da.title,
        year: da.year ?? new Date().getFullYear(),
        story: da.description,
        access: 'public',
        order: 999, // Put dynamic ones at the end
        placeholder: {
          seed: parseInt(da.id.replace(/\D/g, '').slice(0, 5)) || Math.floor(Math.random() * 10000),
          palette: ["#111111", "#333333", "#666666", "#999999"], // Default grayscale palette
          dims: [2, 2] // Default square
        }
      }

      // We need a way to serve the actual image in the 3D gallery
      // The procedural generation falls back to this placeholder if no texture is found
      // We will need to update the texture loader to fetch real images if available
      // For now, we add the image_url to the object, even though it's not strictly in the type
      ;(art as any).image_url = da.image_url

      if (da.price_small || da.price_medium || da.price_large) {
        art.commerce = {
          printsForSale: true,
          prints: []
        }
        if (da.price_small) art.commerce.prints.push({ id: 'sm', label: 'Small', price: da.price_small })
        if (da.price_medium) art.commerce.prints.push({ id: 'md', label: 'Medium', price: da.price_medium })
        if (da.price_large) art.commerce.prints.push({ id: 'lg', label: 'Large', price: da.price_large })
      }

      return art
    })

    return {
      ...SAMPLE_MUSEUM,
      artworks: [...SAMPLE_MUSEUM.artworks, ...mappedDynamicArtworks]
    }
  }, [dynamicArtworks])

  return museum
}
