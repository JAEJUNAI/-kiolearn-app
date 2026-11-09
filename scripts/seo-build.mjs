// expo export 뒤에 실행: 공개 페이지마다 따로 HTML을 만든다.
// - 검색엔진·카카오톡이 JS 없이도 제목·설명·본문을 읽을 수 있게 한다.
// - 로그인 뒤 화면은 app-shell.html(noindex)로 보낸다. vercel.json rewrites 참고.
// 실행: node scripts/seo-build.mjs  (vercel buildCommand에 포함)
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const SITE = 'https://app.kiolearn.co.kr';
const MAIN = 'https://kiolearn.co.kr';
const PLAY = 'https://play.google.com/store/apps/details?id=kr.co.kiolearn.app';
const TEL = '010-3871-5430';
const base = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CSS = `<style id="seo-static">
#root>.s{font-family:Pretendard,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#111;max-width:560px;margin:0 auto;padding:28px 20px 60px;line-height:1.6;overflow:auto;height:100%;box-sizing:border-box}
#root>.s h1{font-size:28px;line-height:1.3;margin:12px 0}#root>.s h2{font-size:19px;margin:28px 0 8px}
#root>.s p,#root>.s li{font-size:16px;color:#333}#root>.s a{color:#f96d32}
#root>.s .brand{font-weight:800;font-size:18px}#root>.s table{border-collapse:collapse;width:100%}
#root>.s td{border-bottom:1px solid #eee;padding:8px 4px;font-size:15px}
</style>`;

