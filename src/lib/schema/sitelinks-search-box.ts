export function generateSitelinksSearchBoxSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search-workers?query={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }
}
