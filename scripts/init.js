const root = document.documentElement;
const projectGrid = document.querySelector('#project-grid');
const projectTable = document.querySelector('#project-table');
const syncStatus = document.querySelector('#sync-status');
const emptyState = document.querySelector('#empty-state');
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#wiki-search');
const filterButtons = [...document.querySelectorAll('.story[data-filter]')];
const categoryLinks = [...document.querySelectorAll('.categories a[data-filter]')];
const tabButtons = [...document.querySelectorAll('.view-tabs [role="tab"]')];
const gridPanel = document.querySelector('#grid-panel');
const tablePanel = document.querySelector('#table-panel');
const projectSection = document.querySelector('#s-2');
const projectDialog = document.querySelector('#project-dialog');
const dialogClose = document.querySelector('#dialog-close');
const likeButton = document.querySelector('#like-button');
const shareButton = document.querySelector('#share-button');

let projects = [];
let currentFilter = 'all';
let currentQuery = '';
let currentProject = null;
let generatedAt = null;

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

const categoryNames = {
    game: '게임',
    simulation: '시뮬레이션',
    ai: 'AI',
    web: '웹',
    code: '과제'
};

const pinIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3H8v2l1 1v5l-3 3v2h5v6l1 1 1-1v-6h5v-2l-3-3V6l1-1Z"></path></svg>';

root.classList.add('js-ready');
document.querySelector('#current-year').textContent = new Date().getFullYear();

function readFallbackProjects() {
    return [...projectGrid.querySelectorAll('.project-tile')].map((tile) => ({
        name: new URL(tile.href).pathname.split('/').filter(Boolean).at(-1),
        title: tile.querySelector('.tile-overlay strong')?.textContent || 'GitHub project',
        description: '자세한 내용은 저장소 README에 있다.',
        repositoryUrl: tile.href,
        demoUrl: null,
        previewUrl: tile.querySelector('img')?.getAttribute('src') || '',
        language: tile.querySelector('.tile-overlay > span')?.textContent || null,
        topics: [],
        categories: tile.dataset.categories?.split(' ') || ['code'],
        stars: 0,
        forks: 0,
        updatedAt: null,
        featured: true
    }));
}

projects = readFallbackProjects();

