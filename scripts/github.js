import { displayProjects, displayLanguageStats, displayRecentActivity, displaySkillLevels, generateProjectFilters } from './display.js';

const username = 'monitari'; // Replace with your GitHub username
const cacheKey = 'githubDataCache';
const cacheExpiryKey = 'githubDataCacheExpiry';
const cacheExpiryTime = 3600 * 1000; // 1 hour

export async function fetchGitHubData() {
    try {
        console.log('Fetching GitHub data...');
        const cachedData = getCachedData();
        if (cachedData) {
            console.log('Using cached data:', cachedData);
            useCachedData(cachedData);
        } else {
            const userData = await fetchUserData();
            const repos = await fetchRepos();
            const totalStars = calculateTotalStars(repos);
            const totalCommits = await fetchTotalCommits(repos);
            const preloadedProjects = await preloadProjects(repos);
            const recentActivity = await fetchRecentActivity();

            const data = {
                userData,
                totalStars,
                totalCommits,
                preloadedProjects,
                recentActivity: Array.isArray(recentActivity) ? recentActivity : []
            };

            console.log('Fetched data:', data);
            cacheData(data);
            useCachedData(data);
        }

        // Hide loading overlay and show main content
        document.getElementById('loading-overlay').style.display = 'none';
        document.querySelector('.layout-container').style.display = 'grid';
        
    } catch (error) {
        console.error('Error fetching GitHub data:', error);
        const cachedData = getCachedData();
        if (cachedData) {
            console.log('Using cached data due to error:', cachedData);
            useCachedData(cachedData);
        }
    }
}

function getCachedData() {
    const cachedData = localStorage.getItem(cacheKey);
    const cacheExpiry = localStorage.getItem(cacheExpiryKey);
    if (cachedData && cacheExpiry && new Date().getTime() < cacheExpiry) {
        return JSON.parse(cachedData);
    }
    return null;
}

function cacheData(data) {
    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(cacheExpiryKey, new Date().getTime() + cacheExpiryTime);
}

function useCachedData(data) {
    document.getElementById('profile-name').textContent = username;
    document.getElementById('profile-bio').textContent = data.userData.bio || '';
    document.getElementById('profile-company').textContent = data.userData.company || '';
    document.getElementById('profile-location').textContent = data.userData.location || '';
    document.getElementById('followers-count').textContent = data.userData.followers;
    document.getElementById('repo-count').textContent = data.userData.public_repos;
    document.getElementById('stars-count').textContent = data.totalStars;
    document.getElementById('commits-count').textContent = data.totalCommits;
    displayProjects(data.preloadedProjects);
    displayLanguageStats(data.preloadedProjects);
    displayRecentActivity(data.recentActivity || []);
    displaySkillLevels(data.preloadedProjects);
    generateProjectFilters(data.preloadedProjects);
}

async function fetchUserData() {
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    return await userResponse.json();
}

async function fetchRepos() {
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
    return await reposResponse.json();
}

function calculateTotalStars(repos) {
    return repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
}

async function fetchTotalCommits(repos) {
    let totalCommits = 0;
    for (const repo of repos) {
        try {
            const commitsResponse = await fetch(`https://api.github.com/repos/${username}/${repo.name}/commits?per_page=1`);
            if (commitsResponse.status === 409) {
                console.warn(`Skipping empty repository: ${repo.name}`);
                continue;
            }
            const commits = await commitsResponse.json();
            const commitCount = commitsResponse.headers.get('link') ? parseInt(commitsResponse.headers.get('link').match(/&page=(\d+)>; rel="last"/)[1]) : commits.length;
            totalCommits += commitCount;
        } catch (error) {
            console.error(`Error fetching commits for ${repo.name}:`, error);
        }
    }
    return totalCommits;
}

async function fetchReadmeImage(repoName) {
    try {
        const readmeResponse = await fetch(`https://raw.githubusercontent.com/${username}/${repoName}/main/README.md`);
        if (!readmeResponse.ok) return null; // README가 없으면 null 반환
        const readmeText = await readmeResponse.text();
        const imageUrlMatch = readmeText.match(/!\[.*?\]\((.*?)\)/);
        if (imageUrlMatch) {
            let imageUrl = imageUrlMatch[1];
            if (imageUrl.startsWith('/')) {
                imageUrl = `https://raw.githubusercontent.com/${username}/${repoName}/main${imageUrl}`;
            }
            return imageUrl;
        }
        return null; // 이미지 URL이 없으면 null 반환
    } catch (error) {
        console.warn(`README not found for ${repoName}`);
        return null; // 오류를 무시하고 null 반환
    }
}

async function fetchDeployments(repoName) {
    try {
        const deploymentsResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/deployments`);
        const deployments = await deploymentsResponse.json();
        const githubPagesDeployment = deployments.find(deployment => deployment.environment === 'github-pages');
        return githubPagesDeployment ? `https://${username}.github.io/${repoName}/` : null;
    } catch (error) {
        console.error(`Error fetching deployments for ${repoName}:`, error);
        return null;
    }
}

async function preloadProjects(repos) {
    const preloadedProjects = [];
    for (const repo of repos) {
        const imageUrl = await fetchReadmeImage(repo.name) || `https://github.com/${username}.png`; // 기본 이미지 URL로 대체
        const deploymentUrl = await fetchDeployments(repo.name);
        const languages = await fetchLanguages(repo.name);
        preloadedProjects.push({ ...repo, imageUrl, deploymentUrl, languages });
    }
    return preloadedProjects;
}

async function fetchLanguages(repoName) {
    try {
        const languagesResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/languages`);
        const languages = await languagesResponse.json();
        return Object.keys(languages);
    } catch (error) {
        console.error(`Error fetching languages for ${repoName}:`, error);
        return [];
    }
}

async function fetchRecentActivity() {
    try {
        const eventsResponse = await fetch(`https://api.github.com/users/${username}/events/public`);
        const events = await eventsResponse.json();
        console.log('Fetched recent activity:', events);
        return Array.isArray(events) ? events : [];
    } catch (error) {
        console.error('Error fetching activity:', error);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchGitHubData();
});
