# Kitáb-i-Aqdas HTML/XHTML to TEI XML Converter

This Node.js script converts "The Kitáb-i-Aqdas" from HTML or XHTML format to TEI P5 XML format.

## Overview

The Kitáb-i-Aqdas (The Most Holy Book) is the central book of the Bahá'í Faith, written by Bahá'u'lláh. This converter transforms the XHTML version (Bahá'í Reference Library format) into a structured TEI P5 XML document suitable for digital humanities research and preservation.

## Files

- `The Kitáb-i-Aqdas.xhtml` - Official XHTML source document from Bahá'í Reference Library
- `convert-to-tei.js` - Main conversion script (ESM Node.js)
- `package.json` - Node.js configuration and dependencies
- `kitab-i-aqdas.xml` - Generated TEI XML output (created when you run the script)
- `tei-to-html.xsl` - XSLT stylesheet for viewing XML as formatted HTML

## Features

- **Auto-detects source format**: Supports both legacy HTML and modern XHTML structures
- **Complete conversion** of all major sections:
  - Preface (7 paragraphs)
  - Introduction (30 paragraphs)
  - Description (7 paragraphs)
  - Main text (63+ paragraphs)
  - Questions and Answers (150+ items)
  - Notes (40+ items)

- **Preserves formatting**:
  - Italic text (`<hi rend="italic">`)
  - Bold text (`<hi rend="bold">`)
  - Underlined text (`<hi rend="underline">`)
  - Superscript and subscript
  - External references/links

- **TEI-compliant structure**:
  - Proper TEI header with metadata
  - Structured divisions by section type
  - Numbered paragraphs and notes
  - Character encoding normalization

## Installation

First ensure `pnpm` is installed:

```bash
npm install -g pnpm
```

Next, install the required dependencies:

```bash
pnpm install
```

This will install:
- `jsdom` - For parsing and manipulating HTML

## Usage

Run the conversion script:

```bash
pnpm convert
```

To view the converted documented in the browser, you can
run the local server:

```bash
pnpm start
```

...and then open in the browser.

### Output

The script will:
1. Read `The Kitáb-i-Aqdas.xhtml`
2. Parse and extract all sections using navigation-based structure detection
3. Generate `kitab-i-aqdas.xml` in TEI P5 format
4. Display statistics about the conversion

### Sample Output

```
Reading HTML file...
Parsing HTML document...
Extracting sections...
Sections found:
  - Preface: 7 paragraphs
  - Introduction: 30 paragraphs
  - Description: 7 paragraphs
  - Main text: 63 paragraphs
  - Questions: 150 items
  - Notes: 40 items

Generating TEI XML...
Writing output file...

Conversion complete! Output saved to: ./kitab-i-aqdas.xml
Total file size: 132.75 KB
```

## Viewing the TEI XML

### In a Web Browser

The generated XML file includes an XSLT stylesheet that transforms it into beautifully formatted HTML when opened in a web browser:

```bash
# macOS
open kitab-i-aqdas.xml

# Linux
xdg-open kitab-i-aqdas.xml

# Windows
start kitab-i-aqdas.xml
```

Or simply double-click the `kitab-i-aqdas.xml` file in your file manager.

The stylesheet (`tei-to-html.xsl`) provides:
- **Elegant typography** with serif fonts and proper spacing
- **Automatic table of contents** with section navigation
- **Color-coded sections** for easy visual distinction
- **Numbered paragraphs** with superscript numbering
- **Styled notes** with golden accent borders
- **Responsive design** that works on mobile and desktop
- **Print-friendly** layout for PDF generation

### In an XML Editor

For editing and validation, use:
- **oXygen XML Editor** - Full TEI P5 validation
- **XMLSpy** - Schema validation and XSLT debugging
- **VS Code** with XML extensions - Lightweight editing

## TEI Structure

The TEI document follows the TEI P5 guidelines:

```xml
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <!-- Metadata about the text -->
  </teiHeader>
  <text>
    <body>
      <div type="preface">
        <head>Preface</head>
        <p n="1">...</p>
      </div>
      <div type="introduction">
        <head>Introduction</head>
        <p n="1">...</p>
      </div>
      <div type="description">
        <head>Description</head>
        <p n="1">...</p>
      </div>
      <div type="main-text">
        <head>The Kitáb-i-Aqdas</head>
        <p n="1">...</p>
        <!-- 190 paragraphs -->
      </div>
      <div type="questions-answers">
        <head>Questions and Answers</head>
        <p n="1">...</p>
      </div>
      <div type="notes">
        <head>Notes</head>
        <note n="1">...</note>
      </div>
    </body>
  </text>
</TEI>
```

## Features

## Customization

### Source File

The script is configured to read from `The Kitáb-i-Aqdas.xhtml` by default. To use a different file, edit the constant at the top of `convert-to-tei.js`:

```javascript
const INPUT_FILE = './The Kitáb-i-Aqdas.xhtml';
const OUTPUT_FILE = './kitab-i-aqdas.xml';
```

The converter automatically detects the document structure:
- **XHTML format**: Uses navigation-based section detection with numeric ID anchors
- **Legacy HTML**: Falls back to semantic anchor name patterns (pref#, intro#, par#, etc.)

### Adding Custom Processing

The script provides several functions you can extend:

- `cleanText()` - Text normalization
- `normalizeText()` - Character entity conversion
- `extractTextWithFormatting()` - HTML to TEI formatting conversion
- `parseDocument()` - Section extraction logic
- `generateTEIHeader()` - TEI header customization
- `generateTEIBody()` - TEI body structure

## Text Encoding

The converter handles:
- Unicode characters (Arabic diacritics, accented letters)
- HTML entities (`&aacute;`, `&nbsp;`, etc.)
- Special characters (curly quotes, em dashes, etc.)
- XML escaping for special characters

## Validation

To validate the generated TEI XML:

1. Use an online validator: [TEI by Example Validator](https://teibyexample.org/tools/TBEvalidator.htm)
2. Use xmllint: `xmllint --noout --schema tei_all.xsd kitab-i-aqdas.xml`
3. Use oXygen XML Editor for comprehensive validation

## Resources

- [TEI Guidelines](https://tei-c.org/release/doc/tei-p5-doc/en/html/index.html)
- [TEI by Example](https://teibyexample.org/)
- [Bahá'í Reference Library](https://www.bahai.org/library/)

## License

This is an educational project for TEI encoding of the Kitáb-i-Aqdas.
The original text is © Bahá'í World Centre.
