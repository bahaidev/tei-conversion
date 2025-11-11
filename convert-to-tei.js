#!/usr/bin/env node

/**
 * HTML/XHTML to TEI XML Converter for The Kitáb-i-Aqdas
 * Converts the source HTML/XHTML file to TEI P5 XML format
 */

import { readFileSync, writeFileSync } from 'fs';
import { JSDOM } from 'jsdom';

const INPUT_FILE = './The Kitáb-i-Aqdas.xhtml';
const OUTPUT_FILE = './kitab-i-aqdas.xml';

/**
 * Clean and normalize text content
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Convert HTML entities and special characters
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .replace(/&aacute;/g, 'á')
    .replace(/&iacute;/g, 'í')
    .replace(/&uacute;/g, 'ú')
    .replace(/&eacute;/g, 'é')
    .replace(/&oacute;/g, 'ó')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/—/g, '—')
    .replace(/–/g, '–');
}

/**
 * Extract text content with basic formatting
 */
function extractTextWithFormatting(node) {
  if (!node) return '';

  let result = '';

  for (const child of node.childNodes) {
    if (child.nodeType === 3) { // Text node
      result += normalizeText(child.textContent);
    } else if (child.nodeType === 1) { // Element node
      const tagName = child.tagName.toLowerCase();

      if (tagName === 'i' || tagName === 'em') {
        result += `<hi rend="italic">${extractTextWithFormatting(child)}</hi>`;
      } else if (tagName === 'b' || tagName === 'strong') {
        result += `<hi rend="bold">${extractTextWithFormatting(child)}</hi>`;
      } else if (tagName === 'u') {
        result += `<hi rend="underline">${extractTextWithFormatting(child)}</hi>`;
      } else if (tagName === 'sup') {
        result += `<hi rend="superscript">${extractTextWithFormatting(child)}</hi>`;
      } else if (tagName === 'sub') {
        result += `<hi rend="subscript">${extractTextWithFormatting(child)}</hi>`;
      } else if (tagName === 'a') {
        const href = child.getAttribute('href');
        if (href && href.startsWith('http')) {
          result += `<ref target="${href}">${extractTextWithFormatting(child)}</ref>`;
        } else {
          result += extractTextWithFormatting(child);
        }
      } else if (tagName === 'br') {
        result += '\n';
      } else if (tagName === 'span') {
        // pass-through spans
        result += extractTextWithFormatting(child);
      } else {
        result += extractTextWithFormatting(child);
      }
    }
  }

  return result;
}

/**
 * Parse sections from the HTML/XHTML document
 * Supports two structures:
 *  1. Legacy HTML with explicit anchor name/id patterns (pref#, intro#, description#, par#, q#, note#)
 *  2. New XHTML (Bahá’í Reference Library) where sections are delineated by navigation <nav> links to heading anchors
 */
