const root = document.documentElement;
const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('#menu-toggle');
const navigation = document.querySelector('#site-nav');
const filterButtons = [...document.querySelectorAll('.filter-button')];
const projectCards = [...document.querySelectorAll('.project-card')];
const filterStatus = document.querySelector('#filter-status');
const navigationLinks = [...document.querySelectorAll('.site-nav a')];
const observedSections = navigationLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

root.classList.add('js-ready');

document.querySelector('#current-year').textContent = new Date().getFullYear();

function setHeaderState() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
}

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

function closeMenu() {
    navigation.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', '메뉴 열기');
}

menuToggle.addEventListener('click', () => {
    const willOpen = !navigation.classList.contains('is-open');
    navigation.classList.toggle('is-open', willOpen);
    menuToggle.setAttribute('aria-expanded', String(willOpen));
    menuToggle.setAttribute('aria-label', willOpen ? '메뉴 닫기' : '메뉴 열기');
});

navigationLinks.forEach((link) => link.addEventListener('click', closeMenu));

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeMenu();
    }
});

document.addEventListener('click', (event) => {
    if (!navigation.contains(event.target) && !menuToggle.contains(event.target)) {
        closeMenu();
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 760) {
        closeMenu();
    }
});

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const selectedFilter = button.dataset.filter;
        let visibleCount = 0;

        filterButtons.forEach((candidate) => {
            const isSelected = candidate === button;
            candidate.classList.toggle('is-active', isSelected);
            candidate.setAttribute('aria-pressed', String(isSelected));
        });

        projectCards.forEach((card) => {
            const categories = card.dataset.category.split(' ');
            const isVisible = selectedFilter === 'all' || categories.includes(selectedFilter);
            card.hidden = !isVisible;
            visibleCount += Number(isVisible);
        });

        filterStatus.textContent = `${visibleCount}개의 프로젝트`;
    });
});

if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            navigationLinks.forEach((link) => {
                link.toggleAttribute('aria-current', link.getAttribute('href') === `#${entry.target.id}`);
            });
        });
    }, { rootMargin: '-35% 0px -55%', threshold: 0 });

    observedSections.forEach((section) => sectionObserver.observe(section));
} else {
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}
