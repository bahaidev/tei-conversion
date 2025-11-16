import { readFile, writeFile } from 'fs/promises';
import { JSDOM } from 'jsdom';

async function convertHTMLToTEI() {
  console.log('Reading HTML file...');
  const htmlContent = await readFile('./books/The Hidden Words.xhtml', 'utf-8');

  console.log('Parsing HTML document...');
  const dom = new JSDOM(htmlContent, { contentType: 'text/html' });
  const document = dom.window.document;

  console.log('Extracting content...');
  const sections = parseDocument(document);

  console.log('\nSections found:');
  console.log(`  - Part One (Arabic): ${sections.arabic.length} verses`);
  console.log(`  - Part Two (Persian): ${sections.persian.length} verses`);

  console.log('\nGenerating TEI XML...');
  const teiXML = generateTEI(sections);

  console.log('Writing output file...');
  const outputPath = './books/hidden-words.xml';
  await writeFile(outputPath, teiXML, 'utf-8');

  const sizeKB = (Buffer.byteLength(teiXML, 'utf-8') / 1024).toFixed(2);
  console.log(`\nConversion complete! Output saved to: ${outputPath}`);
  console.log(`Total file size: ${sizeKB} KB`);
}

function parseDocument(document) {
  const sections = {
    arabic: [],
    persian: [],
    arabicPreamble: '',
    persianPreamble: '',
    conclusion: ''
  };

  // Find the two main parts by their section IDs
  const arabicAnchor = document.querySelector('a[id="536804237"]');
  const persianAnchor = document.querySelector('a[id="305986377"]');

  if (arabicAnchor) {
    // Navigate up to find the containing section
    let arabicSection = arabicAnchor.parentElement;
    while (arabicSection && arabicSection.tagName !== 'DIV') {
      arabicSection = arabicSection.parentElement;
    }
    // Go up one more level to get the full section
    if (arabicSection) arabicSection = arabicSection.parentElement;

    if (arabicSection) {
      // Extract preamble: "He Is the Glory of Glories" + the paragraph after it
      const gloryPara = arabicSection.querySelector('p.w');
      const textPara = arabicSection.querySelector('p.zd.hb');
      
      let preambleText = '';
      if (gloryPara) {
        preambleText = extractTextWithFormatting(gloryPara);
      }
      if (textPara) {
        if (preambleText) preambleText += '\n\n';
        preambleText += extractTextWithFormatting(textPara);
      }
      sections.arabicPreamble = preambleText;
      
      sections.arabic = extractVerses(arabicSection);
    }
  }

  if (persianAnchor) {
    let persianSection = persianAnchor.parentElement;
    while (persianSection && persianSection.tagName !== 'DIV') {
      persianSection = persianSection.parentElement;
    }
    if (persianSection) persianSection = persianSection.parentElement;

    if (persianSection) {
      // Extract preamble (the paragraph "In the Name of the Lord of Utterance, the Mighty.")
      const preambleParas = persianSection.querySelectorAll('p.dd.zd.hb');
      if (preambleParas.length > 0 && preambleParas[0].textContent.includes('In the Name')) {
        sections.persianPreamble = extractTextWithFormatting(preambleParas[0]);
      }
      
      sections.persian = extractVerses(persianSection);
      
      // Extract conclusion (the last p.zd.hb after all verses)
      const allHbParas = persianSection.querySelectorAll('p.zd.hb');
      if (allHbParas.length > 1) {
        sections.conclusion = extractTextWithFormatting(allHbParas[allHbParas.length - 1]);
      }
    }
  }

  return sections;
}function extractVerses(sectionElement) {
  const verses = [];

  // Find all verse containers - they're divs with empty class attribute
  // Each contains a number paragraph and then the verse text paragraph
  const allDivs = Array.from(sectionElement.querySelectorAll('div'));

  allDivs.forEach(div => {
    // Check if this div has a paragraph with class "db if zd" (the number)
    const numberPara = div.querySelector('p.db.if.zd');
    if (!numberPara) return;

    // Get the verse number
    const numberText = numberPara.textContent.trim();
    const n = numberText.replace('.', '').trim();
    if (!n || isNaN(parseInt(n))) return;

    // Find the nested div that contains the actual verse
    const verseDiv = div.querySelector('div');
    if (!verseDiv) return;

    // Extract the verse text paragraph
    const versePara = verseDiv.querySelector('p.dd.zd');
    if (!versePara) return;

    const text = extractTextWithFormatting(versePara);

    if (text) {
      verses.push({ n, text });
    }
  });

  return verses;
}

