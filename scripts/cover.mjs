// 커버 디자인을 바꾸면 이 값을 올린다. 파일명 해시에 들어가서 모든 커버가 다시 만들어진다.
export const COVER_VERSION = 3;

// 분야별 색. [배경 시작, 배경 끝, 원 A, 원 B]
const categoryTones = {
    game: ['#1b64da', '#64a8ff', '#c9e2ff', '#194aa6'],
    simulation: ['#0f8c8c', '#3fd0c4', '#c6f5ee', '#0b6a72'],
    ai: ['#7a2bb0', '#c07be0', '#f0d6ff', '#5a1d8a'],
    web: ['#ea7a00', '#ffc342', '#fff0c4', '#c45a00'],
    code: ['#4e5968', '#8b95a1', '#e5e8eb', '#333d4b']
};

const fontFamily = "Pretendard, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'Segoe UI', sans-serif";

function escapeXml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}

// 저장소 이름에서 앱 아이콘에 들어갈 글자를 뽑는다. homework9는 H9, motion-lab은 ML이 된다.
function monogram(name) {
    const words = name.split(/[-_\s]+/).filter(Boolean);
    if (words.length > 1) return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();

    const number = name.match(/\d+$/)?.[0];
    return `${name[0].toUpperCase()}${number ? number.slice(0, 1) : ''}`;
}

export function renderCover(project) {
    const category = project.categories[0] || 'code';
    const [start, end, orbA, orbB] = categoryTones[category] || categoryTones.code;
    const letters = monogram(project.name);
    const fontSize = letters.length > 1 ? 196 : 240;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" role="img" aria-labelledby="title">
  <title id="title">${escapeXml(project.title)}</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${start}"/>
      <stop offset="1" stop-color="${end}"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.45"/>
    </linearGradient>
    <filter id="frost" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="46"/></filter>
    <clipPath id="pane"><rect x="290" y="290" width="500" height="500" rx="136"/></clipPath>
    <g id="orbs">
      <circle cx="350" cy="370" r="190" fill="${orbA}"/>
      <circle cx="760" cy="720" r="230" fill="${orbB}"/>
    </g>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <use href="#orbs"/>
  <g clip-path="url(#pane)">
    <rect width="1080" height="1080" fill="url(#bg)"/>
    <use href="#orbs" filter="url(#frost)"/>
    <rect x="290" y="290" width="500" height="500" fill="#ffffff" fill-opacity="0.2"/>
  </g>
  <rect x="290" y="290" width="500" height="500" rx="136" fill="none" stroke="url(#edge)" stroke-width="5"/>
  <text x="540" y="${540 + fontSize * 0.35}" fill="#ffffff" text-anchor="middle" font-family="${fontFamily}" font-size="${fontSize}" font-weight="800" letter-spacing="${-fontSize * 0.02}">${escapeXml(letters)}</text>
</svg>`;
}
