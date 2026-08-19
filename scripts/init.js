const root = document.documentElement;
const projectGrid = document.querySelector('#project-grid');
const syncStatus = document.querySelector('#sync-status');
const filterButtons = [...document.querySelectorAll('.highlight[data-filter]')];
const tabButtons = [...document.querySelectorAll('[role="tab"]')];
const postsPanel = document.querySelector('#posts-panel');
const aboutPanel = document.querySelector('#about-panel');
const projectDialog = document.querySelector('#project-dialog');
const dialogClose = document.querySelector('#dialog-close');
const likeButton = document.querySelector('#like-button');
const shareButton = document.querySelector('#share-button');

let projects = [];
let currentFilter = 'all';
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
    CMake: '#2f8d46'
};

root.classList.add('js-ready');
document.querySelector('#current-year').textContent = new Date().getFullYear();

function readFallbackProjects() {
    return [...projectGrid.querySelectorAll('.project-tile')].map((tile) => ({
        name: new URL(tile.href).pathname.split('/').filter(Boolean).at(-1),
        title: tile.querySelector('.tile-overlay strong')?.textContent || 'GitHub project',
        description: 'GitHub에서 프로젝트 설명과 소스 코드를 확인할 수 있습니다.',
        repositoryUrl: tile.href,
        demoUrl: null,
        previewUrl: tile.querySelector('img')?.src || '',
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

function createTile(project) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'project-tile';
    tile.dataset.categories = project.categories.join(' ');
    tile.setAttribute('aria-label', `${project.title} 프로젝트 상세 보기`);
    tile.style.setProperty('--tile-accent', languageColors[project.language] || '#d9d9d9');
    tile.classList.toggle('project-tile--cover', project.previewUrl.toLowerCase().endsWith('.svg'));

    const fallback = document.createElement('span');
    fallback.className = 'tile-fallback';
    fallback.textContent = initials(project.title);

    const image = document.createElement('img');
    image.src = project.previewUrl;
    image.alt = `${project.title} 프로젝트 미리보기`;
    image.width = 640;
    image.height = 640;
    image.loading = 'lazy';
    image.addEventListener('error', () => image.remove());

    const overlay = document.createElement('span');
    overlay.className = 'tile-overlay';

    const title = document.createElement('strong');
    title.textContent = project.title;

    const language = document.createElement('span');
    language.textContent = project.language || 'GitHub project';

    const stats = document.createElement('span');
    stats.className = 'tile-stats';
    stats.textContent = `★ ${project.stars}   ⑂ ${project.forks}`;

    overlay.append(title, language, stats);
    tile.append(fallback, image, overlay);
    tile.addEventListener('click', () => openProject(project));

    return tile;
}

function renderProjects() {
    const fragment = document.createDocumentFragment();
    projects.forEach((project) => fragment.append(createTile(project)));
    projectGrid.replaceChildren(fragment);
    applyFilter(currentFilter);
}

function formattedSyncText(visibleCount) {
    if (!generatedAt) {
        return `${visibleCount}개 프로젝트 · 정적 목록 표시 중`;
    }

    const synced = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(generatedAt));

    return `${visibleCount}개 프로젝트 · GitHub 자동 동기화 ${synced}`;
}

function applyFilter(filter) {
    currentFilter = filter;
    let visibleCount = 0;

    filterButtons.forEach((button) => {
        const selected = button.dataset.filter === filter;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });

    projectGrid.querySelectorAll('.project-tile').forEach((tile) => {
        const categories = tile.dataset.categories.split(' ');
        const visible = filter === 'all' || categories.includes(filter);
        tile.hidden = !visible;
        visibleCount += Number(visible);
    });

    syncStatus.lastChild.textContent = ` ${formattedSyncText(visibleCount)}`;
}

function activateTab(name, moveFocus = false) {
    const showPosts = name === 'posts';

    postsPanel.hidden = !showPosts;
    aboutPanel.hidden = showPosts;

    tabButtons.forEach((button) => {
        const selected = button.id === `${name}-tab`;
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
        if (selected && moveFocus) button.focus();
    });
}

function updateProfile(profile) {
    document.querySelector('#profile-avatar').src = profile.avatarUrl;
    document.querySelector('#profile-name').textContent = profile.name;
    document.querySelector('#repository-count').textContent = profile.publicRepositories;
    document.querySelector('#follower-count').textContent = profile.followers;
    document.querySelector('#post-count').textContent = projects.length;

    if (profile.company) document.querySelector('#profile-company').textContent = profile.company;
    if (profile.location) document.querySelector('#profile-location').textContent = profile.location;
}

function formatUpdatedAt(value) {
    if (!value) return '업데이트 날짜 정보 없음';

    return `${new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(value))} 업데이트`;
}

function openProject(project) {
    currentProject = project;
    const image = document.querySelector('#dialog-image');

    document.querySelector('#dialog-repository-name').textContent = project.name;
    document.querySelector('#dialog-description').textContent = project.description;
    document.querySelector('#dialog-updated').textContent = formatUpdatedAt(project.updatedAt);
    document.querySelector('#dialog-stats').textContent = `별 ${project.stars}개 · 포크 ${project.forks}개`;
    document.querySelector('#dialog-fallback').textContent = initials(project.title);

    image.hidden = false;
    image.src = project.previewUrl;
    image.alt = `${project.title} 프로젝트 미리보기`;
    image.onerror = () => { image.hidden = true; };

    const tags = [project.language, ...project.categories, ...project.topics]
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .slice(0, 7);
    const tagList = document.querySelector('#dialog-tags');
    tagList.replaceChildren(...tags.map((tag) => {
        const item = document.createElement('li');
        item.textContent = `#${String(tag).replaceAll(' ', '')}`;
        return item;
    }));

    const repositoryLink = document.querySelector('#dialog-repository');
    repositoryLink.href = project.repositoryUrl;

    const demoLink = document.querySelector('#dialog-demo');
    demoLink.hidden = !project.demoUrl;
    if (project.demoUrl) demoLink.href = project.demoUrl;

    likeButton.setAttribute('aria-pressed', 'false');
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

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        activateTab('posts');
        applyFilter(button.dataset.filter);
        document.querySelector('#posts').scrollIntoView({ behavior: 'smooth', block: 'start' });
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

document.querySelectorAll('[data-open-tab]').forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        activateTab(link.dataset.openTab);
        document.querySelector('#posts').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    likeButton.setAttribute('aria-label', liked ? '프로젝트 좋아요 취소' : '프로젝트 좋아요');
});

shareButton.addEventListener('click', async () => {
    if (!currentProject) return;
    const feedback = document.querySelector('#copy-feedback');

    try {
        await navigator.clipboard.writeText(currentProject.repositoryUrl);
        feedback.textContent = '저장소 링크를 복사했습니다.';
    } catch {
        feedback.textContent = '링크를 복사하지 못했습니다.';
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
        updateProfile(data.profile);
    } catch (error) {
        console.warn('Using the static project fallback.', error);
        applyFilter('all');
    }
}

applyFilter('all');
loadProjects();
