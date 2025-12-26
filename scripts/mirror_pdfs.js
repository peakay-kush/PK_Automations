console.log('mirror_pdfs script disabled — PDF mirroring removed as a feature');
process.exit(0);

/*
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const dataFiles = [
  'src/data/uploads.json',
  'src/data/tutorials.json',
  'src/data/services.json'
];*/

const outDir = path.join(process.cwd(), 'public', 'pdfs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function safeFileNameFromUrl(u) {
  try {
    const parsed = new URL(u);
    let name = path.basename(parsed.pathname);
    // remove query
    name = name.split('?')[0].split('#')[0];
    // fix double .pdf.pdf
    name = name.replace(/\.pdf(?:\.pdf)+$/i, '.pdf');
    // ensure extension
    if (!/\.pdf$/i.test(name)) name += '.pdf';
    // sanitize
    name = name.replace(/[^a-zA-Z0-9._-]/g, '-');
    return name;
  } catch (e) {
    return null;
  }
}

async function download(url, dest) {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return reject(new Error('Download failed: ' + res.status));
      const destStream = fs.createWriteStream(dest);
      const reader = res.body;
      // Node.js response.body is a readable stream
      reader.pipe(destStream);
      destStream.on('finish', () => resolve());
      destStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

(async () => {
  try {
    // collect URLs
    const urlSet = new Set();
    for (const f of dataFiles) {
      if (!fs.existsSync(f)) continue;
      const txt = fs.readFileSync(f, 'utf8');
      const re = /https?:\/\/[\w\-./?=&#%+~!()\[\]@,:;]+?\.pdf(?:\.pdf)?/ig;
      let m;
      while ((m = re.exec(txt))) {
        urlSet.add(m[0]);
      }
    }

    const urls = Array.from(urlSet);
    if (urls.length === 0) {
      console.log('No remote PDF URLs found in data files.');
      return;
    }

    console.log(`Found ${urls.length} unique PDF(s).`);
    const mapping = {};

    for (const u of urls) {
      const name = safeFileNameFromUrl(u);
      if (!name) { console.warn('Skipping invalid URL', u); continue; }
      let dest = path.join(outDir, name);
      // avoid overwriting: if file exists, skip download
      if (fs.existsSync(dest)) {
        console.log('Already exists, skipping:', name);
        mapping[u] = `/pdfs/${name}`;
        continue;
      }

      console.log('Downloading', u, '->', `/pdfs/${name}`);
      try {
        await download(u, dest);
        mapping[u] = `/pdfs/${name}`;
      } catch (err) {
        console.error('Failed to download', u, err.message || err);
      }
    }

    // replace occurrences in files (make backups)
    for (const f of dataFiles) {
      if (!fs.existsSync(f)) continue;
      const txt = fs.readFileSync(f, 'utf8');
      let newTxt = txt;
      for (const [remote, localPath] of Object.entries(mapping)) {
        const escaped = remote.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        newTxt = newTxt.replace(new RegExp(escaped, 'g'), localPath);
      }
      if (newTxt !== txt) {
        fs.copyFileSync(f, `${f}.bak`);
        fs.writeFileSync(f, newTxt, 'utf8');
        console.log('Updated file:', f);
      }
    }

    // Report summary
    console.log('\nSummary:');
    for (const [k, v] of Object.entries(mapping)) console.log(k, '->', v);
    console.log('\nDone. Please review changes and restart the dev server if needed.');
  } catch (err) {
    console.error('Error during mirroring process', err);
    process.exit(1);
  }
})();
