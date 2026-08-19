import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const configPath = path.join(projectRoot, 'data', 'project-config.json');
const outputPath = path.join(projectRoot, 'data', 'projects.json');
const previewDirectory = path.join(projectRoot, 'assets', 'projects');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const apiToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

const apiHeaders = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'monitari-portfolio-sync',
    'X-GitHub-Api-Version': '2022-11-28'
};

if (apiToken) {
    apiHeaders.Authorization = `Bearer ${apiToken}`;
}

await mkdir(previewDirectory, { recursive: true });

async function fetchGitHub(pathname, accept = apiHeaders.Accept) {
    const response = await fetch(`https://api.github.com${pathname}`, {
        headers: { ...apiHeaders, Accept: accept },
        signal: AbortSignal.timeout(20_000)
    });

    if (!response.ok) {
        const remaining = response.headers.get('x-ratelimit-remaining');
        const reset = response.headers.get('x-ratelimit-reset');
        throw new Error(`GitHub API ${response.status}: ${response.statusText} (remaining: ${remaining}, reset: ${reset})`);
    }

    return response;
}

function inferCategories(repository) {
    const source = [
        repository.name,
        repository.description,
        repository.language,
        ...(repository.topics || [])
    ].filter(Boolean).join(' ').toLowerCase();
    const categories = new Set();

    if (/game|unity|unreal|yut|breakout|ghost|vampire|jelly/.test(source)) categories.add('game');
    if (/simulation|simulator|evolution|pandemic|world/.test(source)) categories.add('simulation');
    if (/\bai\b|machine-learning|machine learning|neural|gpt|llm/.test(source)) categories.add('ai');
    if (/web|javascript|typescript|html|css|react|vue|svelte|frontend/.test(source)) categories.add('web');
    if (categories.size === 0) categories.add('code');

    return [...categories];
}

function validUrl(value) {
    if (!value) return null;

    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
}

function safeSlug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
}

function escapeXml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}

function wrapTitle(value) {
    const normalized = value.replaceAll(/[-_]+/g, ' ').trim();
    const words = normalized.split(/\s+/);
    const lines = [];
    let line = '';

    for (const word of words) {
        if (!line) {
            line = word;
        } else if (`${line} ${word}`.length <= 15) {
            line = `${line} ${word}`;
        } else {
            lines.push(line);
            line = word;
        }
    }

    if (line) lines.push(line);
    if (lines.length === 1 && lines[0].length > 15) {
        const onlyLine = lines.shift();
        lines.push(onlyLine.slice(0, 15), onlyLine.slice(15, 30));
    }

    return lines.slice(0, 2);
}

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

async function createFallbackCover(project, filePath) {
    const accent = languageColors[project.language] || '#d9d9d9';
    const lines = wrapTitle(project.title);
    const titleMarkup = lines.map((line, index) => (
        `<text x="82" y="${470 + index * 106}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="700" letter-spacing="-2">${escapeXml(line)}</text>`
    )).join('');
    const category = project.categories[0] || 'code';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(project.title)} project cover</title>
  <desc id="desc">Automatically generated project cover for ${escapeXml(project.title)}</desc>
  <rect width="1080" height="1080" fill="#111111"/>
  <rect x="0" y="0" width="14" height="1080" fill="${accent}"/>
  <text x="82" y="105" fill="#a8a8a8" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600" letter-spacing="2">@MONITARI / ${escapeXml(category.toUpperCase())}</text>
  <circle cx="948" cy="94" r="14" fill="${accent}"/>
  ${titleMarkup}
  <line x1="82" y1="875" x2="998" y2="875" stroke="#363636" stroke-width="2"/>
  <text x="82" y="948" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">${escapeXml(project.language || 'GitHub project')}</text>
  <text x="998" y="948" fill="#737373" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="27">github.com/${escapeXml(config.owner)}</text>
</svg>`;

    await writeFile(filePath, svg, 'utf8');
}

function extractImageCandidates(markdown) {
    const candidates = [];
    const markdownPattern = /!\[[^\]]*\]\(<?([^)>\s]+)[^)]*\)/g;
    const htmlPattern = /<img[^>]+src=["']([^"']+)["']/gi;

    for (const match of markdown.matchAll(markdownPattern)) candidates.push(match[1]);
    for (const match of markdown.matchAll(htmlPattern)) candidates.push(match[1]);

    return candidates.filter((candidate) => {
        const lowered = candidate.toLowerCase();
        return !lowered.endsWith('.svg')
            && !/shields\.io|badge|github-readme-stats|profile-summary|visitor|komarev/.test(lowered);
    });
}

function resolveReadmeImage(candidate, repository) {
    try {
        if (candidate.startsWith('//')) return new URL(`https:${candidate}`).href;
        if (/^https?:\/\//i.test(candidate)) return new URL(candidate).href;

        const cleanPath = candidate.replace(/^\.\//, '').replace(/^\//, '');
        return new URL(cleanPath, `https://raw.githubusercontent.com/${repository.full_name}/${repository.default_branch}/`).href;
    } catch {
        return null;
    }
}

const imageExtensions = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp'
};