function initials(value) {
    return value
        .split(/[-_\s]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function shortTitle(project) {
    return project.title.split(/\s+(?:[—-]\s+|\()/)[0];
}

function pad(value) {
    return String(value).padStart(2, '0');
}

function wikiTimestamp(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const relativeFormat = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' });

function relativeTime(value) {
    if (!value) return '모름';

    const seconds = (new Date(value) - Date.now()) / 1000;
    const units = [
        ['year', 31536000],
        ['month', 2592000],
        ['week', 604800],
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60]
    ];

    for (const [unit, size] of units) {
        if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
    }
    return '방금';
}

// 과제 저장소는 '과제' 필터나 검색으로만 보인다.
function isCoursework(project) {
    return project.categories.length === 1 && project.categories[0] === 'code';
}

function matches(project) {
    if (currentFilter === 'all' && !currentQuery && isCoursework(project)) return false;
    const inCategory = currentFilter === 'all' || project.categories.includes(currentFilter);
    if (!inCategory) return false;
    if (!currentQuery) return true;

    const haystack = [project.title, project.name, project.description, project.language, ...project.categories.map((c) => categoryNames[c] || c)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return haystack.includes(currentQuery);
}

function createTile(project) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'project-tile';
    tile.dataset.name = project.name;
    tile.setAttribute('aria-label', `${project.title} 자세히 보기`);
    tile.style.setProperty('--tile-accent', languageColors[project.language] || '#7638fa');
    tile.classList.toggle('project-tile--cover', project.previewUrl.toLowerCase().endsWith('.svg'));

    const fallback = document.createElement('span');
    fallback.className = 'tile-fallback';
    fallback.textContent = initials(project.title);

    const image = document.createElement('img');
    image.src = project.previewUrl;
    image.alt = '';
    image.width = 640;
    image.height = 640;
    image.loading = 'lazy';
    image.addEventListener('error', () => image.remove());

    const overlay = document.createElement('span');
    overlay.className = 'tile-overlay';

    const title = document.createElement('strong');
    title.textContent = shortTitle(project);

    const meta = document.createElement('span');
    meta.textContent = `${project.language || 'Code'}  ★ ${project.stars}`;

    overlay.append(title, meta);
    tile.append(fallback, image, overlay);

    if (project.featured) {
        const pin = document.createElement('span');
        pin.className = 'tile-pin';
        pin.innerHTML = pinIcon;
        tile.append(pin);
    }

    tile.addEventListener('click', () => openProject(project));
    return tile;
}

function createRow(project) {
    const row = document.createElement('tr');
    row.dataset.name = project.name;

    const nameCell = document.createElement('td');
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'doc-link';
    link.textContent = shortTitle(project);
    link.addEventListener('click', () => openProject(project));
    const repoName = document.createElement('small');
    repoName.textContent = project.name;
    nameCell.append(link, repoName);

    const categoryCell = document.createElement('td');
    categoryCell.textContent = project.categories.map((c) => categoryNames[c] || c).join(', ');

    const languageCell = document.createElement('td');
    const dot = document.createElement('span');
    dot.className = 'lang-dot';
    dot.style.setProperty('--dot', languageColors[project.language] || 'var(--muted)');
    languageCell.append(dot, project.language || '없음');

    const updatedCell = document.createElement('td');
    updatedCell.className = 'muted';
    updatedCell.textContent = relativeTime(project.updatedAt);

    row.append(nameCell, categoryCell, languageCell, updatedCell);
    return row;
}

function renderProjects() {
    projectGrid.replaceChildren(...projects.map(createTile));
    projectTable.replaceChildren(...projects.map(createRow));
    applyFilter();
}

function renderRecent() {
    const recent = projects
        .filter((project) => project.updatedAt)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 6);
    if (!recent.length) return;

    document.querySelector('#recent-list').replaceChildren(...recent.map((project) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = shortTitle(project);
        button.addEventListener('click', () => openProject(project));
        const time = document.createElement('time');
        time.dateTime = project.updatedAt;
        time.textContent = relativeTime(project.updatedAt);
        item.append(button, time);
        return item;
    }));
}

function renderLanguages() {
    const counts = new Map();
    const counted = projects.filter((project) => !isCoursework(project));
    counted.forEach((project) => {
        const language = project.language || '기타';
        counts.set(language, (counts.get(language) || 0) + 1);
    });

    const total = counted.length;
    const sorted = [...counts].sort((a, b) => b[1] - a[1]);

    document.querySelector('#lang-bar').replaceChildren(...sorted.map(([language, count]) => {
        const segment = document.createElement('span');
        segment.style.setProperty('--dot', languageColors[language] || '#8a8a9a');
        segment.style.flex = String(count);
        segment.title = `${language} ${count}개`;
        return segment;
    }));

    document.querySelector('#lang-legend').replaceChildren(...sorted.map(([language, count]) => {
        const item = document.createElement('li');
        const dot = document.createElement('i');
        dot.className = 'lang-dot';
        dot.style.setProperty('--dot', languageColors[language] || '#8a8a9a');
        const share = document.createElement('span');
        share.textContent = ` ${Math.round((count / total) * 100)}%`;
        item.append(dot, language, share);
        return item;
    }));

    document.querySelector('#lang-stats').hidden = false;
}

function syncText(visibleCount) {
    if (!generatedAt) return `문서 ${visibleCount}개`;

    const synced = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date(generatedAt));
    return `문서 ${visibleCount}개 | ${synced} 동기화`;
}

function applyFilter() {
    filterButtons.forEach((button) => {
        const selected = button.dataset.filter === currentFilter;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });

    const visible = new Set(projects.filter(matches).map((project) => project.name));

    projectGrid.querySelectorAll('.project-tile').forEach((tile) => {
        const name = tile.dataset.name || new URL(tile.href).pathname.split('/').filter(Boolean).at(-1);
        tile.hidden = !visible.has(name);
    });
    projectTable.querySelectorAll('tr').forEach((row) => {
        row.hidden = !visible.has(row.dataset.name);
    });

    emptyState.hidden = visible.size > 0;
    if (!visible.size) {
        emptyState.replaceChildren(
            `'${searchInput.value.trim() || categoryNames[currentFilter]}' 문서가 없다. `,
            Object.assign(document.createElement('a'), {
                href: 'https://github.com/new',
                target: '_blank',
                rel: 'noopener noreferrer',
                textContent: '새로 만들기'
            })
        );
    }

    syncStatus.lastChild.textContent = ` ${syncText(visible.size)}`;
}

