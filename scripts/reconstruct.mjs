import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

const CONTENT_TITLES = {
  'about-me': 'About Me',
  'home': 'NeonTechtra Docs',
  'active-directory/goad/part1': 'GOAD - Part 1',
  'active-directory/goad/part2': 'GOAD - Part 2',
  'web-exploitation/portswigger/sql-injection-lab1': 'SQLi Lab 1'
};

const DOCS_CONFIG = [
  {
    docId: 'home',
    url: 'http://neontechtra.dev/home',
    chunk: '3d9c95a4.99ab1bae.js',
    filePath: 'docs/home.md'
  },
  {
    docId: 'about-me',
    url: 'http://neontechtra.dev/about-me',
    chunk: '3ba895b0.8cc2b1da.js',
    filePath: 'docs/about-me.md'
  },
  {
    docId: 'homelab/structure/layout',
    url: 'http://neontechtra.dev/homelab/structure/layout',
    chunk: '000ccff7.243b6746.js',
    filePath: 'docs/homelab/structure/layout.md'
  },
  {
    docId: 'active-directory/goad/part1',
    url: 'http://neontechtra.dev/active-directory/goad/part1',
    chunk: '6433450a.90819b44.js',
    filePath: 'docs/active-directory/goad/part1.md'
  },
  {
    docId: 'active-directory/goad/part2',
    url: 'http://neontechtra.dev/active-directory/goad/part2',
    chunk: 'e1346a40.d3643526.js',
    filePath: 'docs/active-directory/goad/part2.md'
  },
  {
    docId: 'active-directory/nha/part1',
    url: 'http://neontechtra.dev/active-directory/nha/part1',
    chunk: '844e44a6.2d7d123c.js',
    filePath: 'docs/active-directory/nha/part1.md'
  },
  {
    docId: 'active-directory/nha/part2',
    url: 'http://neontechtra.dev/active-directory/nha/part2',
    chunk: 'f4fdeae3.2c0cd3f2.js',
    filePath: 'docs/active-directory/nha/part2.md'
  },
  {
    docId: 'active-directory/nha/part3',
    url: 'http://neontechtra.dev/active-directory/nha/part3',
    chunk: '7fc3aecd.8557053a.js',
    filePath: 'docs/active-directory/nha/part3.md'
  },
  {
    docId: 'active-directory/nha/part4',
    url: 'http://neontechtra.dev/active-directory/nha/part4',
    chunk: '32f490cb.afc6d993.js',
    filePath: 'docs/active-directory/nha/part4.md'
  },
  {
    docId: 'active-directory/nha/part5',
    url: 'http://neontechtra.dev/active-directory/nha/part5',
    chunk: '53be2547.c6c4a081.js',
    filePath: 'docs/active-directory/nha/part5.md'
  },
  {
    docId: 'active-directory/nha/part6',
    url: 'http://neontechtra.dev/active-directory/nha/part6',
    chunk: '7bd3670b.9ac2923f.js',
    filePath: 'docs/active-directory/nha/part6.md'
  },
  {
    docId: 'web-exploitation/portswigger/sql-injection-lab1',
    url: 'http://neontechtra.dev/web-exploitation/portswigger/sql-injection-lab1',
    chunk: 'a5e4517a.67cc7698.js',
    filePath: 'docs/web-exploitation/portswigger/sql-injection-lab1.md'
  }
];

function cleanText(text) {
  if (!text) return '';
  return text.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
}

function cleanHeadingText($, el) {
  const clone = $(el).clone();
  clone.find('.hash-link, a[class*="hash-link"]').remove();
  
  function nodeToMd(node) {
    if (node.type === 'text') {
      return cleanText(node.data);
    }
    if (node.type === 'tag') {
      const tag = node.tagName.toLowerCase();
      const inner = node.children ? node.children.map(c => nodeToMd(c)).join('') : '';
      if (tag === 'code') return `\`${inner}\``;
      if (tag === 'strong' || tag === 'b') return `**${inner}**`;
      if (tag === 'em' || tag === 'i') return `*${inner}*`;
      return inner;
    }
    return '';
  }

  return clone.contents().map((i, c) => nodeToMd(c)).get().join('').trim();
}

