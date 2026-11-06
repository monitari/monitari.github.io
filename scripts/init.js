import { currentLocale, locales, setLocale, t } from './i18n.js';

const root = document.documentElement;
const projectGrid = document.querySelector('#project-grid');
const projectList = document.querySelector('#project-list');
const projectLede = document.querySelector('#project-lede');
const syncStatus = document.querySelector('#sync-status');
const emptyState = document.querySelector('#empty-state');
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#wiki-search');
const filterChips = document.querySelector('#filter-chips');
const chipButtons = [...filterChips.querySelectorAll('.chip')];
const categoryLinks = [...document.querySelectorAll('.categories a[data-filter]')];
const viewTabs = document.querySelector('#view-tabs');
const tabButtons = [...viewTabs.querySelectorAll('[role="tab"]')];
const gridPanel = document.querySelector('#grid-panel');
const listPanel = document.querySelector('#list-panel');
const projectSection = document.querySelector('#s-2');
const projectSheet = document.querySelector('#project-sheet');
const sortSheet = document.querySelector('#sort-sheet');
const localeSheet = document.querySelector('#locale-sheet');
const sortButton = document.querySelector('#sort-button');
const sortOptions = document.querySelector('#sort-options');
const localeOptions = document.querySelector('#locale-options');
const shareButton = document.querySelector('#share-button');
const toast = document.querySelector('#toast');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)');

let projects = [];
let profile = null;
let generatedAt = null;
let currentProject = null;
let currentFilter = 'all';
let currentQuery = '';
let currentSort = 'updated-desc';
let currentView = 'grid';
let shuffleOrder = new Map();
let items = new Map();
let toastTimer = null;

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

const categoryKeys = {
    game: 'categoryGame',
    simulation: 'categorySimulation',
    ai: 'categoryAi',
    web: 'categoryWeb',
    code: 'categoryCode'
};

const categoryOrder = Object.keys(categoryKeys);

const checkIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg>';
const arrowIcon = '<svg class="list-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"></path></svg>';

root.classList.add('js-ready');
document.querySelector('#current-year').textContent = new Date().getFullYear();

/* 데이터 읽기 */

function title(project) {
    return project.translations?.[currentLocale()]?.title || project.title;
}

function description(project) {
    return project.translations?.[currentLocale()]?.description || project.description;
}