function extractTextWithFormatting(element) {
  let result = '';

  for (const node of element.childNodes) {
    if (node.nodeType === 3) { // Text node
      result += escapeXML(node.textContent);
    } else if (node.nodeType === 1) { // Element node
      const tagName = node.tagName.toLowerCase();

      // Skip anchor elements used for IDs
      if (tagName === 'a' && node.classList.contains('sf')) {
        continue;
      }

      // Skip anchor elements used for paragraph numbers
      if (tagName === 'a' && (node.classList.contains('td') || node.classList.contains('ff'))) {
        continue;
      }

      // Handle line breaks
      if (tagName === 'br') {
        result += '\n';
        continue;
      }

      // Handle spans with small caps (invocations)
      if (tagName === 'span' && node.classList.contains('kf')) {
        const text = extractTextWithFormatting(node);
        result += `<hi rend="smallcaps">${text}</hi>`;
        continue;
      }

      // Handle italic text
      if (tagName === 'i' || tagName === 'em' || node.classList.contains('hb')) {
        const text = extractTextWithFormatting(node);
        result += `<hi rend="italic">${text}</hi>`;
        continue;
      }

      // Handle bold text
      if (tagName === 'b' || tagName === 'strong') {
        const text = extractTextWithFormatting(node);
        result += `<hi rend="bold">${text}</hi>`;
        continue;
      }

      // Handle underlined text
      if (tagName === 'u') {
        const text = extractTextWithFormatting(node);
        result += `<hi rend="underline">${text}</hi>`;
        continue;
      }

      // Handle superscript
      if (tagName === 'sup') {
        const text = extractTextWithFormatting(node);
        result += `<hi rend="superscript">${text}</hi>`;
        continue;
      }

      // Handle subscript
      if (tagName === 'sub') {
        const text = extractTextWithFormatting(node);
        result += `<hi rend="subscript">${text}</hi>`;
        continue;
      }

      // Handle links
      if (tagName === 'a' && node.hasAttribute('href')) {
        const href = node.getAttribute('href');
        const text = extractTextWithFormatting(node);
        result += `<ref target="${escapeXML(href)}">${text}</ref>`;
        continue;
      }

      // Recursively process other elements
      result += extractTextWithFormatting(node);
    }
  }

  return result;
}

function escapeXML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateTEI(sections) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="hidden-words.xsl"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>The Hidden Words</title>
        <author>Bahá'u'lláh</author>
        <respStmt>
          <resp>Translated by</resp>
          <name>Shoghi Effendi with the assistance of some English friends</name>
        </respStmt>
      </titleStmt>
      <publicationStmt>
        <publisher>Bahá'í Reference Library</publisher>
        <availability>
          <p>Available from the Bahá'í Reference Library at http://www.bahai.org/library/</p>
        </availability>
      </publicationStmt>
      <sourceDesc>
        <p>Converted from authoritative XHTML edition</p>
      </sourceDesc>
    </fileDesc>
  </teiHeader>
  <text>
    <body>`;

  const footer = `    </body>
  </text>
</TEI>`;

  let body = '';

  // Part One: From the Arabic
  if (sections.arabic.length > 0) {
    body += `
      <div type="part" n="1">
        <head>Part One: From the Arabic</head>
`;

    if (sections.arabicPreamble) {
      body += `        <p type="preamble">${sections.arabicPreamble}</p>\n`;
    }

    sections.arabic.forEach(verse => {
      body += `        <p n="${verse.n}">${verse.text}</p>\n`;
    });

    body += `      </div>\n`;
  }

  // Part Two: From the Persian
  if (sections.persian.length > 0) {
    body += `
      <div type="part" n="2">
        <head>Part Two: From the Persian</head>
`;

    if (sections.persianPreamble) {
      body += `        <p type="preamble">${sections.persianPreamble}</p>\n`;
    }

    sections.persian.forEach(verse => {
      body += `        <p n="${verse.n}">${verse.text}</p>\n`;
    });

    if (sections.conclusion) {
      body += `        <p type="conclusion">${sections.conclusion}</p>\n`;
    }

    body += `      </div>\n`;
  }

  return header + body + footer;
}

// Run the conversion
convertHTMLToTEI().catch(err => {
  console.error('Error during conversion:', err);
  process.exit(1);
});