function parseNode($, el, indent = '', imageDir = '') {
  if (el.type === 'text') {
    return cleanText(el.data);
  }
  if (el.type !== 'tag') return '';

  const tag = el.tagName.toLowerCase();
  const $el = $(el);

  // Admonition
  if (tag === 'div' && $el.attr('class') && $el.attr('class').includes('theme-admonition')) {
    const cls = $el.attr('class');
    const typeMatch = cls.match(/theme-admonition-(\w+)/);
    const type = typeMatch ? typeMatch[1] : 'info';
    
    const headingEl = $el.find('[class*="admonitionHeading"]');
    let title = cleanText(headingEl.text()).trim();
    const isDefaultTitle = title.toLowerCase() === type.toLowerCase();
    const titleAttr = isDefaultTitle || !title ? '' : `[${title}]`;

    const contentEl = $el.find('[class*="admonitionContent"]');
    const innerMd = contentEl.contents().map((i, c) => parseNode($, c, indent, imageDir)).get().join('').trim();
    return `\n\n:::${type}${titleAttr}\n${innerMd}\n:::\n\n`;
  }

  // Code Block Container
  if (tag === 'div' && $el.attr('class') && ($el.attr('class').includes('codeBlockContainer') || $el.find('pre').length > 0)) {
    const pre = $el.find('pre');
    if (pre.length > 0) {
      const cls = pre.attr('class') || '';
      const langMatch = cls.match(/language-(\S+)/);
      const lang = langMatch ? langMatch[1] : '';
      
      let codeText = '';
      const lines = pre.find('.token-line');
      if (lines.length > 0) {
        codeText = lines.map((i, l) => $(l).text()).get().join('\n');
      } else {
        codeText = pre.text();
      }
      codeText = cleanText(codeText).replace(/\n+$/, '');
      return `\n\n\`\`\`${lang}\n${codeText}\n\`\`\`\n\n`;
    }
  }

  if (tag === 'pre') {
    const cls = $el.attr('class') || '';
    const langMatch = cls.match(/language-(\S+)/);
    const lang = langMatch ? langMatch[1] : '';
    let codeText = '';
    const lines = $el.find('.token-line');
    if (lines.length > 0) {
      codeText = lines.map((i, l) => $(l).text()).get().join('\n');
    } else {
      codeText = $el.text();
    }
    codeText = cleanText(codeText).replace(/\n+$/, '');
    return `\n\n\`\`\`${lang}\n${codeText}\n\`\`\`\n\n`;
  }

  // Headings
  if (/^h[1-6]$/.test(tag)) {
    const level = parseInt(tag[1], 10);
    const headingText = cleanHeadingText($, el);
    return `\n\n${'#'.repeat(level)} ${headingText}\n\n`;
  }

  if (tag === 'header') {
    const h1 = $el.find('h1');
    if (h1.length > 0) {
      const headingText = cleanHeadingText($, h1[0]);
      return `\n\n# ${headingText}\n\n`;
    }
    return $el.contents().map((i, c) => parseNode($, c, indent, imageDir)).get().join('');
  }

  // Paragraphs
  if (tag === 'p') {
    const inner = $el.contents().map((i, c) => parseNode($, c, indent, imageDir)).get().join('');
    return `\n\n${inner.trim()}\n\n`;
  }

  // Lists
  if (tag === 'ul' || tag === 'ol') {
    const isOrdered = tag === 'ol';
    const startAttr = $el.attr('start');
    let startNum = startAttr ? parseInt(startAttr, 10) : 1;

    let itemsMd = '';
    $el.children('li').each((i, li) => {
      const prefix = isOrdered ? `${startNum++}. ` : '- ';
      const nextIndent = indent + '  ';
      
      let itemContent = '';
      $(li).contents().each((j, child) => {
        if (child.type === 'tag' && (child.tagName === 'ul' || child.tagName === 'ol')) {
          itemContent += '\n' + parseNode($, child, nextIndent, imageDir);
        } else {
          itemContent += parseNode($, child, nextIndent, imageDir);
        }
      });
      
      itemContent = itemContent.trim();
      itemsMd += `\n${indent}${prefix}${itemContent}`;
    });

    return itemsMd + '\n\n';
  }

  // Blockquote
  if (tag === 'blockquote') {
    const inner = $el.contents().map((i, c) => parseNode($, c, indent, imageDir)).get().join('').trim();
    const quoted = inner.split('\n').map(line => `> ${line}`).join('\n');
    return `\n\n${quoted}\n\n`;
  }

  // Images
  if (tag === 'img') {
    const alt = $el.attr('alt') || '';
    let src = $el.attr('src') || '';
    
    if (src.startsWith('/assets/images/') || src.startsWith('assets/images/')) {
      const filenameWithHash = path.basename(src);
      const cleanName = filenameWithHash.replace(/-[a-f0-9]{32}\./i, '.');
      return `![${alt}](./${cleanName})`;
    } else if (src.startsWith('data:image/')) {
      return `![${alt}](./${alt}.png)`;
    } else {
      return `![${alt}](${src})`;
    }
  }

  // Links
  if (tag === 'a') {
    const href = $el.attr('href') || '';
    if ($el.hasClass('hash-link')) return '';
    const inner = $el.contents().map((i, c) => parseNode($, c, indent, imageDir)).get().join('');
    return `[${inner}](${href})`;
  }

  // Inline styling
  if (tag === 'strong' || tag === 'b') {
    const inner = $el.contents().map((i, c) => parseNode($, c, indent, imageDir)).get().join('');
    return `**${inner}**`;
  }

  if (tag === 'em' || tag === 'i') {
    const inner = $el.contents().map((i, c) => parseNode($, c, indent, imageDir)).get().join('');
    return `*${inner}*`;
  }

  if (tag === 'code') {
    const inner = $el.text();
    return `\`${cleanText(inner)}\``;
  }

  if (tag === 'br') {
    return '\n';
  }

  // Generic containers
  return $el.contents().map((i, c) => parseNode($, c, indent, imageDir)).get().join('');
}