function page({ file, url, title, desc, robots = 'index,follow', og = '/og.jpg', body = '', ld = [] }) {
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}" />`,
    `<meta name="robots" content="${robots}" />`,
    url ? `<link rel="canonical" href="${SITE}${url}" />` : '',
    `<meta name="theme-color" content="#f96d32" />`,
    `<meta name="naver-site-verification" content="467fc865ea26e2b2fb175a89d4cebc5e59b7d26c" />`,
    `<link rel="manifest" href="/manifest.webmanifest" />`,
    `<link rel="icon" href="/favicon.ico" sizes="any" />`,
    `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
    `<meta name="google-play-app" content="app-id=kr.co.kiolearn.app" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="키오런" />`,
    `<meta property="og:locale" content="ko_KR" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    url ? `<meta property="og:url" content="${SITE}${url}" />` : '',
    `<meta property="og:image" content="${SITE}${og}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${SITE}${og}" />`,
    ...ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`),
    CSS,
  ].filter(Boolean).join('\n    ');

  let html = base
    .replace('<html lang="en">', '<html lang="ko">')
    .replace('httpEquiv="X-UA-Compatible"', 'http-equiv="X-UA-Compatible"')
    .replace('<noscript> You need to enable JavaScript to run this app. </noscript>', '<noscript>키오런 앱은 자바스크립트를 켜야 쓸 수 있어요.</noscript>');
  if (!html.includes('<title>키오런</title>')) throw new Error('dist/index.html 형식이 바뀌었어요: <title> 없음');
  html = html.replace('<title>키오런</title>', head);
  // 본문은 #root 안에 넣는다. 앱 JS가 뜨면 화면이 이 자리를 대신한다.
  html = html.replace('<div id="root"></div>', `<div id="root">${body ? `<div class="s">${body}</div>` : ''}</div>`);
  fs.writeFileSync(path.join(DIST, file), html);
  console.log('seo', file);
}

const ORG = {
  '@context': 'https://schema.org', '@type': 'Organization', name: '키오런', alternateName: 'KIOLEARN',
  url: MAIN, logo: `${SITE}/icon-512.png`, telephone: TEL,
  parentOrganization: { '@type': 'Organization', name: '재준에이아이' },
  sameAs: [MAIN, PLAY],
};
const APP = {
  '@context': 'https://schema.org', '@type': 'MobileApplication', name: '키오런 - 부모님 1:1 과외',
  operatingSystem: 'ANDROID', applicationCategory: 'EducationalApplication', inLanguage: 'ko',
  downloadUrl: PLAY, installUrl: PLAY, url: SITE,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
  publisher: { '@type': 'Organization', name: '재준에이아이' },
};
const SERVICE = {
  '@context': 'https://schema.org', '@type': 'Service', name: '부모님 디지털 1:1 방문 수업',
  serviceType: '어르신 디지털 교육 방문 수업', provider: { '@type': 'Organization', name: '키오런', url: MAIN },
  areaServed: ['서울특별시', '경기도 하남시', '경기도 구리시', '경기도 성남시', '경기도 광명시', '경기도 부천시', '경기도 고양시'].map((n) => ({ '@type': 'AdministrativeArea', name: n })),
  offers: [
    { '@type': 'Offer', name: '첫 체험 1회(90분)', price: '39000', priceCurrency: 'KRW' },
    { '@type': 'Offer', name: '1회(90분)', price: '49000', priceCurrency: 'KRW' },
    { '@type': 'Offer', name: '3회권', price: '139000', priceCurrency: 'KRW' },
    { '@type': 'Offer', name: '10회권', price: '449000', priceCurrency: 'KRW' },
  ],
};
const FAQ = [
  ['어떤 걸 배우나요?', '전화·문자·카카오톡, 사진 보내기, 글씨 크게 하기, 은행·병원 앱, 키오스크 주문, AI에게 물어보기처럼 부모님이 매일 막히는 것부터 해요. 첫 수업에서 어디서 막히시는지 보고 순서를 정해요.'],
  ['수업은 어디서 하나요?', '부모님 댁에서 90분 동안 1:1로 해요. 평소 쓰시는 휴대폰이나 태블릿으로 그대로 배우고, 키오스크처럼 집에 없는 기기는 연습 화면과 활동지로 익혀요.'],
  ['가족은 무엇을 받나요?', '수업이 끝나면 앱으로 사진과 그날 배운 것, 다음에 할 것을 받아요. 다른 가족도 초대해서 같이 볼 수 있어요.'],
  ['강사는 어떤 분인가요?', '자격증과 신분을 확인하고, 출강 필수 교육을 마친 분만 배정돼요.'],
  ['환불은 되나요?', '첫 수업 전에는 전액 돌려드려요. 회수권은 쓴 회차를 1회 가격으로 빼고 돌려드려요.'],
];
const FAQ_LD = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
};
const faqHtml = `<h2>자주 묻는 것</h2>${FAQ.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}`;
const priceHtml = `<h2>가격</h2><table>
<tr><td>첫 체험 1회 (90분)</td><td>39,000원 · 처음 신청하는 가정만, 11월은 35,000원</td></tr>
<tr><td>1회 (90분)</td><td>49,000원</td></tr>
<tr><td>3회권</td><td>139,000원 · 같은 강사가 끝까지</td></tr>
<tr><td>10회권</td><td>449,000원 · 수료증과 액자 포함</td></tr>
</table><p>두 분이 함께 들으시면 회당 15,000원, 주말·저녁은 10,000원이 더해져요.</p>`;
const areaHtml = `<h2>바로 배정되는 지역</h2><p>서울 전역, 하남, 구리, 성남, 광명, 부천, 고양. 그 밖의 지역도 일정을 알려 주시면 찾아볼게요.</p>`;
const footHtml = `<h2>더 알아보기</h2><ul>
<li><a href="${MAIN}/visit">방문 수업 자세히 보기</a></li>
<li><a href="${MAIN}/curriculum">30회 커리큘럼</a></li>
<li><a href="${MAIN}/gift">부모님께 수업 선물하기</a></li>
<li><a href="${MAIN}/teach">강사로 일하기</a></li>
<li><a href="${PLAY}">구글 플레이에서 앱 받기</a></li>
</ul><p>문의 ${TEL} · <a href="${MAIN}">kiolearn.co.kr</a> · 재준에이아이</p>`;

// 1) 첫 화면
page({
  // 웹 앱은 로그인 전이면 /tour로 보내므로, 대표 주소(canonical)도 /tour로 모은다
  file: 'index.html', url: '/tour',
  title: '키오런 - 부모님 디지털 1:1 방문 수업 앱',
  desc: '강사가 부모님 댁으로 찾아가 휴대폰, 키오스크, 은행·병원 앱, AI 쓰는 법을 90분 1:1로 알려 드려요. 앱에서 예약하고 수업이 끝나면 사진과 결과를 받아요. 첫 체험 39,000원.',
  ld: [ORG, APP, SERVICE, FAQ_LD],
  body: `<div class="brand">키오런</div>