function shortTitle(project) {
    return title(project).split(/\s+\(/)[0];
}

function categoryName(category) {
    return categoryKeys[category] ? t(categoryKeys[category]) : category;
}

function isCoursework(project) {
    return project.categories.length === 1 && project.categories[0] === 'code';
}

function monogram(name) {
    const words = name.split(/[-_\s]+/).filter(Boolean);
    if (words.length > 1) return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
    return name[0].toUpperCase();
}

function pad(value) {
    return String(value).padStart(2, '0');
}

function wikiTimestamp(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function wikiDate(value) {
    return wikiTimestamp(value).slice(0, 10);
}

function relativeTime(value) {
    if (!value) return t('unknown');

    const format = new Intl.RelativeTimeFormat(currentLocale(), { numeric: 'auto' });
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
        if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
    }
    return t('justNow');
}

function formatSize(kilobytes) {
    if (kilobytes == null) return t('unknown');

    const inMegabytes = kilobytes >= 1024;
    return new Intl.NumberFormat(currentLocale(), {
        style: 'unit',
        unit: inMegabytes ? 'megabyte' : 'kilobyte',
        maximumFractionDigits: inMegabytes ? 1 : 0
    }).format(inMegabytes ? kilobytes / 1024 : kilobytes);
}

/* 정렬 */

function byDate(field, direction) {
    return (a, b) => {
        // 날짜를 모르는 프로젝트는 방향과 상관없이 맨 뒤로 보낸다.
        if (!a[field] || !b[field]) return Boolean(b[field]) - Boolean(a[field]);
        return direction * (new Date(a[field]) - new Date(b[field]));
    };
}

function byNumber(field, direction) {
    return (a, b) => direction * ((a[field] ?? 0) - (b[field] ?? 0));
}

function byText(read, direction = 1) {
    return (a, b) => direction * read(a).localeCompare(read(b), currentLocale(), { sensitivity: 'base', numeric: true });
}

const newestFirst = byDate('updatedAt', -1);

const sorters = {
    'updated-desc': { group: 'sortGroupDate', compare: newestFirst },
    'updated-asc': { group: 'sortGroupDate', compare: byDate('updatedAt', 1) },
    'created-desc': { group: 'sortGroupDate', compare: byDate('createdAt', -1), value: (p) => t('createdAgo', { time: relativeTime(p.createdAt) }) },
    'created-asc': { group: 'sortGroupDate', compare: byDate('createdAt', 1), value: (p) => t('createdAgo', { time: relativeTime(p.createdAt) }) },
    'name-asc': { group: 'sortGroupName', compare: byText(shortTitle) },
    'name-desc': { group: 'sortGroupName', compare: byText(shortTitle, -1) },
    'stars-desc': { group: 'sortGroupReaction', compare: byNumber('stars', -1), value: (p) => t('starCount', { n: p.stars }) },
    'forks-desc': { group: 'sortGroupReaction', compare: byNumber('forks', -1), value: (p) => t('forkCount', { n: p.forks }) },
    'size-desc': { group: 'sortGroupSize', compare: byNumber('size', -1), value: (p) => formatSize(p.size) },
    'size-asc': { group: 'sortGroupSize', compare: byNumber('size', 1), value: (p) => formatSize(p.size) },
    language: { group: 'sortGroupOther', compare: byText((p) => p.language || '￿') },
    category: { group: 'sortGroupOther', compare: (a, b) => categoryOrder.indexOf(a.categories[0]) - categoryOrder.indexOf(b.categories[0]) },
    demo: { group: 'sortGroupOther', compare: (a, b) => Boolean(b.demoUrl) - Boolean(a.demoUrl) },
    featured: { group: 'sortGroupOther', compare: (a, b) => Boolean(b.featured) - Boolean(a.featured) },
    shuffle: { group: 'sortGroupOther', compare: (a, b) => shuffleOrder.get(a.name) - shuffleOrder.get(b.name) }
};

function sortedProjects() {
    const { compare } = sorters[currentSort];
    // 값이 같으면 최신순으로 푼다. 별이나 포크처럼 0이 많은 기준에서도 순서가 흔들리지 않는다.
    return [...projects].sort((a, b) => compare(a, b) || newestFirst(a, b));
}

function matches(project, filter = currentFilter) {
    if (filter === 'all' && !currentQuery && isCoursework(project)) return false;
    if (filter !== 'all' && !project.categories.includes(filter)) return false;
    if (!currentQuery) return true;

    const haystack = [
        title(project),
        project.title,
        project.name,
        description(project),
        project.language,
        ...project.topics,
        ...project.categories.map(categoryName)
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(currentQuery);
}

/* 움직임 */

function positionGlider(track) {
    const glider = track.querySelector('.glider');
    const active = track.querySelector('[aria-pressed="true"], [aria-selected="true"]');
    if (!glider || !active || !active.offsetWidth) return;

    glider.style.setProperty('--glider-width', `${active.offsetWidth}px`);
    glider.style.setProperty('--glider-height', `${active.offsetHeight}px`);
    glider.style.setProperty('--glider-x', `${active.offsetLeft}px`);
    glider.style.setProperty('--glider-y', `${active.offsetTop}px`);
    requestAnimationFrame(() => track.classList.add('is-ready'));
}

function moveGlider(track) {
    positionGlider(track);
    if (reducedMotion.matches) return;

    // 움직이는 동안 물방울처럼 살짝 늘어난다.
    track.querySelector('.glider').animate(
        { scale: ['1 1', '1.08 0.9', '1 1'] },
        { duration: 420, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
    );
}

function animateNumber(element, to) {
    const from = Number(element.dataset.value ?? 0);
    element.dataset.value = to;

    if (reducedMotion.matches || from === to) {
        element.textContent = to;
        return;
    }

    const start = performance.now();
    const duration = 700;

    function step(now) {
        // 숫자가 그사이 다른 값으로 바뀌었으면 이 애니메이션은 멈춘다.
        if (Number(element.dataset.value) !== to) return;
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - (1 - progress) ** 4;
        element.textContent = Math.round(from + (to - from) * eased);
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

// 순서가 바뀐 카드가 새 자리로 미끄러져 가게 한다.
function withFlip(container, change) {
    if (reducedMotion.matches || !container.offsetParent) {
        change();
        return;
    }

    const before = new Map();
    [...container.children].forEach((element) => {
        if (!element.hidden) before.set(element, element.getBoundingClientRect());
    });

    change();

    [...container.children].forEach((element) => {
        if (element.hidden) return;

        const previous = before.get(element);
        if (!previous) {
            element.classList.remove('is-entering');
            element.animate(
                [{ opacity: 0, transform: 'scale(0.94)' }, { opacity: 1, transform: 'none' }],
                { duration: 360, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
            );
            return;
        }

        const current = element.getBoundingClientRect();
        const dx = previous.left - current.left;
        const dy = previous.top - current.top;
        if (!dx && !dy) return;

        element.animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
            { duration: 520, easing: 'cubic-bezier(0.3, 1.2, 0.5, 1)' }
        );
    });
}

function setupGlassMotion() {
    if (reducedMotion.matches || !fineHover.matches) return;

    let frame = null;
    let event = null;

    document.addEventListener('pointermove', (pointer) => {
        event = pointer;
        if (frame) return;

        frame = requestAnimationFrame(() => {
            frame = null;
            root.style.setProperty('--px', (event.clientX / window.innerWidth - 0.5).toFixed(3));
            root.style.setProperty('--py', (event.clientY / window.innerHeight - 0.5).toFixed(3));

            const glass = event.target.closest?.('.glass');
            if (!glass) return;
            const rect = glass.getBoundingClientRect();
            glass.style.setProperty('--mx', `${event.clientX - rect.left}px`);
            glass.style.setProperty('--my', `${event.clientY - rect.top}px`);
        });
    }, { passive: true });
}

function setupReveal() {
    const elements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -6% 0px' });

    elements.forEach((element) => observer.observe(element));
}

/* 프로젝트 그리기 */

function createMedia(project) {
    const media = document.createDocumentFragment();

    const fallback = document.createElement('span');
    fallback.className = 'monogram';
    fallback.style.background = `linear-gradient(135deg, ${languageColors[project.language] || '#1b64da'}, #191f28)`;
    fallback.textContent = monogram(project.name);

    const image = document.createElement('img');
    image.src = project.previewUrl;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => image.remove());

    media.append(fallback, image);
    return media;
}

function createLanguage(project) {
    const language = document.createElement('span');
    language.className = 'card-language';

    const dot = document.createElement('i');
    dot.className = 'lang-dot';
    dot.style.setProperty('--dot', languageColors[project.language] || 'var(--muted)');

    language.append(dot, project.language || t('none'));
    return language;
}

function createCard(project, index) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'project-card is-entering';
    card.style.setProperty('--i', Math.min(index, 12));
    card.setAttribute('aria-label', t('openProject', { title: title(project) }));
    card.addEventListener('click', () => openProject(project));

    const media = document.createElement('span');
    media.className = 'card-media';
    media.append(createMedia(project));

    const badges = document.createElement('span');
    badges.className = 'card-badges';
    if (project.featured) {
        const featured = document.createElement('span');
        featured.className = 'badge badge--featured';
        featured.textContent = t('featured');
        badges.append(featured);
    }
    if (project.demoUrl) {
        const demo = document.createElement('span');
        demo.className = 'badge';
        demo.textContent = t('demo');
        badges.append(demo);
    }
    media.append(badges);

    const body = document.createElement('span');
    body.className = 'card-body';

    const name = document.createElement('strong');
    name.textContent = shortTitle(project);

    const text = document.createElement('span');
    text.className = 'card-desc';
    text.textContent = description(project);

    const meta = document.createElement('span');
    meta.className = 'card-meta';

    const value = document.createElement('span');
    value.className = 'card-value';

    meta.append(createLanguage(project), value);
    body.append(name, text, meta);
    card.append(media, body);

    return { element: card, value };
}

function createRow(project) {
    const item = document.createElement('li');

    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'list-row';
    row.setAttribute('aria-label', t('openProject', { title: title(project) }));
    row.addEventListener('click', () => openProject(project));

    const thumb = document.createElement('span');
    thumb.className = 'list-thumb';
    thumb.append(createMedia(project));

    const text = document.createElement('span');
    text.className = 'list-text';
    const name = document.createElement('strong');
    name.textContent = shortTitle(project);
    const summary = document.createElement('span');
    summary.textContent = description(project);
    text.append(name, summary);

    const value = document.createElement('span');
    value.className = 'list-value';

    row.append(thumb, text, value);
    row.insertAdjacentHTML('beforeend', arrowIcon);
    item.append(row);

    return { element: item, value };
}

function renderProjects() {
    items = new Map();
    sortedProjects().forEach((project, index) => {
        items.set(project.name, { card: createCard(project, index), row: createRow(project) });
    });

    projectGrid.replaceChildren(...[...items.values()].map(({ card }) => card.element));
    projectList.replaceChildren(...[...items.values()].map(({ row }) => row.element));
    arrange();
}

function arrange() {
    const ordered = sortedProjects();
    const readValue = sorters[currentSort].value || ((project) => relativeTime(project.updatedAt));

    ordered.forEach((project) => {
        const item = items.get(project.name);
        if (!item) return;

        const visible = matches(project);
        const value = readValue(project);
        item.card.value.textContent = value;
        item.row.value.textContent = value;
        item.card.element.hidden = !visible;
        item.row.element.hidden = !visible;
        projectGrid.append(item.card.element);
        projectList.append(item.row.element);
    });
}

function updateChipCounts() {
    chipButtons.forEach((chip) => {
        chip.querySelector('i').textContent = projects.filter((project) => matches(project, chip.dataset.filter)).length;
    });
}

function renderLede(count) {
    const key = currentQuery ? 'ledeSearch' : { all: 'ledeAll', code: 'ledeCode' }[currentFilter] || 'ledeCategory';
    const sentence = t(key, {
        n: '\u0000',
        count,
        category: categoryName(currentFilter),
        query: searchInput.value.trim()
    });
    const [before, after = ''] = sentence.split('\u0000');

    let number = projectLede.querySelector('strong');
    if (!number) {
        number = document.createElement('strong');
        number.textContent = '0';
    }

    projectLede.replaceChildren(before, number, after);
    animateNumber(number, count);
}

function renderSyncStatus() {
    if (!generatedAt) {
        syncStatus.textContent = '';
        return;
    }

    const date = new Intl.DateTimeFormat(currentLocale(), { month: 'long', day: 'numeric' }).format(new Date(generatedAt));
    syncStatus.textContent = t('synced', { date });
}

function renderRecent() {
    const recent = [...projects]
        .filter((project) => project.updatedAt)
        .sort(newestFirst)
        .slice(0, 6);

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
        const language = project.language || t('other');
        counts.set(language, (counts.get(language) || 0) + 1);
    });

    const sorted = [...counts].sort((a, b) => b[1] - a[1]);

    document.querySelector('#lang-bar').replaceChildren(...sorted.map(([language, count]) => {
        const segment = document.createElement('span');
        segment.style.setProperty('--dot', languageColors[language] || '#8b95a1');
        segment.style.flex = String(count);
        segment.title = `${language} ${count}`;
        return segment;
    }));

    document.querySelector('#lang-legend').replaceChildren(...sorted.map(([language, count]) => {
        const item = document.createElement('li');
        const dot = document.createElement('i');
        dot.className = 'lang-dot';
        dot.style.setProperty('--dot', languageColors[language] || '#8b95a1');
        const share = document.createElement('span');
        share.textContent = `${Math.round((count / counted.length) * 100)}%`;
        item.append(dot, language, share);
        return item;
    }));

    document.querySelector('#lang-stats').hidden = false;
}

function renderProfile() {
    if (!profile) return;
    document.querySelector('#profile-avatar').src = profile.avatarUrl;
    animateNumber(document.querySelector('#repository-count'), profile.publicRepositories);
    animateNumber(document.querySelector('#follower-count'), profile.followers);
    animateNumber(document.querySelector('#post-count'), projects.filter((project) => !isCoursework(project)).length);
}

function renderDocTime() {
    if (!generatedAt) return;
    const time = document.querySelector('#doc-updated');
    time.dateTime = generatedAt;
    time.textContent = wikiTimestamp(generatedAt);
}

/* 보기 상태 바꾸기 */

function activePanelContainer() {
    return currentView === 'grid' ? projectGrid : projectList;
}

function refresh() {
    chipButtons.forEach((chip) => {
        chip.setAttribute('aria-pressed', String(chip.dataset.filter === currentFilter));
    });

    withFlip(activePanelContainer(), arrange);

    const visibleCount = projects.filter((project) => matches(project)).length;
    updateChipCounts();
    renderLede(visibleCount);
    renderSortLabel();
    renderSortOptions();
    renderSyncStatus();

    emptyState.hidden = visibleCount > 0;
    document.querySelector('#empty-title').textContent = t('emptyTitle');
    document.querySelector('#empty-action').textContent = t('emptyAction');

    positionGlider(filterChips);
}

function setFilter(filter) {
    currentFilter = filter;
    refresh();
    moveGlider(filterChips);

    // scrollIntoView는 페이지까지 움직이니 칩 줄만 가로로 민다.
    const active = filterChips.querySelector('[aria-pressed="true"]');
    filterChips.scrollTo({
        left: active.offsetLeft - (filterChips.clientWidth - active.offsetWidth) / 2,
        behavior: reducedMotion.matches ? 'auto' : 'smooth'
    });
}

function setSort(sort) {
    if (sort === 'shuffle') {
        shuffleOrder = new Map(projects.map((project) => [project.name, Math.random()]));
    }
    currentSort = sort;
    refresh();
}

function showProjects() {
    projectSection.open = true;
    projectSection.classList.add('is-in');
    projectSection.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
}

function activateTab(name, moveFocus = false) {
    currentView = name;
    gridPanel.hidden = name !== 'grid';
    listPanel.hidden = name !== 'list';

    tabButtons.forEach((button) => {
        const selected = button.id === `${name}-tab`;
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
        if (selected && moveFocus) button.focus();
    });

    moveGlider(viewTabs);
}

/* 시트 */

function openSheet(sheet) {
    if (typeof sheet.showModal !== 'function') return false;
    sheet.classList.remove('is-closing');
    sheet.style.removeProperty('--drag');
    document.body.classList.add('sheet-open');
    sheet.showModal();
    return true;
}

function closeSheet(sheet) {
    if (!sheet.open || sheet.classList.contains('is-closing')) return;

    sheet.classList.add('is-closing');
    window.setTimeout(() => {
        sheet.classList.remove('is-closing');
        sheet.close();
    }, reducedMotion.matches ? 0 : 230);
}

function setupSheet(sheet) {
    sheet.addEventListener('click', (event) => {
        if (event.target === sheet) closeSheet(sheet);
    });
    sheet.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeSheet(sheet);
    });
    sheet.addEventListener('close', () => {
        sheet.style.removeProperty('--drag');
        sheet.style.removeProperty('transition');
        document.body.classList.remove('sheet-open');
        if (sheet === projectSheet) currentProject = null;
    });
    sheet.querySelector('.sheet-close')?.addEventListener('click', () => closeSheet(sheet));

    // 모바일에서 손잡이를 끌어 내리면 닫는다.
    const handle = sheet.querySelector('.sheet-handle');
    let startY = null;

    handle.addEventListener('pointerdown', (event) => {
        startY = event.clientY;
        handle.setPointerCapture(event.pointerId);
        sheet.style.transition = 'none';
    });
    handle.addEventListener('pointermove', (event) => {
        if (startY === null) return;
        sheet.style.setProperty('--drag', `${Math.max(event.clientY - startY, 0)}px`);
    });

    function endDrag(event) {
        if (startY === null) return;
        const distance = event.clientY - startY;
        startY = null;
        sheet.style.transition = 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)';
        if (distance > 90) {
            closeSheet(sheet);
        } else {
            sheet.style.removeProperty('--drag');
        }
    }

    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
}