function convertHtmlToMarkdown(html, meta, imageDir) {
  const $ = cheerio.load(html);
  const markdownContainer = $('article .theme-doc-markdown, article .markdown');
  
  let bodyMd = '';
  markdownContainer.children().each((i, el) => {
    // If it is header and document does not have content title, skip the injected header h1
    if (el.tagName.toLowerCase() === 'header' && meta && !meta.hasContentTitle) {
      return;
    }
    bodyMd += parseNode($, el, '', imageDir);
  });

  bodyMd = bodyMd.replace(/\n{3,}/g, '\n\n').trim();

  // Add frontmatter if present
  if (meta && meta.frontMatter && Object.keys(meta.frontMatter).length > 0) {
    const fm = meta.frontMatter;
    let fmStr = '---\n';
    for (const [k, v] of Object.entries(fm)) {
      if (typeof v === 'string') {
        fmStr += `${k}: "${v.replace(/"/g, '\\"')}"\n`;
      } else {
        fmStr += `${k}: ${v}\n`;
      }
    }
    fmStr += '---\n\n';
    return fmStr + bodyMd + '\n';
  }

  return bodyMd + '\n';
}

async function downloadImages(html, targetDir) {
  const $ = cheerio.load(html);
  const imgs = $('img');
  for (let i = 0; i < imgs.length; i++) {
    const img = $(imgs[i]);
    const src = img.attr('src');
    const alt = img.attr('alt');
    if (!src) continue;

    if (src.startsWith('/assets/images/') || src.startsWith('assets/images/')) {
      const fullUrl = `http://neontechtra.dev${src.startsWith('/') ? '' : '/'}${src}`;
      const filenameWithHash = path.basename(src);
      const cleanName = filenameWithHash.replace(/-[a-f0-9]{32}\./i, '.');
      const targetPath = path.join(targetDir, cleanName);
      
      if (!fs.existsSync(targetPath)) {
        console.log(`  Downloading image: ${cleanName} from ${fullUrl}`);
        const res = await fetch(fullUrl);
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(targetPath, buffer);
        } else {
          console.error(`  Failed to download image ${fullUrl}: status ${res.status}`);
        }
      }
    } else if (src.startsWith('data:image/')) {
      const base64Data = src.replace(/^data:image\/\w+;base64,/, '');
      const cleanName = `${alt}.png`;
      const targetPath = path.join(targetDir, cleanName);
      if (!fs.existsSync(targetPath)) {
        console.log(`  Saving Base64 image: ${cleanName}`);
        fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));
      }
    }
  }
}

