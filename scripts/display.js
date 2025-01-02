let languageChartInstance;

export function displayProjects(preloadedProjects) {
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

export function displayRecentActivity(events) {
    console.log('Displaying recent activity:', events);
    if (!Array.isArray(events)) {
        console.warn('Recent activity is not an array:', events);
        return;
    }
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

export function displayLanguageStats(repos) {
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
    
    if (languageChartInstance) {
        languageChartInstance.destroy();
    }

    languageChartInstance = new Chart(languageChart, {
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

export function displaySkillLevels(repos) {
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

export function generateProjectFilters(preloadedProjects) {
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