function createOption({ label, checked, onSelect }) {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'sheet-option';
    option.setAttribute('role', 'radio');
    option.setAttribute('aria-checked', String(checked));
    option.append(label);
    option.insertAdjacentHTML('beforeend', checkIcon);
    option.addEventListener('click', onSelect);
    return option;
}

function renderSortLabel() {
    const label = t(`sort.${currentSort}`);
    document.querySelector('#sort-current').textContent = label;
    sortButton.setAttribute('aria-label', t('sortLabel', { sort: label }));
}

function renderSortOptions() {
    const fragment = document.createDocumentFragment();
    let group = null;

    Object.entries(sorters).forEach(([key, sorter]) => {
        if (sorter.group !== group) {
            group = sorter.group;
            const header = document.createElement('p');
            header.className = 'sheet-group';
            header.textContent = t(group);
            fragment.append(header);
        }

        fragment.append(createOption({
            label: t(`sort.${key}`),
            checked: key === currentSort,
            onSelect: () => {
                closeSheet(sortSheet);
                setSort(key);
            }
        }));
    });

    sortOptions.replaceChildren(fragment);
}

function renderLocaleOptions() {
    localeOptions.replaceChildren(...Object.entries(locales).map(([key, label]) => createOption({
        label,
        checked: key === currentLocale(),
        onSelect: () => {
            closeSheet(localeSheet);
            setLocale(key);
        }
    })));
}

