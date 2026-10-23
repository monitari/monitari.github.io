// 커버 디자인을 바꾸면 이 값을 올린다. 파일명 해시에 들어가서 모든 커버가 다시 만들어진다.
export const COVER_VERSION = 2;

const languageColors = {
    JavaScript: '#f7df1e',
    TypeScript: '#3178c6',
    Python: '#ffd343',
    HTML: '#e34f26',
    CSS: '#663399',
    'C#': '#9b4f96',
    C: '#a8b9cc',
    'C++': '#00599c',
    Java: '#e76f00',
    CMake: '#2f8d46',
    GDScript: '#478cbf'
};

// 사이트의 스토리 링 색과 같다.
const categoryTones = {
    game: ['#ff4f9a', '#ff9b52'],
    simulation: ['#12c2a4', '#3b74ff'],
    ai: ['#8b5cff', '#ff4fd8'],
    web: ['#ffb340', '#ff5a5f'],
    code: ['#5b6072', '#262935']
};

const fontFamily = "Pretendard, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'Segoe UI', sans-serif";
const monoFamily = "'JetBrains Mono', Consolas, 'SFMono-Regular', monospace";

function escapeXml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}

// 한글은 대략 1em, 라틴 문자는 0.6em으로 잡는다.
function textUnits(value) {
    let units = 0;
    for (const char of value) {
        if (/[ᄀ-ᇿ㄰-㆏가-힯一-鿿]/.test(char)) units += 1;
        else if (char === ' ') units += 0.3;
        else if (/[A-Z0-9]/.test(char)) units += 0.66;
        else units += 0.56;
    }
    return units;
}

function wrapLines(value, fontSize, maxWidth) {
    const words = value.replaceAll(/[-_]+/g, ' ').trim().split(/\s+/);
    const lines = [];
    let line = '';

    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (!line || textUnits(candidate) * fontSize <= maxWidth) {
            line = candidate;
        } else {
            lines.push(line);
            line = word;
        }
    }
    if (line) lines.push(line);
    return lines;
}

function fitTitle(value, maxWidth) {
    for (let fontSize = 104; fontSize >= 60; fontSize -= 4) {
        const lines = wrapLines(value, fontSize, maxWidth);
        if (lines.length <= 2 && lines.every((line) => textUnits(line) * fontSize <= maxWidth)) {
            return { fontSize, lines };
        }
    }

    const fontSize = 60;
    const maxUnits = maxWidth / fontSize;
    const lines = wrapLines(value, fontSize, maxWidth).slice(0, 2).map((line) => {
        let cut = line;
        while (textUnits(cut) > maxUnits && cut.length > 1) cut = cut.slice(0, -1);
        return cut === line ? line : `${cut.slice(0, -1)}…`;
    });
    return { fontSize, lines };
}

export function renderCover(project, owner) {
    const category = project.categories[0] || 'code';
    const [toneA, toneB] = categoryTones[category] || categoryTones.code;
    const accent = languageColors[project.language] || '#c8c8d8';
    const { fontSize, lines } = fitTitle(project.title, 800);
    const lineHeight = Math.round(fontSize * 1.12);
    const titleTop = 720 - (lines.length - 1) * lineHeight;
    const titleMarkup = lines.map((line, index) => (
        `<text x="140" y="${titleTop + index * lineHeight}" fill="#ffffff" font-family="${fontFamily}" font-size="${fontSize}" font-weight="800" letter-spacing="${-fontSize * 0.03}">${escapeXml(line)}</text>`
    )).join('\n  ');
    const label = category.toUpperCase();
    const labelWidth = Math.round(label.length * 17 + 52);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" role="img" aria-labelledby="title">
  <title id="title">${escapeXml(project.title)}</title>
  <defs>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.06"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.3"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="#0e0d16"/>
  <g filter="url(#soft)">
    <circle cx="260" cy="250" r="300" fill="${toneA}" opacity="0.9"/>
    <circle cx="860" cy="460" r="280" fill="${toneB}" opacity="0.85"/>
    <circle cx="420" cy="960" r="240" fill="${accent}" opacity="0.45"/>
  </g>
  <rect x="80" y="80" width="${labelWidth}" height="56" rx="28" fill="#ffffff" fill-opacity="0.14" stroke="#ffffff" stroke-opacity="0.3" stroke-width="2"/>
  <text x="${80 + labelWidth / 2}" y="117" fill="#ffffff" text-anchor="middle" font-family="${monoFamily}" font-size="26" font-weight="600" letter-spacing="3">${escapeXml(label)}</text>
  <text x="1000" y="117" fill="#ffffff" fill-opacity="0.75" text-anchor="end" font-family="${monoFamily}" font-size="26">@${escapeXml(owner)}</text>
  <rect x="80" y="${titleTop - fontSize - 70}" width="920" height="${1000 - (titleTop - fontSize - 70)}" rx="56" fill="url(#card)" stroke="url(#edge)" stroke-width="2.5"/>
  ${titleMarkup}
  <circle cx="152" cy="912" r="13" fill="${accent}"/>
  <text x="178" y="922" fill="#ffffff" fill-opacity="0.85" font-family="${fontFamily}" font-size="32" font-weight="700">${escapeXml(project.language || 'Code')}</text>
  <text x="940" y="922" fill="#ffffff" fill-opacity="0.5" text-anchor="end" font-family="${monoFamily}" font-size="24">github.com/${escapeXml(owner)}</text>
</svg>`;
}
