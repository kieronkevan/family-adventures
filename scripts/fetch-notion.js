// Pulls all "Verified" (and "Published") rows from the Notion database
// and writes them to docs/data.json for the static site to read.
//
// Requires two environment variables (set as GitHub Actions secrets):
//   NOTION_TOKEN      - an internal integration token with access to the database
//   NOTION_DATABASE_ID - the ID of the "Family Days Out" database

const fs = require('fs');
const path = require('path');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_VERSION = '2022-06-28';

if (!NOTION_TOKEN || !DATABASE_ID) {
  console.error('Missing NOTION_TOKEN or NOTION_DATABASE_ID environment variables.');
  process.exit(1);
}

function getRichText(prop) {
  if (!prop) return '';
  const arr = prop.rich_text || [];
  return arr.map(t => t.plain_text).join('');
}

function getSelect(prop) {
  return prop && prop.select ? prop.select.name : null;
}

function getMultiSelect(prop) {
  return prop && prop.multi_select ? prop.multi_select.map(o => o.name) : [];
}

function getUrl(prop) {
  return prop && prop.url ? prop.url : null;
}

function getTitle(prop) {
  if (!prop) return '';
  const arr = prop.title || [];
  return arr.map(t => t.plain_text).join('');
}

async function fetchAllPages() {
  const pages = [];
  let cursor = undefined;

  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        start_cursor: cursor,
        filter: {
          or: [
            { property: 'Status', select: { equals: 'Verified' } },
            { property: 'Status', select: { equals: 'Published' } }
          ]
        }
      })
    });

    if (!res.ok) {
      throw new Error(`Notion API error: ${res.status} ${await res.text()}`);
    }

    const json = await res.json();
    pages.push(...json.results);
    cursor = json.has_more ? json.next_cursor : undefined;
  } while (cursor);

  return pages;
}

async function main() {
  const pages = await fetchAllPages();

  const places = pages.map(page => {
    const props = page.properties;
    return {
      name: getTitle(props['Name']),
      primaryType: getSelect(props['Primary type']),
      area: getSelect(props['Area']),
      tags: getMultiSelect(props['Tags']),
      ageSuitability: getMultiSelect(props['Age suitability']),
      priceInfo: getRichText(props['Price info']),
      address: getRichText(props['Address']),
      openingHours: getRichText(props['Opening hours']),
      website: getUrl(props['Website']),
      imageUrl: getUrl(props['Image URL'])
    };
  });

  const output = {
    generatedAt: new Date().toISOString().slice(0, 10),
    places
  };

  const outPath = path.join(__dirname, '..', 'docs', 'data.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Wrote ${places.length} places to ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