function showToast(message) {
    toast.textContent = message;
    window.clearTimeout(toastTimer);

    try {
        // 열린 시트 위에 뜨도록 다시 열어서 맨 위로 올린다.
        if (toast.matches(':popover-open')) toast.hidePopover();
        toast.showPopover();
        toastTimer = window.setTimeout(() => toast.hidePopover(), 2400);
    } catch {
        window.alert(message);
    }
}

/* 프로젝트 상세 */

function fillProjectSheet(project) {
    const image = document.querySelector('#project-image');
    const blur = document.querySelector('#project-image-blur');

    document.querySelector('#project-title').textContent = title(project);
    document.querySelector('#project-description').textContent = description(project);
    document.querySelector('#project-language').textContent = project.language || t('none');
    document.querySelector('#project-created').textContent = project.createdAt ? wikiDate(project.createdAt) : t('unknown');
    document.querySelector('#project-size').textContent = formatSize(project.size);
    document.querySelector('#project-stars').textContent = project.stars;
    document.querySelector('#project-forks').textContent = project.forks;
    document.querySelector('#project-fallback').textContent = monogram(project.name);

    const updated = document.querySelector('#project-updated');
    updated.textContent = project.updatedAt ? wikiTimestamp(project.updatedAt) : t('unknown');
    updated.dateTime = project.updatedAt || '';

    image.hidden = false;
    blur.hidden = false;
    image.src = project.previewUrl;
    blur.src = project.previewUrl;
    image.alt = t('preview', { title: title(project) });
    image.onerror = () => {
        image.hidden = true;
        blur.hidden = true;
    };

    document.querySelector('#project-categories').replaceChildren(...project.categories.map((category) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#s-2';
        link.textContent = categoryName(category);
        link.addEventListener('click', (event) => {
            event.preventDefault();
            closeSheet(projectSheet);
            setFilter(category);
            showProjects();
        });
        item.append(link);
        return item;
    }));

    document.querySelector('#project-tags').replaceChildren(...project.topics.slice(0, 7).map((topic) => {
        const item = document.createElement('li');
        item.textContent = topic;
        return item;
    }));

    document.querySelector('#project-repository').href = project.repositoryUrl;

    const demoLink = document.querySelector('#project-demo');
    demoLink.hidden = !project.demoUrl;
    if (project.demoUrl) demoLink.href = project.demoUrl;

    // 주요 행동이 하나면 저장소 버튼이 그 자리를 채운다.
    const repositoryLink = document.querySelector('#project-repository');
    repositoryLink.classList.toggle('button--fill', !project.demoUrl);
    repositoryLink.classList.toggle('button--weak', Boolean(project.demoUrl));
}

