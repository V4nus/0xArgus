const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const PUBLIC_DIR = path.join(__dirname, '../public');

// Chain icons to download
const CHAIN_ICONS = {
  base: 'https://raw.githubusercontent.com/base-org/brand-kit/main/logo/symbol/Base_Symbol_Blue.svg',
  bsc: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  solana: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  ethereum: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
};

// Token icons to download
const TOKEN_ICONS = {
  // Base tokens
  degen: 'https://assets.coingecko.com/coins/images/34515/small/android-chrome-512x512.png',
  brett: 'https://assets.coingecko.com/coins/images/35529/small/1000050750.png',
  toshi: 'https://assets.coingecko.com/coins/images/31126/small/Toshi_Logo.png',
  aero: 'https://assets.coingecko.com/coins/images/31745/small/token.png',
  virtual: 'https://assets.coingecko.com/coins/images/36285/small/virtual.png',
  well: 'https://assets.coingecko.com/coins/images/26133/small/moonwell.png',
  extra: 'https://assets.coingecko.com/coins/images/31045/small/extra.png',
  bald: 'https://assets.coingecko.com/coins/images/31119/small/bald.png',
  based: 'https://assets.coingecko.com/coins/images/31108/small/based.png',
  cbbtc: 'https://assets.coingecko.com/coins/images/40143/small/cbbtc.webp',
  // BSC tokens
  cake: 'https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo.png',
  bake: 'https://assets.coingecko.com/coins/images/12588/small/bakerytoken_logo.jpg',
  xvs: 'https://assets.coingecko.com/coins/images/12677/small/venus.png',
  alpaca: 'https://assets.coingecko.com/coins/images/14165/small/alpaca_logo.png',
  raca: 'https://assets.coingecko.com/coins/images/17841/small/raca.png',
  bsw: 'https://assets.coingecko.com/coins/images/16845/small/biswap.png',
  baby: 'https://assets.coingecko.com/coins/images/16169/small/baby.png',
  twt: 'https://assets.coingecko.com/coins/images/11085/small/Trust.png',
  sfp: 'https://assets.coingecko.com/coins/images/13905/small/sfp.png',
  lina: 'https://assets.coingecko.com/coins/images/12509/small/linear.png',
  // Solana tokens
  wif: 'https://assets.coingecko.com/coins/images/33566/small/dogwifhat.jpg',
  bonk: 'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg',
  jto: 'https://assets.coingecko.com/coins/images/33103/small/jto.png',
  pyth: 'https://assets.coingecko.com/coins/images/31924/small/pyth.png',
  jup: 'https://assets.coingecko.com/coins/images/34188/small/jup.png',
  orca: 'https://assets.coingecko.com/coins/images/17547/small/orca.png',
  ray: 'https://assets.coingecko.com/coins/images/13928/small/ray.png',
  popcat: 'https://assets.coingecko.com/coins/images/35642/small/popcat.jpg',
  render: 'https://assets.coingecko.com/coins/images/11636/small/render.png',
  kmno: 'https://assets.coingecko.com/coins/images/36081/small/kamino.png',
  // Ethereum tokens
  pepe: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
  mog: 'https://assets.coingecko.com/coins/images/31200/small/mog.png',
  turbo: 'https://assets.coingecko.com/coins/images/30117/small/turbo.png',
  floki: 'https://assets.coingecko.com/coins/images/16746/small/PNG_image.png',
  shib: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
  ape: 'https://assets.coingecko.com/coins/images/24383/small/apecoin.png',
  ldo: 'https://assets.coingecko.com/coins/images/13573/small/lido.png',
  uni: 'https://assets.coingecko.com/coins/images/12504/small/uni.png',
  aave: 'https://assets.coingecko.com/coins/images/12645/small/aave.png',
  ens: 'https://assets.coingecko.com/coins/images/19785/small/ens.png',
};

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(destPath);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });

    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

async function downloadIcons() {
  // Create directories
  const chainsDir = path.join(PUBLIC_DIR, 'chains');
  const tokensDir = path.join(PUBLIC_DIR, 'tokens');

  if (!fs.existsSync(chainsDir)) fs.mkdirSync(chainsDir, { recursive: true });
  if (!fs.existsSync(tokensDir)) fs.mkdirSync(tokensDir, { recursive: true });

  console.log('Downloading chain icons...');
  for (const [name, url] of Object.entries(CHAIN_ICONS)) {
    const ext = url.includes('.svg') ? 'svg' : 'png';
    const destPath = path.join(chainsDir, `${name}.${ext}`);

    if (fs.existsSync(destPath)) {
      console.log(`  ✓ ${name} (exists)`);
      continue;
    }

    try {
      await downloadFile(url, destPath);
      console.log(`  ✓ ${name}`);
    } catch (err) {
      console.log(`  ✗ ${name}: ${err.message}`);
    }
  }

  console.log('\nDownloading token icons...');
  for (const [name, url] of Object.entries(TOKEN_ICONS)) {
    // Determine extension from URL
    let ext = 'png';
    if (url.includes('.jpg') || url.includes('.jpeg')) ext = 'jpg';
    else if (url.includes('.webp')) ext = 'webp';
    else if (url.includes('.svg')) ext = 'svg';

    const destPath = path.join(tokensDir, `${name}.${ext}`);

    if (fs.existsSync(destPath)) {
      console.log(`  ✓ ${name} (exists)`);
      continue;
    }

    try {
      await downloadFile(url, destPath);
      console.log(`  ✓ ${name}`);
      // Add small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.log(`  ✗ ${name}: ${err.message}`);
    }
  }

  console.log('\nDone!');
}

downloadIcons().catch(console.error);