function parseDocument(dom) {
  const document = dom.window.document;

  const sections = {
    preface: [],
    introduction: [],
    description: [],
    text: [],
    questions: [],
    supplementary: [],
    synopsis: [],
    notes: [],
    glossary: [],
    keyPassages: []
  };

  // ---------- Primary strategy: legacy explicit anchors ----------
  const allAnchorEls = Array.from(document.querySelectorAll('a[name], *[id], *[name]'));
  const anchorPattern = /^(pref\d+|intro\d+[a-c]?|description\d+|par\d+|q\d+|note\d+)$/i;
  const anchors = [];
  for (const el of allAnchorEls) {
    const name = (el.getAttribute('name') || el.getAttribute('id') || '').trim();
    if (name && anchorPattern.test(name)) {
      anchors.push({ name, el });
    }
  }
  const seen = new Set();
  const orderedAnchors = anchors.filter(a => { if (seen.has(a.name)) return false; seen.add(a.name); return true; });
  const anchorMap = new Map(orderedAnchors.map(a => [a.name, a.el]));

  function nextNode(node) {
    if (!node) return null;
    if (node.firstChild) return node.firstChild;
    while (node) {
      if (node.nextSibling) return node.nextSibling;
      node = node.parentNode;
    }
    return null;
  }
  function collectBetween(startEl, endEl) {
    let text = '';
    let node = nextNode(startEl);
    while (node && node !== endEl) {
      if (node.nodeType === 1) {
        const n = (node.getAttribute && (node.getAttribute('name') || node.getAttribute('id'))) || '';
        if (n && anchorPattern.test(n)) break;
        text += extractTextWithFormatting(node);
        node = node.nextSibling ? node.nextSibling : nextNode(node);
      } else if (node.nodeType === 3) {
        text += normalizeText(node.textContent);
        node = nextNode(node);
      } else {
        node = nextNode(node);
      }
    }
    return cleanText(text);
  }

  // Fill sections if legacy anchors exist (heuristic: at least one par1 or intro1)
  const legacyHasContent = anchorMap.has('par1') || anchorMap.has('intro1') || anchorMap.has('pref1');
  if (legacyHasContent) {
    // Preface
    for (let i = 1; i <= 50; i++) {
      const name = `pref${i}`;
      const el = anchorMap.get(name);
      if (!el) break;
      const nextEl = anchorMap.get(`pref${i+1}`) || null;
      const text = collectBetween(el, nextEl);
      if (text) sections.preface.push({ n: i, text });
    }
    // Introduction
    for (let i = 1; i <= 300; i++) {
      for (const suf of ['', 'b', 'c']) {
        const name = `intro${i}${suf}`;
        const el = anchorMap.get(name);
        if (el) {
          // Determine next marker in same group
          let nextName = null;
          if (suf === '') nextName = anchorMap.has(`intro${i}b`) ? `intro${i}b` : `intro${i+1}`;
          else if (suf === 'b') nextName = anchorMap.has(`intro${i}c`) ? `intro${i}c` : `intro${i+1}`;
          else nextName = `intro${i+1}`;
          const nextEl = anchorMap.get(nextName) || null;
          const text = collectBetween(el, nextEl);
          if (text) sections.introduction.push({ n: `${i}${suf}`, text });
        }
      }
    }
    // Description
    for (let i = 1; i <= 100; i++) {
      const name = `description${i}`;
      const el = anchorMap.get(name);
      if (!el) break;
      const nextEl = anchorMap.get(`description${i+1}`) || null;
      const text = collectBetween(el, nextEl);
      if (text) sections.description.push({ n: i, text });
    }
    // Main Text paragraphs
    for (let i = 1; i <= 1000; i++) {
      const name = `par${i}`;
      const el = anchorMap.get(name);
      if (!el) break;
      const nextEl = anchorMap.get(`par${i+1}`) || null;
      const text = collectBetween(el, nextEl);
      if (text) sections.text.push({ n: i, text });
    }
    // Questions
    for (let i = 1; i <= 500; i++) {
      const name = `q${i}`;
      const el = anchorMap.get(name);
      if (!el) break;
      const nextEl = anchorMap.get(`q${i+1}`) || null;
      const text = collectBetween(el, nextEl);
      if (text) sections.questions.push({ n: i, text });
    }
    // Notes
    for (let i = 1; i <= 1000; i++) {
      const name = `note${i}`;
      const el = anchorMap.get(name);
      if (!el) break;
      const nextEl = anchorMap.get(`note${i+1}`) || null;
      const text = collectBetween(el, nextEl);
      if (text) sections.notes.push({ n: i, text });
    }
    return sections;
  }

  // ---------- Fallback strategy: navigation-based XHTML segmentation ----------
  const nav = document.querySelector('nav.gc');
  if (!nav) return sections; // nothing found

  const sectionOrder = [];
  // Build from nav list items
  nav.querySelectorAll('a[href^="#"]').forEach(a => {
    const target = a.getAttribute('href').slice(1);
    const label = a.textContent.trim();
    sectionOrder.push({ id: target, label });
  });

  // Map labels to our internal types
  function mapLabel(label) {
    const l = label.toLowerCase();
    if (l.startsWith('preface')) return { type: 'preface', head: label };
    if (l.startsWith('introduction')) return { type: 'introduction', head: label };
    if (l.startsWith('a description')) return { type: 'description', head: label };
    if (l === 'the kitáb-i-aqdas') return { type: 'text', head: label };
    if (l.startsWith('some supplementary')) return { type: 'supplementary', head: label };
    if (l.startsWith('questions and answers')) return { type: 'questions', head: label };
    if (l.startsWith('a synopsis')) return { type: 'synopsis', head: label };
    if (l === 'notes') return { type: 'notes', head: label };
    if (l.startsWith('key to passages')) return { type: 'keyPassages', head: label };
    return null;
  }

  const mapped = sectionOrder.map(s => ({ ...s, map: mapLabel(s.label) })).filter(s => s.map);

  // Helper to get all sibling nodes between two heading anchors
  function collectSectionNodes(startId, endId) {
    const startAnchor = document.querySelector(`a[id="${startId}"]`);
    if (!startAnchor) return [];

    // Find the container div that holds the section content
    // The heading is typically inside a div.ic or similar, and content follows in sibling divs
    let container = startAnchor.closest('div');
    if (!container) return [];

    // Collect all following sibling elements until we hit the next section heading
    const nodes = [];
    let current = container.nextSibling;

    while (current) {
      if (current.nodeType === 1) {
        // Check if this element or any descendant contains the next heading anchor
        if (endId) {
          const nextAnchor = current.querySelector(`a[id="${endId}"]`);
          if (nextAnchor) break;
        }
        nodes.push(current);
      }
      current = current.nextSibling;
    }

    return nodes;
  }

  for (let i = 0; i < mapped.length; i++) {
    const { id, map } = mapped[i];
    const nextId = (i + 1 < mapped.length) ? mapped[i+1].id : null;
    const contentNodes = collectSectionNodes(id, nextId);

    if (map.type === 'notes') {
      // Notes section: each <div class="dd"> is a separate note
      // Look for div.dd elements that contain span.jb with the note number
      const allDivs = contentNodes.flatMap(n => {
        if (n.classList && n.classList.contains('dd')) return [n];
        return Array.from(n.querySelectorAll('div.dd'));
      });

      for (const div of allDivs) {
        // Find the note number in the first span.jb
        const titleSpan = div.querySelector('span.jb');
        if (!titleSpan) continue;

        const titleText = titleSpan.textContent.trim();
        const numMatch = titleText.match(/^(\d+)\./);
        const noteNum = numMatch ? numMatch[1] : '';

        // Collect all paragraph text from this note div
        let noteText = '';
        const paras = div.querySelectorAll('p');
        for (const p of paras) {
          noteText += ' ' + extractTextWithFormatting(p);
        }

        if (noteText.trim()) {
          sections.notes.push({ n: noteNum, text: cleanText(noteText) });
        }
      }
      continue;
    }

    // General paragraph extraction for all other section types
    const paragraphs = [];
    contentNodes.forEach(node => {
      if (node.tagName && node.tagName.toLowerCase() === 'p') {
        paragraphs.push(node);
      } else {
        paragraphs.push(...Array.from(node.querySelectorAll('p')));
      }
    });

    const filteredParas = paragraphs.filter(p => {
      const txt = p.textContent.trim();
      // Filter out very short content and navigation elements
      return txt.length > 0;
    });

    let counter = 1;
    for (const p of filteredParas) {
      const text = cleanText(extractTextWithFormatting(p));
      if (!text || text.length < 3) continue;
      sections[map.type].push({ n: counter++, text });
    }
  }

  return sections;
}