function openProject(project) {
    currentProject = project;
    fillProjectSheet(project);
    projectSheet.querySelector('.sheet-scroll').scrollTop = 0;

    if (!openSheet(projectSheet)) {
        window.open(project.repositoryUrl, '_blank', 'noopener,noreferrer');
    }
}

function attachFootnotes() {
    document.querySelectorAll('.fn').forEach((reference) => {
        const note = document.querySelector(`${reference.getAttribute('href')} span`);
        if (!note) return;
        const pop = document.createElement('span');
        pop.className = 'fn-pop';
        pop.setAttribute('aria-hidden', 'true');
        pop.textContent = note.textContent;
        reference.append(pop);
    });
}

/* 이벤트 */

chipButtons.forEach((chip) => {
    chip.addEventListener('click', () => setFilter(chip.dataset.filter));
});

categoryLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        setFilter(link.dataset.filter);
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

sortButton.addEventListener('click', () => {
    renderSortOptions();
    openSheet(sortSheet);
});

document.querySelector('#locale-button').addEventListener('click', () => {
    renderLocaleOptions();
    openSheet(localeSheet);
});

document.querySelector('#empty-action').addEventListener('click', () => {
    searchInput.value = '';
    currentQuery = '';
    setFilter('all');
});

searchInput.addEventListener('input', () => {
    currentQuery = searchInput.value.trim().toLowerCase();
    refresh();
});

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    searchInput.blur();
    showProjects();
});