function showProjects() {
    projectSection.open = true;
    projectSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function activateTab(name, moveFocus = false) {
    gridPanel.hidden = name !== 'grid';
    tablePanel.hidden = name !== 'table';

    tabButtons.forEach((button) => {
        const selected = button.id === `${name}-tab`;
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
        if (selected && moveFocus) button.focus();
    });
}

function updateProfile(profile) {
    document.querySelector('#profile-avatar').src = profile.avatarUrl;
    document.querySelector('#repository-count').textContent = profile.publicRepositories;
    document.querySelector('#follower-count').textContent = profile.followers;
    document.querySelector('#post-count').textContent = projects.filter((project) => !isCoursework(project)).length;
}

function updateDocTime(value) {
    const time = document.querySelector('#doc-updated');
    time.dateTime = value;
    time.textContent = wikiTimestamp(value);
}

function openProject(project) {
    currentProject = project;
    const image = document.querySelector('#dialog-image');

    document.querySelector('#dialog-title').textContent = project.title;
    document.querySelector('#dialog-repository-name').textContent = project.name;
    document.querySelector('#dialog-description').textContent = project.description;
    document.querySelector('#dialog-language').textContent = project.language || '없음';
    document.querySelector('#dialog-stars').textContent = project.stars;
    document.querySelector('#dialog-forks').textContent = project.forks;
    document.querySelector('#dialog-fallback').textContent = initials(project.title);

    const updated = document.querySelector('#dialog-updated');
    updated.textContent = project.updatedAt ? wikiTimestamp(project.updatedAt) : '모름';
    updated.dateTime = project.updatedAt || '';

    image.hidden = false;
    image.src = project.previewUrl;
    image.alt = `${project.title} 미리보기`;
    image.onerror = () => { image.hidden = true; };

    document.querySelector('#dialog-categories').replaceChildren(...project.categories.map((category) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#s-2';
        link.textContent = categoryNames[category] || category;
        link.addEventListener('click', (event) => {
            event.preventDefault();
            closeProject();
            currentFilter = category;
            applyFilter();
            showProjects();
        });
        item.append(link);
        return item;
    }));

    const tags = [project.language, ...project.topics]
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .slice(0, 7);
    document.querySelector('#dialog-tags').replaceChildren(...tags.map((tag) => {
        const item = document.createElement('li');
        item.textContent = `#${String(tag).replaceAll(' ', '')}`;
        return item;
    }));

    document.querySelector('#dialog-repository').href = project.repositoryUrl;

    const demoLink = document.querySelector('#dialog-demo');
    demoLink.hidden = !project.demoUrl;
    if (project.demoUrl) demoLink.href = project.demoUrl;

    likeButton.setAttribute('aria-pressed', 'false');
    likeButton.setAttribute('aria-label', '좋아요');
    document.querySelector('#copy-feedback').textContent = '';

    if (typeof projectDialog.showModal === 'function') {
        document.body.classList.add('dialog-open');
        projectDialog.showModal();
    } else {
        window.open(project.repositoryUrl, '_blank', 'noopener,noreferrer');
    }
}

function closeProject() {
    if (projectDialog.open) projectDialog.close();
}

function attachFootnotes() {
    document.querySelectorAll('.fn').forEach((ref) => {
        const note = document.querySelector(`${ref.getAttribute('href')} span`);
        if (!note) return;
        const pop = document.createElement('span');
        pop.className = 'fn-pop';
        pop.setAttribute('role', 'tooltip');
        pop.textContent = note.textContent;
        ref.append(pop);
    });
}

[...filterButtons, ...categoryLinks].forEach((button) => {
    button.addEventListener('click', (event) => {
        event.preventDefault();
        currentFilter = button.dataset.filter;
        applyFilter();
        showProjects();
    });
});

tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => activateTab(button.id.replace('-tab', '')));
    button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const offset = event.key === 'ArrowRight' ? 1 : -1;
        const next = tabButtons[(index + offset + tabButtons.length) % tabButtons.length];
        activateTab(next.id.replace('-tab', ''), true);
    });
});

searchInput.addEventListener('input', () => {
    currentQuery = searchInput.value.trim().toLowerCase();
    applyFilter();
});

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    showProjects();
});

document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.target.closest('input, textarea') || projectDialog.open) return;
    event.preventDefault();
    searchInput.focus();
});

document.querySelectorAll('a[href^="#s-"]').forEach((link) => {
    link.addEventListener('click', () => {
        const section = document.querySelector(link.getAttribute('href'));
        if (section?.tagName === 'DETAILS') section.open = true;
    });
});

dialogClose.addEventListener('click', closeProject);
projectDialog.addEventListener('click', (event) => {
    if (event.target === projectDialog) closeProject();
});
projectDialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    currentProject = null;
});

likeButton.addEventListener('click', () => {
    const liked = likeButton.getAttribute('aria-pressed') !== 'true';
    likeButton.setAttribute('aria-pressed', String(liked));
    likeButton.setAttribute('aria-label', liked ? '좋아요 취소' : '좋아요');
});

shareButton.addEventListener('click', async () => {
    if (!currentProject) return;
    const feedback = document.querySelector('#copy-feedback');

    try {
        await navigator.clipboard.writeText(currentProject.repositoryUrl);
        feedback.textContent = '링크 복사됨';
    } catch {
        feedback.textContent = '복사 실패';
    }
});

async function loadProjects() {
    try {
        const response = await fetch('./data/projects.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Project data request failed: ${response.status}`);

        const data = await response.json();
        if (!Array.isArray(data.projects) || !data.profile) throw new Error('Project data has an invalid shape.');

        projects = data.projects;
        generatedAt = data.generatedAt;
        renderProjects();
        renderRecent();
        renderLanguages();
        updateProfile(data.profile);
        if (generatedAt) updateDocTime(generatedAt);
    } catch (error) {
        console.warn('Using the static project fallback.', error);
        applyFilter();
    }
}

attachFootnotes();
applyFilter();
loadProjects();