async function scrapeAndReconstruct() {
  console.log('Starting NeonTechtra reconstruction...');

  // 1. Clean existing docs/ folder
  console.log('Cleaning docs/ directory...');
  if (fs.existsSync(DOCS_DIR)) {
    fs.rmSync(DOCS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DOCS_DIR, { recursive: true });

  // 2. Process each doc
  for (const doc of DOCS_CONFIG) {
    console.log(`Processing: ${doc.docId} (${doc.filePath})...`);
    
    // Fetch JS chunk to get exact metadata
    const chunkRes = await fetch(`http://neontechtra.dev/assets/js/${doc.chunk}`);
    const js = await chunkRes.text();
    const metaMatch = js.match(/JSON\.parse\(([\s\S]*?)\);/);
    const meta = metaMatch ? JSON.parse(eval(metaMatch[1])) : {};
    const hasContentTitle = Boolean(CONTENT_TITLES[doc.docId]);

    // Fetch HTML page
    const pageRes = await fetch(doc.url);
    const html = await pageRes.text();

    const targetFilePath = path.join(ROOT_DIR, doc.filePath);
    const targetDir = path.dirname(targetFilePath);
    fs.mkdirSync(targetDir, { recursive: true });

    // Download images into the doc directory
    await downloadImages(html, targetDir);

    // Convert HTML to Markdown
    const markdown = convertHtmlToMarkdown(html, { frontMatter: meta.frontMatter, hasContentTitle }, targetDir);

    fs.writeFileSync(targetFilePath, markdown, 'utf-8');
    console.log(`  Saved ${targetFilePath} (${markdown.length} bytes)`);
  }

  // 3. Reconstruct src/pages/index.js
  console.log('Updating src/pages/index.js (redirect to /home)...');
  const indexJsPath = path.join(ROOT_DIR, 'src/pages/index.js');
  fs.mkdirSync(path.dirname(indexJsPath), { recursive: true });
  fs.writeFileSync(indexJsPath, `import React from 'react';
import { Redirect } from '@docusaurus/router';

export default function Home() {
  return <Redirect to="/home" />;
}
`, 'utf-8');

  // 4. Reconstruct sidebars.js
  console.log('Updating sidebars.js...');
  const sidebarsPath = path.join(ROOT_DIR, 'sidebars.js');
  const sidebarsContent = `// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    {
      type: 'category',
      label: 'Home',
      items: ['home'],
      collapsed: true,
      collapsible: true,
    },
    {
      type: 'category',
      label: 'Home Lab',
      items: [
        {
          type: 'category',
          label: 'Lab (D2.LOD)',
          items: ['homelab/structure/layout'],
          collapsed: true,
          collapsible: true,
        },
      ],
      collapsed: true,
      collapsible: true,
    },
    {
      type: 'category',
      label: 'Active Directory',
      items: [
        {
          type: 'category',
          label: 'GOAD',
          items: [
            'active-directory/goad/part1',
            'active-directory/goad/part2',
          ],
          collapsed: true,
          collapsible: true,
        },
        {
          type: 'category',
          label: 'NHA',
          items: [
            'active-directory/nha/part1',
            'active-directory/nha/part2',
            'active-directory/nha/part3',
            'active-directory/nha/part4',
            'active-directory/nha/part5',
            'active-directory/nha/part6',
          ],
          collapsed: true,
          collapsible: true,
        },
      ],
      collapsed: true,
      collapsible: true,
    },
    {
      type: 'category',
      label: 'Web Exploitation',
      items: [
        {
          type: 'category',
          label: 'PortSwigger',
          items: ['web-exploitation/portswigger/sql-injection-lab1'],
          collapsed: true,
          collapsible: true,
        },
      ],
      collapsed: true,
      collapsible: true,
    },
    {
      type: 'category',
      label: 'About',
      items: ['about-me'],
      collapsed: true,
      collapsible: true,
    },
  ],
};

export default sidebars;
`;
  fs.writeFileSync(sidebarsPath, sidebarsContent, 'utf-8');

  // 5. Update docusaurus.config.js
  console.log('Updating docusaurus.config.js...');
  const configPath = path.join(ROOT_DIR, 'docusaurus.config.js');
  const docusaurusConfigContent = `// @ts-check
// \`@type\` JSDoc annotations allow editor autocompletion and type checking
// (when paired with \`@ts-check\`).

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'NeonTechtra',
  tagline: 'Technical Notes & Writeups',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://neontechtra.github.io',
  baseUrl: '/',
  organizationName: 'neontechtra',
  projectName: 'neontechtra.github.io',
  trailingSlash: false,
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: ['docusaurus-plugin-image-zoom'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
        },
        blog: false,
        pages: {},
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'NeonTechtra',
        items: [
          {
            type: 'doc',
            docId: 'home',
            position: 'left',
            label: 'Home',
          },
          {
            href: 'https://github.com/neontechtra/',
            label: 'GitHub',
            position: 'right',
          },
        ],
        hideOnScroll: false,
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      prism: {
        theme: prismThemes.dracula,
        darkTheme: prismThemes.dracula,
      },
      zoom: {
        selector: '.markdown :not(em) > img',
        background: {
          light: 'rgb(255, 255, 255)',
          dark: 'rgb(50, 50, 50)',
        },
        config: {
          margin: 24,
          scrollOffset: 0,
        },
      },
    }),
};

export default config;
`;
  fs.writeFileSync(configPath, docusaurusConfigContent, 'utf-8');

  console.log('Reconstruction script finished successfully!');
}

scrapeAndReconstruct().catch(err => {
  console.error('Error during reconstruction:', err);
  process.exit(1);
});