document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.target.closest('input, textarea') || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    searchInput.focus();
});

document.querySelectorAll('a[href^="#s-"]:not([data-filter])').forEach((link) => {
    link.addEventListener('click', () => {
        const section = document.querySelector(link.getAttribute('href'));
        if (section?.tagName === 'DETAILS') section.open = true;
    });
});

shareButton.addEventListener('click', async () => {
    if (!currentProject) return;

    try {
        await navigator.clipboard.writeText(currentProject.repositoryUrl);
        showToast(t('copied'));
    } catch {
        showToast(t('copyFailed'));
    }
});

document.addEventListener('localechange', () => {
    attachFootnotes();
    renderProjects();
    renderRecent();
    renderLanguages();
    refresh();
    positionGlider(viewTabs);
});

[filterChips, viewTabs].forEach((track) => {
    new ResizeObserver(() => positionGlider(track)).observe(track);
});

document.fonts?.ready.then(() => {
    positionGlider(filterChips);
    positionGlider(viewTabs);
});

[projectSheet, sortSheet, localeSheet].forEach(setupSheet);

/* 시작 */

async function loadProjects() {
    try {
        const response = await fetch('./data/projects.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Project data request failed: ${response.status}`);

        const data = await response.json();
        if (!Array.isArray(data.projects) || !data.profile) throw new Error('Project data has an invalid shape.');

        projects = data.projects;
        profile = data.profile;
        generatedAt = data.generatedAt;
        renderProjects();
        renderRecent();
        renderLanguages();
        renderProfile();
        renderDocTime();
        refresh();
    } catch (error) {
        // 정적 카드 6개가 HTML에 남아 있어서 저장소로 가는 링크는 계속 작동한다.
        console.warn('Using the static project fallback.', error);
        document.querySelector('.project-bar').hidden = true;
        document.querySelector('.project-head').hidden = true;
    }
}

attachFootnotes();
renderSortLabel();
projectLede.textContent = t('loading');
setupReveal();
setupGlassMotion();
loadProjects();
