export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml');
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.sonnensuche.com/</loc>
    <lastmod>2024-12-19</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.sonnensuche.com/blog</loc>
    <lastmod>2024-12-19</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.sonnensuche.com/blog/sonnigste-orte-deutschland-2024</loc>
    <lastmod>2024-12-19</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.sonnensuche.com/blog/oktober-wetter-beste-reiseziele</loc>
    <lastmod>2024-12-19</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.sonnensuche.com/blog/wochenendtrip-wetter-planen</loc>
    <lastmod>2024-12-19</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.sonnensuche.com/impressum</loc>
    <lastmod>2024-12-19</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://www.sonnensuche.com/datenschutz</loc>
    <lastmod>2024-12-19</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;
  
  res.status(200).send(sitemap);
}
