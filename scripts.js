document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    
    themeToggle.addEventListener('change', () => {
        document.body.dataset.theme = themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        themeToggle.checked = savedTheme === 'dark';
        document.body.dataset.theme = savedTheme;
    }

    // GitHub API Integration
    const username = 'monitari'; // Replace with your GitHub username

    const cacheKey = 'githubDataCache';
    const cacheExpiryKey = 'githubDataCacheExpiry';
    const cacheExpiryTime = 3600 * 1000; // 1 hour

    async function fetchGitHubData() {
        try {
            const cachedData = getCachedData();
            if (cachedData) {
                useCachedData(cachedData);
            } else {
                const userData = await fetchUserData();
                const repos = await fetchRepos();
                const totalStars = calculateTotalStars(repos);
                const totalCommits = await fetchTotalCommits(repos);
                const preloadedProjects = await preloadProjects(repos);
                const recentActivity = await fetchRecentActivity();
                const contributions = await fetchContributions();
                const achievements = calculateAchievements(userData, repos);

                const data = {
                    userData,
                    totalStars,
                    totalCommits,
                    preloadedProjects,
                    recentActivity,
                    contributions,
                    achievements
                };

                cacheData(data);
                useCachedData(data);
            }

            // Hide loading overlay and show main content
            document.getElementById('loading-overlay').style.display = 'none';
            document.querySelector('.layout-container').style.display = 'grid';
            
        } catch (error) {
            console.error('Error fetching GitHub data:', error);
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
        displayRecentActivity(data.recentActivity);
        displaySkillLevels(data.preloadedProjects);
        generateProjectFilters(data.preloadedProjects);
        displayAchievements(data.achievements || []);
        displayContributions(data.contributions);
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
            return imageUrlMatch ? imageUrlMatch[1] : null; // 이미지 URL이 없으면 null 반환
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

    async function fetchContributions() {
        try {
            const contributionsResponse = await fetch(`https://api.github.com/users/${username}/events`);
            return await contributionsResponse.json();
        } catch (error) {
            console.error('Error fetching contributions:', error);
            return [];
        }
    }

    function displayProjects(preloadedProjects) {
        const projectsContainer = document.getElementById('projects-container');
        projectsContainer.innerHTML = '';

        const featuredProjects = preloadedProjects.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        let displayedProjects = 6;

        function renderProjects() {
            projectsContainer.innerHTML = '';
            for (const project of featuredProjects.slice(0, displayedProjects)) {
                if (!project.imageUrl) continue;

                const projectCard = document.createElement('div');
                projectCard.className = 'project-card neu-section';

                const projectType = getProjectType(project.topics || [], project.languages);
                projectCard.dataset.type = projectType;

                projectCard.innerHTML = `
                    <h3>${project.name}</h3>
                    ${project.imageUrl ? `<img src="${project.imageUrl}" alt="${project.name} Image">` : ''}
                    <p>${project.description || 'No description available'}</p>
                    <div class="project-tech-stack" style="display: none;">
                        ${project.languages.map(lang => `<span class="tech-tag">${lang}</span>`).join('')}
                    </div>
                    <div class="project-stats">
                        <span><i class="fas fa-star"></i> ${project.stargazers_count}</span>
                        <span><i class="fas fa-code-branch"></i> ${project.forks_count}</span>
                        <span><i class="fas fa-eye"></i> ${project.watchers_count}</span>
                    </div>
                    <div class="project-links">
                        <a href="${project.html_url}" class="neu-button" target="_blank">
                            <i class="fab fa-github"></i>
                        </a>
                        ${project.deploymentUrl ? `
                            <a href="${project.deploymentUrl}" class="neu-button" target="_blank">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                        ` : ''}
                    </div>
                `;

                projectsContainer.appendChild(projectCard);
                setTimeout(() => projectCard.classList.add('visible'), 100);
            }

            const loadMoreButton = document.getElementById('load-more-projects');
            if (displayedProjects >= featuredProjects.length) {
                loadMoreButton.style.display = 'none';
            } else {
                loadMoreButton.style.display = 'block';
                loadMoreButton.onclick = (e) => {
                    e.preventDefault(); // 페이지 새로고침 방지
                    displayedProjects += 6;
                    renderProjects();
                };
            }
        }

        renderProjects();
    }

    function getProjectType(topics, languages) {
        if (topics.includes('Unity') || languages.includes('C#')) return 'Unity';
        if (topics.includes('web') || ['JavaScript', 'TypeScript', 'HTML', 'CSS'].some(lang => languages.includes(lang))) return 'web';
        return 'other';
    }

    async function fetchRecentActivity() {
        try {
            const eventsResponse = await fetch(`https://api.github.com/users/${username}/events/public`);
            return await eventsResponse.json();
        } catch (error) {
            console.error('Error fetching activity:', error);
            return [];
        }
    }

    function displayRecentActivity(events) {
        const activityFeed = document.getElementById('activity-feed');
        activityFeed.innerHTML = '';
        
        events.slice(0, 10).forEach(event => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            const eventText = formatEventText(event);
            activityItem.innerHTML = `
                <div class="activity-icon">
                    <i class="${getEventIcon(event.type)}"></i>
                </div>
                <div class="activity-details">
                    <p>${eventText}</p>
                    <small>${formatDate(event.created_at)}</small>
                </div>
            `;
            
            activityFeed.appendChild(activityItem);
        });
    }

    function formatEventText(event) {
        switch (event.type) {
            case 'PushEvent':
                return `Pushed ${event.payload.commits?.length || 0} commits to ${event.repo.name}`;
            case 'CreateEvent':
                return `Created ${event.payload.ref_type} ${event.payload.ref || ''} in ${event.repo.name}`;
            case 'WatchEvent':
                return `Starred ${event.repo.name}`;
            default:
                return `${event.type} on ${event.repo.name}`;
        }
    }

    function getEventIcon(eventType) {
        const icons = {
            PushEvent: 'fas fa-code-branch',
            CreateEvent: 'fas fa-plus',
            WatchEvent: 'fas fa-star',
            IssuesEvent: 'fas fa-exclamation-circle',
            PullRequestEvent: 'fas fa-code-pull-request'
        };
        return icons[eventType] || 'fas fa-code';
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    }

    function displayLanguageStats(repos) {
        const languages = {};
        let totalSize = 0;
        
        repos.forEach(repo => {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
                totalSize++;
            }
        });
        
        const languageChart = document.getElementById('language-chart');
        languageChart.innerHTML = '';
        
        const languageData = {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: []
            }]
        };
        
        Object.entries(languages)
            .sort(([,a], [,b]) => b - a)
            .forEach(([language, count]) => {
                const percentage = (count / totalSize * 100).toFixed(1);
                languageData.labels.push(language);
                languageData.datasets[0].data.push(percentage);
                languageData.datasets[0].backgroundColor.push(getRandomColor());
            });
        
        new Chart(languageChart, {
            type: 'doughnut',
            data: languageData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function displaySkillLevels(repos) {
        const languageStats = {};
        repos.forEach(repo => {
            if (repo.language) {
                languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
            }
        });

        const totalRepos = repos.length;
        document.querySelectorAll('.skill-card').forEach(skillCard => {
            const language = skillCard.querySelector('h4').textContent;
            const level = languageStats[language] ? (languageStats[language] / totalRepos * 100).toFixed(1) : 0;
            skillCard.querySelector('.skill-level').style.setProperty('--level', `${level}%`);
        });
    }

    function generateProjectFilters(preloadedProjects) {
        const filtersContainer = document.getElementById('filter-dropdown');
        const languagesSet = new Set();

        preloadedProjects.forEach(project => {
            project.languages.forEach(lang => languagesSet.add(lang));
        });

        languagesSet.forEach(lang => {
            const button = document.createElement('button');
            button.className = 'neu-button';
            button.dataset.filter = lang.toLowerCase();
            button.textContent = lang;
            filtersContainer.appendChild(button);
        });

        // Add event listeners to filter buttons
        const filterButtons = document.querySelectorAll('.filter-dropdown button');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                button.classList.toggle('active');
                applyFilters();
            });
        });

        // Toggle filter dropdown
        const filterToggle = document.getElementById('filter-toggle');
        filterToggle.addEventListener('click', () => {
            const filterDropdown = document.getElementById('filter-dropdown');
            filterDropdown.style.display = filterDropdown.style.display === 'none' ? 'flex' : 'none';
        });
    }

    function applyFilters() {
        const activeFilters = Array.from(document.querySelectorAll('.filter-dropdown button.active'))
            .map(button => button.dataset.filter);
        
        const projects = document.querySelectorAll('.project-card');
        projects.forEach(project => {
            const projectLanguages = Array.from(project.querySelectorAll('.tech-tag'))
                .map(tag => tag.textContent.toLowerCase());
            
            if (activeFilters.length === 0 || activeFilters.includes('all') || activeFilters.some(filter => projectLanguages.includes(filter))) {
                project.style.display = 'block';
            } else {
                project.style.display = 'none';
            }
        });
    }

    // Project Filters
    const filterButtons = document.querySelectorAll('.project-filters button');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const projects = document.querySelectorAll('.project-card');
            projects.forEach(project => {
                if (filter === 'all' || project.dataset.type === filter) {
                    project.style.display = 'block';
                } else {
                    project.style.display = 'none';
                }
            });
        });
    });

    // Initialize skill levels
    document.querySelectorAll('.skill-level').forEach(skill => {
        const level = skill.dataset.level;
        skill.style.setProperty('--level', `${level}%`);
    });

    // Smooth scroll for quick links
    document.querySelectorAll('.quick-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Initialize
    fetchGitHubData();
    
    function calculateAchievements(userData, repos) {
        const achievements = [];
        if (userData.followers >= 100) {
            achievements.push({
                icon: 'fas fa-users',
                text: `Reached ${userData.followers} followers`
            });
        }
        if (repos.some(repo => repo.stargazers_count >= 50)) {
            achievements.push({
                icon: 'fas fa-star',
                text: 'One of your repositories has 50+ stars'
            });
        }
        return achievements;
    }

    function displayAchievements(achievements) {
        const achievementsList = document.getElementById('achievements-list');
        achievementsList.innerHTML = '';
        achievements.forEach(achievement => {
            const achievementItem = document.createElement('div');
            achievementItem.className = 'achievement-item';
            achievementItem.innerHTML = `
                <div class="achievement-icon">
                    <i class="${achievement.icon}"></i>
                </div>
                <div class="achievement-details">
                    <p>${achievement.text}</p>
                </div>
            `;
            achievementsList.appendChild(achievementItem);
        });
    }

    function displayContributions(contributions) {
        const contributionGraph = document.getElementById('contribution-graph');
        const contributionCalendar = document.getElementById('contribution-calendar');
        const contributionStreak = document.getElementById('contribution-streak');

        // 기여 그래프, 캘린더, 연속 기여 일수를 표시하는 로직을 추가합니다.
        // 예시로 Chart.js를 사용하여 기여 그래프를 표시할 수 있습니다.
        // contributionGraph.innerHTML = ''; // 기존 내용을 지웁니다.
        // Chart.js를 사용하여 기여 그래프를 그립니다.
    }
});