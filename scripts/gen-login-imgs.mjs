// 로그인 화면 사진 4장 (gpt-image-1.5) → assets/img/login-*.png → 아래 python으로 jpg 압축
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const keyFile = new URL('../../openai.key', import.meta.url);
const KEY = (process.env.OPENAI_API_KEY || (existsSync(keyFile) ? readFileSync(keyFile, 'utf8') : '')).replace(/^\s*OPENAI_API_KEY\s*=\s*/i, '').trim();
if (!KEY) { console.error('no key'); process.exit(1); }
const STYLE = ' Photorealistic warm editorial photograph, natural soft daylight, bright clean Korean apartment interior with white and warm beige tones, a few soft orange accents (cushion or mug), shallow depth of field, candid and genuine expressions, no text, no letters, no logos, no watermark.';
const IMGS = [
  ['login-hero', 'A friendly Korean woman instructor in her 50s with a neat cardigan sits beside a smiling Korean grandmother in her 70s at a light wooden living-room table, both looking at the grandmother\'s smartphone together, the grandmother tapping the screen herself, cozy and encouraging.'],
  ['login-family', 'A Korean woman in her 40s in a bright office break area smiles warmly while looking at her smartphone, as if reading good news about her mother\'s lesson, a coffee mug beside her, relieved and happy mood.'],
  ['login-self', 'A cheerful Korean grandfather in his 70s with gray hair and glasses sits on a sofa holding a smartphone with both hands, proudly showing that he did something on the screen, natural and dignified.'],
  ['login-teacher', 'A confident Korean woman in her 50s, a home-visit digital instructor with a small tote bag and a lanyard ID card, standing at an apartment entrance hallway, smiling warmly as she is about to visit, holding a tablet, professional and kind.'],
];
await Promise.all(IMGS.map(async ([f, p]) => {
  const out = new URL(`../assets/img/${f}.png`, import.meta.url);
  if (existsSync(out)) return console.log('skip', f);
  for (let t = 0; t < 3; t++) {
    const res = await fetch('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-image-1.5', prompt: p + STYLE, size: '1536x1024', quality: 'medium', output_format: 'png', n: 1 }) });
    const j = await res.json(); if (res.ok) { writeFileSync(out, Buffer.from(j.data[0].b64_json, 'base64')); return console.log('ok', f); }
    console.error('retry', f, JSON.stringify(j.error || j).slice(0, 160));
  }
}));
