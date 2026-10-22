// .env 의 값을 Vercel kiolearn-app 프로젝트 환경변수로 올린다.  사용: npm run env:push  (비어 있는 값은 건너뜀)
// 토큰은 VERCEL_TOKEN 환경변수 또는 상위 폴더의 vercel.key 를 읽는다. 서버 전용 값은 Sensitive 로 올린다.
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
const token = process.env.VERCEL_TOKEN || (existsSync('../vercel.key') ? readFileSync('../vercel.key', 'utf8').trim() : '');
if (!token) { console.error('VERCEL_TOKEN 또는 ../vercel.key 가 필요합니다.'); process.exit(1); }
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).trim()]; }));
const base = `vercel --scope jaejun-ai --token ${token}`;
const run = (cmd, input) => execSync(`${base} ${cmd}`, { stdio: input === undefined ? 'inherit' : ['pipe', 'inherit', 'inherit'], input, shell: true });
if (!existsSync('.vercel/project.json')) run('link --yes --project kiolearn-app');
for (const [k, v] of Object.entries(env)) {
  if (!v) { console.log('skip (empty)', k); continue; }
  try { execSync(`${base} env rm ${k} production --yes`, { stdio: 'ignore', shell: true }); } catch {}
  const sensitive = !k.startsWith('EXPO_PUBLIC_') ? ' --sensitive' : '';
  run(`env add ${k} production${sensitive}`, v + '\n');
  console.log('set', k, sensitive ? '(sensitive)' : '');
}
console.log('done. Vercel에서 Redeploy 하면 반영됩니다.');
