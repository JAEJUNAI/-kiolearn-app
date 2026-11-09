// 공유 미리보기용 사진 (gpt-image-1.5). 휴대폰만이 아니라 키오스크·태블릿·은행·AI 등 '디지털 생활 전반'이 보이게.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const keyFile = new URL('../../openai.key', import.meta.url);
const KEY = (process.env.OPENAI_API_KEY || (existsSync(keyFile) ? readFileSync(keyFile, 'utf8') : '')).replace(/^\s*OPENAI_API_KEY\s*=\s*/i, '').trim();
const STYLE = ' Photorealistic warm editorial photograph, natural soft daylight, bright clean Korean apartment interior with white and warm beige tones, a few soft orange accents, shallow depth of field, candid and genuine expressions, no text, no letters, no logos, no watermark. Compose the people on the right half of the frame, leave the left part calmer.';
const IMGS = [
  ['og-home', 'A friendly Korean woman instructor in her 50s visits a Korean grandmother in her 70s at home. They sit side by side at a light wooden dining table. On the table: an open laptop, a tablet showing large colorful tiles like a kiosk ordering screen, and a printed worksheet with big pictures and a pencil. The grandmother points at the tablet confidently while the instructor watches and smiles. No smartphone in focus.'],
  ['og-teach', 'A Korean woman in her 50s, a home-visit digital instructor with a lanyard ID card and a canvas tote bag holding a tablet and printed worksheets, rings the doorbell of a Korean apartment door, smiling, seen from the side in a bright hallway.'],
];
await Promise.all(IMGS.map(async ([f, p]) => {
  const out = new URL(`../assets/img/${f}.png`, import.meta.url);
  if (existsSync(out)) return console.log('skip', f);
  for (let t = 0; t < 3; t++) {
    const res = await fetch('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-image-1.5', prompt: p + STYLE, size: '1536x1024', quality: 'high', output_format: 'png', n: 1 }) });
    const j = await res.json(); if (res.ok) { writeFileSync(out, Buffer.from(j.data[0].b64_json, 'base64')); return console.log('ok', f); }
    console.error('retry', f, JSON.stringify(j.error || j).slice(0, 160));
  }
}));
