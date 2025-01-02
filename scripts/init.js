import { fetchGitHubData } from './github.js';

document.addEventListener('DOMContentLoaded', () => {
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

    // Initialize GitHub data fetching
    fetchGitHubData();
});
