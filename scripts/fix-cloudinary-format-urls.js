/**
 * Fix Cloudinary format URLs (thumbnail, small, medium, large) that return 404.
 * Replaces stored URLs with on-the-fly transformation URLs using the main image's public_id.
 *
 * Run: set -a && source .env && set +a && node scripts/fix-cloudinary-format-urls.js
 * Or: DATABASE_URL="postgres://..." node scripts/fix-cloudinary-format-urls.js
 */

const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}
const { Client } = require('pg');

// Cloudinary on-the-fly transformation parameters (match common Strapi sizes)
const FORMAT_SPECS = {
  thumbnail: { width: 245, height: 156, crop: 'fill' },
  small: { width: 500, height: null, crop: 'fill' },
  medium: { width: 750, height: null, crop: 'fill' },
  large: { width: 1000, height: null, crop: 'fill' },
};

// Pasta no Cloudinary (ex.: diex). Se as imagens estão em uma pasta, defina em .env como CLOUDINARY_FOLDER
const CLOUDINARY_FOLDER = (process.env.CLOUDINARY_FOLDER || '').trim();

function parseCloudinaryUrl(url) {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  url = url.trim();
  const match = url.match(/^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload)\/(v\d+)\/(.+)$/);
  if (!match) return null;
  let [, base, version, path] = match;
  // Se temos pasta configurada e o path ainda não contém pasta (não tem /), prefixar
  if (CLOUDINARY_FOLDER && !path.includes('/')) {
    path = `${CLOUDINARY_FOLDER}/${path}`;
  }
  return { base, version, path };
}

function buildTransformationUrl(base, version, path, spec) {
  const { width, height, crop } = spec;
  let trans = `w_${width}`;
  if (height) trans += `,h_${height}`;
  trans += `,c_${crop}`;
  return `${base}/${trans}/${version}/${path}`;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: connectionString.startsWith('postgres://') ? { rejectUnauthorized: false } : false,
  });
  await client.connect();

  const res = await client.query(
    `SELECT id, name, url, mime, formats FROM files WHERE provider = 'cloudinary' AND url IS NOT NULL AND url LIKE '%res.cloudinary.com%'`
  );

  let updated = 0;
  for (const row of res.rows) {
    let mainUrl = row.url.trim();
    // Se temos pasta e a URL principal ainda não inclui a pasta no path, atualizar a coluna url
    if (CLOUDINARY_FOLDER && mainUrl.includes('res.cloudinary.com') && !mainUrl.includes(`/${CLOUDINARY_FOLDER}/`)) {
      const mainMatch = mainUrl.match(/^(.+\/upload\/)(v\d+)\/(.+)$/);
      if (mainMatch) {
        const [, prefix, version, pathOnly] = mainMatch;
        if (!pathOnly.includes('/')) {
          mainUrl = `${prefix}${version}/${CLOUDINARY_FOLDER}/${pathOnly}`;
          await client.query('UPDATE files SET url = $1 WHERE id = $2', [mainUrl, row.id]);
          updated++;
          console.log(`Updated main URL for file id=${row.id} (${row.name})`);
        }
      }
    }

    const parsed = parseCloudinaryUrl(mainUrl);
    if (!parsed) continue;
    if (!row.mime || !row.mime.startsWith('image/')) continue; // skip PDFs for formats

    let formats = row.formats;
    if (!formats || typeof formats !== 'object') continue;

    let changed = false;
    const newFormats = { ...formats };

    for (const [formatName, spec] of Object.entries(FORMAT_SPECS)) {
      const existing = formats[formatName];
      if (!existing || !existing.url) continue;

      const newUrl = buildTransformationUrl(parsed.base, parsed.version, parsed.path, spec);
      if (existing.url !== newUrl) {
        newFormats[formatName] = { ...existing, url: newUrl };
        changed = true;
      }
    }

    if (changed) {
      await client.query('UPDATE files SET formats = $1::jsonb WHERE id = $2', [
        JSON.stringify(newFormats),
        row.id,
      ]);
      updated++;
      console.log(`Updated formats for file id=${row.id} (${row.name})`);
    }
  }

  console.log(`Done. Updated ${updated} file(s).`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
