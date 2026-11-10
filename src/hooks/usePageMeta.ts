import { useEffect } from 'react'

interface PageMeta {
  title?: string
  description?: string
  image?: string
  url?: string
}

export function usePageMeta({ title, description, image, url }: PageMeta) {
  useEffect(() => {
    const siteTitle = 'Atelier Museum'

    // Document title
    if (title) {
      document.title = `${title} — ${siteTitle}`
    } else {
      document.title = siteTitle
    }

    const setMeta = (property: string, content: string | undefined) => {
      if (!content) return
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
        || document.querySelector<HTMLMetaElement>(`meta[name="${property}"]`)
      if (!el) {
        el = document.createElement('meta')
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          el.setAttribute('property', property)
        } else {
          el.setAttribute('name', property)
        }
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('og:title', title ? `${title} — ${siteTitle}` : siteTitle)
    setMeta('og:description', description)
    setMeta('og:image', image)
    setMeta('og:url', url || window.location.href)
    setMeta('og:type', 'website')
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('twitter:title', title ? `${title} — ${siteTitle}` : siteTitle)
    setMeta('twitter:description', description)
    setMeta('twitter:image', image)
    setMeta('description', description)
  }, [title, description, image, url])
}