/**
 * Generate TEI XML header
 */
function generateTEIHeader() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="tei-to-html.xsl"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>The Kitáb-i-Aqdas: The Most Holy Book</title>
        <author>Bahá'u'lláh</author>
        <respStmt>
          <resp>Translated by</resp>
          <name>Universal House of Justice</name>
        </respStmt>
      </titleStmt>
      <publicationStmt>
        <publisher>Bahá'í World Centre</publisher>
        <date>1992</date>
        <availability>
          <p>Published by the Bahá'í World Centre</p>
        </availability>
      </publicationStmt>
      <sourceDesc>
        <p>Converted from HTML/XHTML source to TEI XML</p>
        <p>Original filename: ${INPUT_FILE.replace(/^\.\//,'')}</p>
        <p>Conversion date: ${new Date().toISOString()}</p>
      </sourceDesc>
    </fileDesc>
    <encodingDesc>
      <projectDesc>
        <p>This file was converted from HTML to TEI P5 XML format</p>
      </projectDesc>
    </encodingDesc>
    <profileDesc>
      <langUsage>
        <language ident="en">English</language>
      </langUsage>
      <textClass>
        <keywords>
          <term>Religious text</term>
          <term>Bahá'í Faith</term>
          <term>Sacred scripture</term>
        </keywords>
      </textClass>
    </profileDesc>
    <revisionDesc>
      <change when="${new Date().toISOString().split('T')[0]}">Initial conversion from HTML to TEI</change>
    </revisionDesc>
  </teiHeader>
`;
}

/**
 * Generate TEI body content
 */
function generateTEIBody(sections) {
  let xml = '  <text>\n    <body>\n';

  // Preface
  if (sections.preface.length > 0) {
    xml += '      <div type="preface">\n';
    xml += '        <head>Preface</head>\n';
    for (const para of sections.preface) {
      xml += `        <p n="${para.n}">${escapeXML(para.text)}</p>\n`;
    }
    xml += '      </div>\n\n';
  }

  // Introduction
  if (sections.introduction.length > 0) {
    xml += '      <div type="introduction">\n';
    xml += '        <head>Introduction</head>\n';
    for (const para of sections.introduction) {
      xml += `        <p n="${para.n}">${escapeXML(para.text)}</p>\n`;
    }
    xml += '      </div>\n\n';
  }

  // Description
  if (sections.description.length > 0) {
    xml += '      <div type="description">\n';
    xml += '        <head>Description</head>\n';
    for (const para of sections.description) {
      xml += `        <p n="${para.n}">${escapeXML(para.text)}</p>\n`;
    }
    xml += '      </div>\n\n';
  }

  // Main text
  if (sections.text.length > 0) {
    xml += '      <div type="main-text">\n';
    xml += '        <head>The Kitáb-i-Aqdas</head>\n';
    for (const para of sections.text) {
      xml += `        <p n="${para.n}">${escapeXML(para.text)}</p>\n`;
    }
    xml += '      </div>\n\n';
  }

  // Questions and Answers
  if (sections.questions.length > 0) {
    xml += '      <div type="questions-answers">\n';
    xml += '        <head>Questions and Answers</head>\n';
    for (const qa of sections.questions) {
      xml += `        <p n="${qa.n}">${escapeXML(qa.text)}</p>\n`;
    }
    xml += '      </div>\n\n';
  }

  // Notes
  if (sections.notes.length > 0) {
    xml += '      <div type="notes">\n';
    xml += '        <head>Notes</head>\n';
    for (const note of sections.notes) {
      xml += `        <note n="${note.n}">${escapeXML(note.text)}</note>\n`;
    }
    xml += '      </div>\n\n';
  }

  xml += '    </body>\n  </text>\n';
  return xml;
}

/**
 * Escape XML special characters while preserving TEI formatting tags
 */
function escapeXML(text) {
  if (!text) return '';

  // First, escape ampersands that aren't part of entities
  let result = text.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');

  // Don't escape < and > that are part of TEI tags
  // We need to escape other < and > but not those in <hi>, <ref>, etc.
  const teiTags = /<(hi|ref|\/hi|\/ref)(\s[^>]*)?>|&[a-z]+;|&#\d+;|&#x[0-9a-fA-F]+;/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = teiTags.exec(result)) !== null) {
    // Escape the text before this match
    if (match.index > lastIndex) {
      const textBefore = result.substring(lastIndex, match.index);
      parts.push(textBefore
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      );
    }
    // Keep the match as-is (it's a TEI tag or entity)
    parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  // Escape any remaining text after the last match
  if (lastIndex < result.length) {
    parts.push(result.substring(lastIndex)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    );
  }

  return parts.join('');
}

/**
 * Main conversion function
 */
function convertHTMLToTEI() {
  console.log('Reading HTML file...');
  const htmlContent = readFileSync(INPUT_FILE, 'utf-8');

  console.log('Parsing HTML document...');
  const dom = new JSDOM(htmlContent);

  console.log('Extracting sections...');
  const sections = parseDocument(dom);

  console.log('Sections found:');
  console.log(`  - Preface: ${sections.preface.length} paragraphs`);
  console.log(`  - Introduction: ${sections.introduction.length} paragraphs`);
  console.log(`  - Description: ${sections.description.length} paragraphs`);
  console.log(`  - Main text: ${sections.text.length} paragraphs`);
  console.log(`  - Questions: ${sections.questions.length} items`);
  console.log(`  - Notes: ${sections.notes.length} items`);

  console.log('\nGenerating TEI XML...');
  let teiXML = generateTEIHeader();
  teiXML += generateTEIBody(sections);
  teiXML += '</TEI>\n';

  console.log('Writing output file...');
  writeFileSync(OUTPUT_FILE, teiXML, 'utf-8');

  console.log(`\nConversion complete! Output saved to: ${OUTPUT_FILE}`);
  console.log(`Total file size: ${(teiXML.length / 1024).toFixed(2)} KB`);
}

// Run the conversion
try {
  convertHTMLToTEI();
} catch (error) {
  console.error('Error during conversion:', error);
  process.exit(1);
}
