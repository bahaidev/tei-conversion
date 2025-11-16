<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    exclude-result-prefixes="tei">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html>
      <head>
        <title><xsl:value-of select="//tei:titleStmt/tei:title"/></title>
        <style>
          body {
            font-family: Georgia, serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
          }
          
          h1 {
            text-align: center;
            color: #2c3e50;
            font-size: 2.5em;
            margin-bottom: 0.5em;
          }
          
          .author {
            text-align: center;
            font-size: 1.2em;
            color: #7f8c8d;
            margin-bottom: 2em;
          }
          
          .header-info {
            background: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #3498db;
            margin-bottom: 30px;
            font-size: 0.9em;
          }
          
          .part {
            margin-top: 50px;
          }
          
          .part h2 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          
          .verse {
            margin-bottom: 25px;
            padding: 15px;
            background: #fafafa;
            border-radius: 5px;
          }
          
          .verse-number {
            font-weight: bold;
            color: #3498db;
            margin-right: 10px;
            font-size: 0.9em;
          }
          
          .verse-text {
            display: inline;
          }
          
          .smallcaps {
            font-variant: small-caps;
            font-weight: 600;
            color: #2c3e50;
          }
          
          .italic {
            font-style: italic;
          }
          
          .bold {
            font-weight: bold;
          }
          
          .underline {
            text-decoration: underline;
          }
          
          .superscript {
            vertical-align: super;
            font-size: 0.8em;
          }
          
          .subscript {
            vertical-align: sub;
            font-size: 0.8em;
          }
          
          a {
            color: #3498db;
            text-decoration: none;
          }
          
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <xsl:apply-templates select="//tei:teiHeader"/>
        <xsl:apply-templates select="//tei:body"/>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="tei:teiHeader">
    <h1><xsl:value-of select="tei:fileDesc/tei:titleStmt/tei:title"/></h1>
    <div class="author">
      <xsl:value-of select="tei:fileDesc/tei:titleStmt/tei:author"/>
    </div>
    <div class="header-info">
      <p>
        <strong>Translated by:</strong>
        <xsl:text> </xsl:text>
        <xsl:value-of select="tei:fileDesc/tei:titleStmt/tei:respStmt/tei:name"/>
      </p>
      <p>
        <strong>Source:</strong>
        <xsl:text> </xsl:text>
        <xsl:value-of select="tei:fileDesc/tei:sourceDesc/tei:p"/>
      </p>
    </div>
  </xsl:template>

  <xsl:template match="tei:body">
    <xsl:apply-templates select="tei:div[@type='part']"/>
  </xsl:template>

  <xsl:template match="tei:div[@type='part']">
    <div class="part">
      <h2><xsl:value-of select="tei:head"/></h2>
      <xsl:apply-templates select="tei:p"/>
    </div>
  </xsl:template>

  <xsl:template match="tei:p">
    <div class="verse">
      <span class="verse-number"><xsl:value-of select="@n"/>.</span>
      <span class="verse-text">
        <xsl:apply-templates/>
      </span>
    </div>
  </xsl:template>

  <xsl:template match="tei:hi[@rend='smallcaps']">
    <span class="smallcaps"><xsl:apply-templates/></span>
  </xsl:template>

  <xsl:template match="tei:hi[@rend='italic']">
    <span class="italic"><xsl:apply-templates/></span>
  </xsl:template>

  <xsl:template match="tei:hi[@rend='bold']">
    <span class="bold"><xsl:apply-templates/></span>
  </xsl:template>

  <xsl:template match="tei:hi[@rend='underline']">
    <span class="underline"><xsl:apply-templates/></span>
  </xsl:template>

  <xsl:template match="tei:hi[@rend='superscript']">
    <span class="superscript"><xsl:apply-templates/></span>
  </xsl:template>

  <xsl:template match="tei:hi[@rend='subscript']">
    <span class="subscript"><xsl:apply-templates/></span>
  </xsl:template>

  <xsl:template match="tei:ref">
    <a href="{@target}"><xsl:apply-templates/></a>
  </xsl:template>

</xsl:stylesheet>
