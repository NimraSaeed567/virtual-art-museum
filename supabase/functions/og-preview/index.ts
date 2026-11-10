import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Edge function to intercept bot requests and return HTML with OG meta tags
// Requires setting up a rewrite rule in hosting to point bots here

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname

  // Default values
  let title = 'Atelier Museum of Digital Art'
  let description = 'A curated digital space showcasing immersive contemporary art.'
  let image = 'https://your-domain.com/social-preview.jpg' // Fallback image

  // Extract slugs
  const artworkMatch = path.match(/\/artwork\/([^\/]+)/)
  
  if (artworkMatch) {
    const slug = artworkMatch[1]
    
    // Initialize Supabase Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Check if it's a dynamic artwork ID
    if (slug.startsWith('dynamic-')) {
      const realId = slug.replace('dynamic-', '')
      const { data } = await supabase
        .from('published_artworks')
        .select(`
          artwork_submissions (
            title, description, image_url,
            profiles (full_name)
          )
        `)
        .eq('id', realId)
        .single()
        
      if (data?.artwork_submissions) {
        const sub = data.artwork_submissions
        title = `${sub.title} by ${sub.profiles?.full_name}`
        description = sub.description || 'View this artwork in the Atelier Museum 3D gallery.'
        if (sub.image_url) image = sub.image_url
      }
    } else {
      // For static artworks, we could theoretically fetch them from the frontend repo if they were hosted,
      // but since they are procedural or static, we can use generic meta tags or setup a small static map
      title = `Artwork: ${slug.replace(/-/g, ' ')}`
      description = 'View this artwork in the Atelier Museum 3D gallery.'
    }
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta name="description" content="${description}">
      
      <!-- Open Graph / Facebook -->
      <meta property="og:type" content="website">
      <meta property="og:url" content="${url.href}">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
      <meta property="og:image" content="${image}">
      
      <!-- Twitter -->
      <meta property="twitter:card" content="summary_large_image">
      <meta property="twitter:url" content="${url.href}">
      <meta property="twitter:title" content="${title}">
      <meta property="twitter:description" content="${description}">
      <meta property="twitter:image" content="${image}">
    </head>
    <body>
      <p>Redirecting to <a href="${url.href}">${title}</a>...</p>
      <script>
        // If a real user accidentally hits this, redirect them to the SPA
        window.location.replace("${url.href}");
      </script>
    </body>
    </html>
  `

  return new Response(html, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
})