<h1>부모님 댁으로 찾아가는 1:1 디지털 수업</h1>
<p>식당 키오스크 주문, 은행 앱 이체, 병원 예약, 카카오톡 사진 보내기, AI에게 물어보기처럼 부모님이 자꾸 물어보시는 것들을 90분 동안 강사와 같이 해 봐요. 평소 쓰시는 기기로 배우고, 키오스크는 연습 화면과 활동지로 미리 익혀요. 가족은 키오런 앱에서 예약하고, 수업이 끝나면 사진과 그날 배운 것을 받아요.</p>
<p><a href="/login">앱 시작하기</a> · <a href="/tour">둘러보기</a> · <a href="${PLAY}">안드로이드 앱 받기</a></p>
<h2>이렇게 진행돼요</h2><ol>
<li>앱에서 부모님 정보와 원하는 날짜를 남겨요.</li>
<li>운영자가 전화로 상황을 여쭙고 강사와 일정을 맞춰요.</li>
<li>강사가 댁으로 찾아가 90분 1:1 수업을 해요.</li>
<li>수업이 끝나면 앱으로 사진과 결과가 와요.</li></ol>
${priceHtml}${areaHtml}${faqHtml}${footHtml}`,
});

// 2) 둘러보기
page({
  file: 'tour.html', url: '/tour',
  title: '키오런 - 부모님 디지털 1:1 방문 수업 | 가격과 진행 방식',
  desc: '강사가 부모님 댁으로 찾아가 휴대폰, 키오스크, 은행·병원 앱, AI 쓰는 법을 90분 1:1로 알려 드려요. 첫 체험 39,000원, 3회권 139,000원, 10회권 449,000원. 수업마다 사진과 결과를 앱으로 받아요.',
  ld: [ORG, APP, SERVICE, FAQ_LD],
  body: `<div class="brand">키오런</div>
<h1>부모님 곁에 사람을 보내고, 결과는 앱으로 받아요</h1>
<p>원하시는 날짜에 강사가 찾아가요. 결제하면 운영자가 강사와 첫 일정을 맞춰 알려 드려요. 첫 수업 전에는 언제든 전액 환불돼요.</p>
<table><tr><td>수업</td><td>90분 · 어르신 댁 1:1</td></tr>
<tr><td>강사</td><td>자격증·신분증 확인, 출강 필수 교육 이수</td></tr>
<tr><td>리포트</td><td>수업마다 사진과 결과</td></tr>
<tr><td>환불</td><td>첫 수업 전까지 전액</td></tr></table>
<h2>이런 걸 같이 해 봐요</h2><p>휴대폰 기본 설정, 카카오톡과 사진 보내기, 식당·카페 키오스크 주문, 은행 앱 이체, 병원 예약, AI에게 물어보기. 첫 수업에서 부모님이 어디서 막히시는지 보고 순서를 정해요.</p>
<h2>이렇게 진행돼요</h2><ol>
<li>앱에서 부모님 정보와 원하는 날짜를 남겨요.</li>
<li>운영자가 전화로 상황을 여쭙고 강사와 일정을 맞춰요.</li>
<li>강사가 댁으로 찾아가 90분 1:1 수업을 해요.</li>
<li>수업이 끝나면 앱으로 사진과 결과가 와요.</li></ol>
${priceHtml}${areaHtml}<p><a href="/login">전화번호로 시작하기</a></p>${faqHtml}${footHtml}`,
});

// 3) 로그인: 공유는 되지만 검색 결과에는 안 나오게
page({
  file: 'login.html', url: '/login', robots: 'noindex,follow',
  title: '키오런 시작하기',
  desc: '가족, 직접 배우는 분, 강사 중에 골라서 전화번호로 시작할 수 있어요. 비밀번호 없이 문자로 온 숫자 6자리만 넣으면 돼요.',
  body: `<div class="brand">키오런</div><h1>디지털, 혼자 하기 어려울 때</h1><p>90분 1:1 방문 수업. 앱이 열리면 어떤 분이신지 골라 주세요.</p><p><a href="/">키오런 소개</a></p>`,
});

// 4) 가족 초대 링크(/i/토큰): 카카오톡 미리보기용, 검색 제외
page({
  file: 'invite.html', robots: 'noindex,nofollow', og: '/og-invite.jpg',
  title: '키오런 가족 초대가 왔어요',
  desc: '링크를 눌러 들어오면 부모님 수업 일정과 사진, 결과를 가족이 함께 받아요.',
});

// 5) 강사 지원 경로(/connect/jobs): 미리보기만, 검색 제외
page({
  file: 'jobs.html', robots: 'noindex,follow', og: '/og-teach.jpg',
  title: '키오런 강사 - 동네 어르신께 디지털을 가르쳐요',
  desc: '내가 정한 요일에만, 가까운 어르신 댁으로 배정돼요. 출강 필수 교육과 서류 2종을 마치면 시작할 수 있어요.',
});

// 6) 나머지(로그인 뒤 화면): 검색 제외
page({
  file: 'app-shell.html', robots: 'noindex,nofollow',
  title: '키오런', desc: '키오런 앱',
});

// robots.txt · sitemap.xml
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *
Allow: /$
Allow: /tour
Allow: /og
Allow: /icon-
Disallow: /api/
Disallow: /i/
Disallow: /family
Disallow: /instructor
Disallow: /connect
Disallow: /courses
Disallow: /onboarding

Sitemap: ${SITE}/sitemap.xml
`);
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/tour</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>
`);
console.log('seo robots.txt, sitemap.xml');
