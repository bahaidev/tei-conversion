<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    exclude-result-prefixes="tei">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html>
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="//tei:titleStmt/tei:title"/></title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
            line-height: 1.8;
            color: #2c3e50;
            background: linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%);
            padding: 20px;
          }

          .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px 60px;
            box-shadow: 0 0 30px rgba(0,0,0,0.1);
            border-radius: 8px;
          }

          header {
            text-align: center;
            border-bottom: 3px double #8b7355;
            padding-bottom: 30px;
            margin-bottom: 40px;
          }

          h1 {
            font-size: 2.5em;
            color: #8b7355;
            margin-bottom: 10px;
            font-weight: 300;
            letter-spacing: 2px;
          }

          .author {
            font-size: 1.3em;
            color: #6c5b4a;
            font-style: italic;
            margin-bottom: 5px;
          }

          .publication {
            font-size: 0.95em;
            color: #7f8c8d;
            margin-top: 10px;
          }

          .toc {
            background: #f8f5f0;
            padding: 25px;
            margin: 30px 0;
            border-left: 4px solid #8b7355;
            border-radius: 4px;
          }

          .toc h2 {
            font-size: 1.3em;
            color: #8b7355;
            margin-bottom: 15px;
            font-weight: 500;
          }

          .toc ul {
            list-style: none;
          }

          .toc li {
            margin: 8px 0;
          }

          .toc a {
            color: #6c5b4a;
            text-decoration: none;
            transition: all 0.3s ease;
            display: inline-block;
          }

          .toc a:hover {
            color: #8b7355;
            transform: translateX(5px);
          }

          .section {
            margin: 50px 0;
          }

          .section-head {
            font-size: 2em;
            color: #8b7355;
            margin-bottom: 30px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ddd;
            font-weight: 400;
          }

          .paragraph {
            margin: 25px 0;
            text-align: justify;
            text-indent: 2em;
            font-size: 1.05em;
          }

          .paragraph:first-of-type {
            text-indent: 0;
          }

          .paragraph .para-num {
            color: #8b7355;
            font-weight: bold;
            margin-right: 8px;
            font-size: 0.9em;
            vertical-align: super;
          }

          .preface .paragraph,
          .introduction .paragraph,
          .description .paragraph {
            text-indent: 0;
            margin-bottom: 20px;
          }

          .note {
            background: #fffef8;
            border-left: 3px solid #d4af37;
            padding: 15px 20px;
            margin: 20px 0;
            font-size: 0.95em;
            line-height: 1.7;
          }

          .note .note-num {
            color: #d4af37;
            font-weight: bold;
            margin-right: 8px;
          }

          .hi-italic {
            font-style: italic;
          }

          .hi-bold {
            font-weight: bold;
          }

          .hi-underline {
            text-decoration: underline;
          }

          .hi-superscript {
            vertical-align: super;
            font-size: 0.8em;
          }

          .hi-subscript {
            vertical-align: sub;
            font-size: 0.8em;
          }

          .ref {
            color: #3498db;
            text-decoration: none;
            border-bottom: 1px dotted #3498db;
          }

          .ref:hover {
            color: #2980b9;
            border-bottom: 1px solid #2980b9;
          }

          footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #ddd;
            text-align: center;
            color: #7f8c8d;
            font-size: 0.9em;
          }

          @media print {
            body {
              background: white;
              padding: 0;
            }

            .container {
              box-shadow: none;
              padding: 20px;
            }

            .toc {
              display: none;
            }
          }

          @media (max-width: 768px) {
            .container {
              padding: 30px 25px;
            }

            h1 {
              font-size: 2em;
            }

            .section-head {
              font-size: 1.6em;
            }

            .paragraph {
              font-size: 1em;
              text-indent: 1.5em;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1><xsl:value-of select="//tei:titleStmt/tei:title"/></h1>
            <div class="author"><xsl:value-of select="//tei:titleStmt/tei:author"/></div>
            <div class="publication">
              <xsl:value-of select="//tei:publicationStmt/tei:publisher"/> •
              <xsl:value-of select="//tei:publicationStmt/tei:date"/>
            </div>
          </header>

          <!-- Table of Contents -->
          <nav class="toc">
            <h2>Table of Contents</h2>
            <ul>
              <xsl:for-each select="//tei:div">
                <li>
                  <a href="#{@type}">
                    <xsl:value-of select="tei:head"/>
                    <xsl:text> (</xsl:text>
                    <xsl:value-of select="count(tei:p | tei:note)"/>
                    <xsl:text> items)</xsl:text>
                  </a>
                </li>
              </xsl:for-each>
            </ul>
          </nav>

          <!-- Process all sections -->
          <xsl:apply-templates select="//tei:body"/>

          <footer>
            <p>TEI XML to HTML transformation</p>
            <p>Converted: <xsl:value-of select="//tei:sourceDesc/tei:p[contains(., 'Conversion date')]"/></p>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>

  <!-- Template for body -->
  <xsl:template match="tei:body">
    <xsl:apply-templates select="tei:div"/>
  </xsl:template>

  <!-- Template for sections -->
  <xsl:template match="tei:div">
    <section class="section {@type}" id="{@type}">
      <h2 class="section-head"><xsl:value-of select="tei:head"/></h2>
      <xsl:apply-templates select="tei:p | tei:note"/>
    </section>
  </xsl:template>

  <!-- Template for paragraphs -->
  <xsl:template match="tei:p">
    <div class="paragraph">
      <span class="para-num"><xsl:value-of select="@n"/></span>
      <xsl:apply-templates/>
    </div>
  </xsl:template>

  <!-- Template for notes -->
  <xsl:template match="tei:note">
    <div class="note">
      <span class="note-num">Note <xsl:value-of select="@n"/>:</span>
      <xsl:apply-templates/>
    </div>
  </xsl:template>

  <!-- Template for highlighted text (italic, bold, etc.) -->
  <xsl:template match="tei:hi">
    <span class="hi-{@rend}">
      <xsl:apply-templates/>
    </span>
  </xsl:template>

  <!-- Template for references/links -->
  <xsl:template match="tei:ref">
    <a href="{@target}" class="ref" target="_blank">
      <xsl:apply-templates/>
    </a>
  </xsl:template>

  <!-- Default template for text nodes -->
  <xsl:template match="text()">
    <xsl:value-of select="."/>
  </xsl:template>

</xsl:stylesheet>