async function downloadReadmePreview(repository, baseFileName) {
    let response;

    try {
        response = await fetchGitHub(`/repos/${repository.full_name}/readme`, 'application/vnd.github.raw+json');
    } catch (error) {
        if (String(error).includes('404')) return null;
        console.warn(`README request failed for ${repository.name}: ${error.message}`);
        return null;
    }

    const markdown = await response.text();
    const candidates = extractImageCandidates(markdown);

    for (const candidate of candidates.slice(0, 6)) {
        const imageUrl = resolveReadmeImage(candidate, repository);
        if (!imageUrl) continue;

        try {
            const imageResponse = await fetch(imageUrl, {
                headers: { 'User-Agent': 'monitari-portfolio-sync' },
                redirect: 'follow',
                signal: AbortSignal.timeout(20_000)
            });
            const contentType = imageResponse.headers.get('content-type')?.split(';')[0];
            const extension = imageExtensions[contentType];
            if (!imageResponse.ok || !extension) continue;

            const bytes = new Uint8Array(await imageResponse.arrayBuffer());
            if (bytes.byteLength === 0 || bytes.byteLength > 6_000_000) continue;

            const fileName = `${baseFileName}.${extension}`;
            await writeFile(path.join(previewDirectory, fileName), bytes);
            return fileName;
        } catch (error) {
            console.warn(`Preview download skipped for ${repository.name}: ${error.message}`);
        }
    }

    return null;
}

async function preparePreview(repository, project, existingFiles) {
    const slug = safeSlug(repository.name);
    const signature = createHash('sha1').update(JSON.stringify({
        updatedAt: project.updatedAt,
        title: project.title,
        description: project.description,
        language: project.language,
        categories: project.categories
    })).digest('hex').slice(0, 10);
    const baseFileName = `${slug}-${signature}`;
    const existingFile = existingFiles.find((file) => file.startsWith(`${baseFileName}.`));

    if (existingFile) return `assets/projects/${existingFile}`;

    let fileName = await downloadReadmePreview(repository, baseFileName);
    if (!fileName) {
        fileName = `${baseFileName}.svg`;
        await createFallbackCover(project, path.join(previewDirectory, fileName));
    }

    const oldFiles = existingFiles.filter((file) => file.startsWith(`${slug}-`) && file !== fileName);
    await Promise.all(oldFiles.map((file) => unlink(path.join(previewDirectory, file))));

    return `assets/projects/${fileName}`;
}

const [profileResponse, repositoriesResponse] = await Promise.all([
    fetchGitHub(`/users/${config.owner}`),
    fetchGitHub(`/users/${config.owner}/repos?per_page=100&sort=pushed&direction=desc&type=owner`)
]);
const profile = await profileResponse.json();
const repositories = await repositoriesResponse.json();
const existingPreviewFiles = await readdir(previewDirectory);
const excluded = new Set(config.exclude || []);
const featured = config.featured || [];

const projectEntries = repositories
    .filter((repository) => !repository.fork && !repository.archived && !repository.disabled && repository.size > 0 && !excluded.has(repository.name))
    .map((repository) => {
        const override = config.overrides?.[repository.name] || {};
        const updatedAt = repository.pushed_at || repository.updated_at;
        const project = {
            name: repository.name,
            title: override.title || repository.name,
            description: override.description || repository.description || `${repository.language || 'Code'} project on GitHub`,
            repositoryUrl: repository.html_url,
            demoUrl: validUrl(override.demoUrl) || validUrl(repository.homepage),
            previewUrl: null,
            language: repository.language,
            topics: repository.topics || [],
            categories: override.categories || inferCategories(repository),
            stars: repository.stargazers_count,
            forks: repository.forks_count,
            updatedAt,
            featured: featured.includes(repository.name)
        };

        return { repository, project };
    });

for (const entry of projectEntries) {
    entry.project.previewUrl = await preparePreview(entry.repository, entry.project, existingPreviewFiles);
}

const projects = projectEntries
    .map((entry) => entry.project)
    .sort((left, right) => {
        const leftIndex = featured.indexOf(left.name);
        const rightIndex = featured.indexOf(right.name);

        if (leftIndex !== -1 || rightIndex !== -1) {
            if (leftIndex === -1) return 1;
            if (rightIndex === -1) return -1;
            return leftIndex - rightIndex;
        }

        return new Date(right.updatedAt) - new Date(left.updatedAt);
    });

const stableData = {
    profile: {
        login: profile.login,
        name: profile.name || profile.login,
        bio: profile.bio || '',
        avatarUrl: profile.avatar_url,
        profileUrl: profile.html_url,
        location: profile.location || '',
        company: profile.company || '',
        followers: profile.followers,
        following: profile.following,
        publicRepositories: profile.public_repos
    },
    projects
};

let previousStableData = null;

try {
    const previous = JSON.parse(await readFile(outputPath, 'utf8'));
    previousStableData = { profile: previous.profile, projects: previous.projects };
} catch {
    // The first sync creates the generated file.
}

if (JSON.stringify(previousStableData) === JSON.stringify(stableData)) {
    console.log(`No project changes detected for @${config.owner}.`);
    process.exit(0);
}

const output = {
    generatedAt: new Date().toISOString(),
    ...stableData
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Synced ${projects.length} projects and local previews for @${config.owner}.`);
