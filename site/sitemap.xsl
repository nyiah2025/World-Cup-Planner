<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  exclude-result-prefixes="sm">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Sitemap — myteamkickoff.com</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f4f6f9;
            color: #1a1a2e;
            padding: 2rem 1rem;
          }

          .container {
            max-width: 860px;
            margin: 0 auto;
          }

          header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
          }

          .logo {
            width: 40px;
            height: 40px;
            background: #16213e;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
          }

          h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #16213e;
          }

          h1 span {
            display: block;
            font-size: 0.8rem;
            font-weight: 400;
            color: #6b7280;
            margin-top: 2px;
          }

          .stats {
            background: #16213e;
            color: #fff;
            border-radius: 10px;
            padding: 1rem 1.5rem;
            margin-bottom: 1.5rem;
            display: flex;
            gap: 2rem;
            flex-wrap: wrap;
          }

          .stat {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .stat-value {
            font-size: 1.6rem;
            font-weight: 700;
            color: #4ade80;
          }

          .stat-label {
            font-size: 0.75rem;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          }

          thead {
            background: #16213e;
            color: #fff;
          }

          thead th {
            padding: 0.75rem 1rem;
            text-align: left;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          tbody tr {
            border-bottom: 1px solid #f0f0f0;
            transition: background 0.15s;
          }

          tbody tr:last-child {
            border-bottom: none;
          }

          tbody tr:hover {
            background: #f8fafc;
          }

          tbody tr:first-child td {
            font-weight: 600;
          }

          td {
            padding: 0.65rem 1rem;
            font-size: 0.875rem;
            vertical-align: middle;
          }

          td a {
            color: #2563eb;
            text-decoration: none;
            word-break: break-all;
          }

          td a:hover {
            text-decoration: underline;
          }

          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .badge-daily  { background: #dcfce7; color: #166534; }
          .badge-weekly { background: #fef9c3; color: #854d0e; }
          .badge-monthly{ background: #fee2e2; color: #991b1b; }

          .priority-high   { color: #16a34a; font-weight: 700; }
          .priority-medium { color: #ca8a04; font-weight: 600; }
          .priority-low    { color: #9ca3af; }

          footer {
            margin-top: 1.5rem;
            text-align: center;
            font-size: 0.75rem;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <div class="logo">⚽</div>
            <h1>
              myteamkickoff.com
              <span>XML Sitemap</span>
            </h1>
          </header>

          <div class="stats">
            <div class="stat">
              <span class="stat-value"><xsl:value-of select="count(sm:urlset/sm:url)"/></span>
              <span class="stat-label">Total URLs</span>
            </div>
            <div class="stat">
              <span class="stat-value"><xsl:value-of select="count(sm:urlset/sm:url[sm:changefreq='daily'])"/></span>
              <span class="stat-label">Updated Daily</span>
            </div>
            <div class="stat">
              <span class="stat-value"><xsl:value-of select="count(sm:urlset/sm:url[sm:priority='1.0'])"/></span>
              <span class="stat-label">Priority 1.0</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>URL</th>
                <th>Last Modified</th>
                <th>Change Freq</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sm:urlset/sm:url">
                <xsl:sort select="sm:priority" data-type="number" order="descending"/>
                <tr>
                  <td><xsl:value-of select="position()"/></td>
                  <td>
                    <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
                  </td>
                  <td><xsl:value-of select="sm:lastmod"/></td>
                  <td>
                    <xsl:variable name="freq" select="sm:changefreq"/>
                    <span>
                      <xsl:attribute name="class">
                        <xsl:choose>
                          <xsl:when test="$freq = 'daily'">badge badge-daily</xsl:when>
                          <xsl:when test="$freq = 'weekly'">badge badge-weekly</xsl:when>
                          <xsl:otherwise>badge badge-monthly</xsl:otherwise>
                        </xsl:choose>
                      </xsl:attribute>
                      <xsl:value-of select="$freq"/>
                    </span>
                  </td>
                  <td>
                    <xsl:variable name="pri" select="sm:priority"/>
                    <span>
                      <xsl:attribute name="class">
                        <xsl:choose>
                          <xsl:when test="$pri >= 0.9">priority-high</xsl:when>
                          <xsl:when test="$pri >= 0.5">priority-medium</xsl:when>
                          <xsl:otherwise>priority-low</xsl:otherwise>
                        </xsl:choose>
                      </xsl:attribute>
                      <xsl:value-of select="$pri"/>
                    </span>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>

          <footer>
            Generated for myteamkickoff.com · <xsl:value-of select="count(sm:urlset/sm:url)"/> URLs indexed
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>

</xsl:stylesheet>
