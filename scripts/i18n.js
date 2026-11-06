// index.html의 inline script가 브라우저 언어를 보고 <html lang>을 먼저 정한다.
export const locales = {
    ko: '한국어',
    en: 'English',
    ja: '日本語'
};

const root = document.documentElement;
const storageKey = 'monitari-locale';
const japaneseFontUrl = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-jp-dynamic-subset.min.css';

let locale = locales[root.lang] ? root.lang : 'ko';

// data-i18n이 붙은 문서 본문. 한국어는 HTML 원문을 그대로 쓴다.
const documents = {
    en: {
        'skip': 'Skip to content',
        'hero.lead': 'I make games and simulations',
        'doc.updated': 'Last edited:',
        'doc.github': 'View on GitHub',
        'doc.edit': 'Edit',
        'doc.history': 'History',
        'doc.categories': 'Categories',
        'cat.programmer': 'South Korean programmers',
        'cat.university': 'Chungbuk National University',
        'cat.gamedev': 'Game development',
        'cat.simulation': 'Simulation',
        'notice.badge': 'Written by the subject',
        'notice.text': 'The owner of this page wrote this page, so it may lean a little subjective.',
        'info.sub': 'Developer',
        'info.affiliation': 'Affiliation',
        'info.affiliationValue': 'Chungbuk National University',
        'info.residence': 'Residence',
        'info.residenceValue': 'Cheonan, South Korea',
        'info.main': 'Main language',
        'info.fields': 'Fields',
        'info.fieldsValue': 'Games, simulations, web',
        'info.motto': 'Motto',
        'info.links': 'Links',
        'stat.projects': 'Projects',
        'stat.repositories': 'Repositories',
        'stat.followers': 'Followers',
        'recent.title': 'Recent changes',
        'toc.title': 'Contents',
        'sec.overview': 'Overview',
        'sec.projects': 'Projects',
        'sec.stack': 'Tech stack',
        'sec.trivia': 'Trivia',
        'sec.links': 'External links',
        'overview.1': '<strong>monitari</strong> is a developer based in Cheonan, South Korea.<a class="fn" href="#fn-1" id="fnr-1">[1]</a> Affiliated with Chungbuk National University. Mostly makes games, simulations and things for the web.',
        'overview.2': 'Not the type to finish a perfect design doc first. Builds something that runs, runs it, fixes whatever looks wrong. Somewhere along the way another repository appears.',
        'overview.3': 'The GitHub bio reads <q>The Singularity Is Near</q>. <del>Homework deadlines arrive first.</del>',
        'filter.all': 'All',
        'filter.game': 'Games',
        'filter.simulation': 'Simulation',
        'filter.web': 'Web',
        'filter.code': 'Homework',
        'view.cards': 'Cards',
        'view.list': 'List',
        'stack.body': 'Python comes first. The web gets JavaScript and TypeScript, games get Unity and C#, and lately Godot. C and Java show up because of school.',
        'stack.ratio': 'Languages across projects <small>(homework excluded)</small>',
        'trivia.1': 'GitHub Actions refreshes the project list on this page every day.<a class="fn" href="#fn-2" id="fnr-2">[2]</a> Create a new repository and it turns up here on its own.',
        'trivia.2': 'There are C homework repositories from homework2 to homework9.<a class="fn" href="#fn-3" id="fnr-3">[3]</a> The whereabouts of homework1 are unknown.',
        'trivia.3': 'The oldest repository is called firstproject. Its description is <q>my github first project</q>.',
        'fn.1': 'monitari on GitHub and Steam, mo_nitari on Instagram and X. The username is half unified.',
        'fn.2': 'It runs at 9:17 every morning, Korean time. Only the owner knows why it has to be 17.',
        'fn.3': 'According to its description, homework8 is actually the week 12 assignment.',
        'project.overview': 'Overview',
        'project.language': 'Language',
        'project.stars': 'Stars',
        'project.forks': 'Forks',
        'project.size': 'Size',
        'project.created': 'Created',
        'project.repository': 'View repository',
        'project.demo': 'Try it now',
        'sort.title': 'What order do you want?',
        'locale.title': 'Which language do you want?',
        'footer.note': 'The contents of this page may change whenever the owner feels like it.'
    },
    ja: {
        'skip': '本文へ移動',
        'hero.lead': 'ゲームとシミュレーションを作っています',
        'doc.updated': '最終更新:',
        'doc.github': 'GitHubで見る',
        'doc.edit': '編集',
        'doc.history': '履歴',
        'doc.categories': 'カテゴリ',
        'cat.programmer': '韓国のプログラマー',
        'cat.university': '忠北大学校',
        'cat.gamedev': 'ゲーム開発',
        'cat.simulation': 'シミュレーション',
        'notice.badge': '本人執筆',
        'notice.text': '本人が書いた記事なので、内容がやや主観的な場合がある。',
        'info.sub': '開発者',
        'info.affiliation': '所属',
        'info.affiliationValue': '忠北大学校',
        'info.residence': '居住地',
        'info.residenceValue': '韓国 天安市',
        'info.main': '主な言語',
        'info.fields': '分野',
        'info.fieldsValue': 'ゲーム、シミュレーション、Web',
        'info.motto': '座右の銘',
        'info.links': 'リンク',
        'stat.projects': 'プロジェクト',
        'stat.repositories': 'リポジトリ',
        'stat.followers': 'フォロワー',
        'recent.title': '最近の変更',
        'toc.title': '目次',
        'sec.overview': '概要',
        'sec.projects': 'プロジェクト',
        'sec.stack': '技術スタック',
        'sec.trivia': '余談',
        'sec.links': '外部リンク',
        'overview.1': '<strong>monitari</strong>は天安に住む開発者である。<a class="fn" href="#fn-1" id="fnr-1">[1]</a> 忠北大学校に所属し、主にゲーム、シミュレーション、Webを作っている。',
        'overview.2': '完璧な企画書を書いてから始めるタイプではない。まず動くものを作り、動かしてみて、おかしければ直す。そうしているうちにリポジトリがひとつ増えている。',
        'overview.3': 'GitHubの自己紹介は<q>The Singularity Is Near</q>。<del>特異点より課題の締め切りのほうが先に来る。</del>',
        'filter.all': 'すべて',
        'filter.game': 'ゲーム',
        'filter.simulation': 'シミュレーション',
        'filter.web': 'Web',
        'filter.code': '課題',
        'view.cards': 'カード',
        'view.list': 'リスト',
        'stack.body': '主力はPython。WebはJavaScriptとTypeScript、ゲームはUnityとC#、最近はGodotでも作る。学校の課題の都合でCとJavaも使う。',
        'stack.ratio': 'プロジェクトの言語比率 <small>(課題を除く)</small>',
        'trivia.1': 'このページのプロジェクト一覧はGitHub Actionsが毎日自動で更新している。<a class="fn" href="#fn-2" id="fnr-2">[2]</a> リポジトリを新しく作れば、ここにも勝手に載る。',
        'trivia.2': 'Cの課題リポジトリがhomework2からhomework9まである。<a class="fn" href="#fn-3" id="fnr-3">[3]</a> homework1の行方は分かっていない。',
        'trivia.3': '最も古いリポジトリの名前はfirstproject。説明文は<q>my github first project</q>である。',
        'fn.1': 'GitHubとSteamはmonitari、InstagramとXはmo_nitari。名前の統一は半分だけ成功した。',
        'fn.2': '韓国時間で毎朝9時17分に動く。なぜ17分なのかは本人しか知らない。',
        'fn.3': '説明文によると、homework8は実は第12週の課題である。',
        'project.overview': '概要',
        'project.language': '言語',
        'project.stars': 'スター',
        'project.forks': 'フォーク',
        'project.size': 'サイズ',
        'project.created': '作成',
        'project.repository': 'リポジトリを見る',
        'project.demo': '今すぐ試す',
        'sort.title': 'どの順番で見ますか?',
        'locale.title': 'どの言語で見ますか?',
        'footer.note': 'この記事の内容は本人の気分で変わることがある。'
    }
};

// 화면 문구. 토스 문구 원칙대로 해요체, 능동형, 군더더기 없이 쓴다.
const interfaceText = {
    ko: {
        pageTitle: 'monitari - 프로젝트 위키',
        pageDescription: '게임, 시뮬레이션, 웹을 만드는 monitari의 프로젝트 위키',
        searchLabel: '프로젝트 검색',
        searchPlaceholder: '프로젝트를 찾아보세요',
        changeLanguage: '언어 바꾸기',
        toDark: '다크 모드로 바꾸기',
        toLight: '라이트 모드로 바꾸기',
        home: 'monitari 홈',
        close: '닫기',
        copyLink: '링크 복사하기',
        copied: '링크를 복사했어요',
        copyFailed: '링크를 복사하지 못했어요',
        openProject: '{title} 자세히 보기',
        preview: '{title} 미리보기',
        sortLabel: '정렬 기준 바꾸기, 지금은 {sort}',
        filterLabel: '분야 고르기',
        viewLabel: '보기 방식',
        statsLabel: 'GitHub 통계',
        ledeAll: '프로젝트 {n}개를 만들었어요',
        ledeCategory: '{category} 프로젝트 {n}개를 만들었어요',
        ledeCode: '과제 {n}개를 제출했어요',
        ledeSearch: '\'{query}\' 검색 결과 {n}개예요',
        emptyTitle: '찾는 프로젝트가 없어요',
        emptyAction: '필터 지우기',
        synced: '{date}에 동기화했어요',
        loading: '불러오고 있어요',
        featured: '대표',
        demo: '데모',
        justNow: '방금',
        unknown: '모름',
        none: '없음',
        other: '기타',
        createdAgo: '{time} 만듦',
        starCount: '별 {n}개',
        forkCount: '포크 {n}개',
        categoryGame: '게임',
        categorySimulation: '시뮬레이션',
        categoryAi: 'AI',
        categoryWeb: '웹',
        categoryCode: '과제',
        sortGroupDate: '날짜',
        sortGroupName: '이름',
        sortGroupReaction: '반응',
        sortGroupSize: '크기',
        sortGroupOther: '그 밖에',
        'sort.updated-desc': '최신순',
        'sort.updated-asc': '오래된순',
        'sort.created-desc': '새로 만든 순',
        'sort.created-asc': '먼저 만든 순',
        'sort.name-asc': '이름순',
        'sort.name-desc': '이름 역순',
        'sort.stars-desc': '별 많은 순',
        'sort.forks-desc': '포크 많은 순',
        'sort.size-desc': '용량 큰 순',
        'sort.size-asc': '용량 작은 순',
        'sort.language': '언어별',
        'sort.category': '분야별',
        'sort.demo': '바로 해볼 수 있는 것 먼저',
        'sort.featured': '대표작 먼저',
        'sort.shuffle': '무작위'
    },
    en: {
        pageTitle: 'monitari - Project Wiki',
        pageDescription: 'The project wiki of monitari, who makes games, simulations and things for the web',
        searchLabel: 'Search projects',
        searchPlaceholder: 'Search projects',
        changeLanguage: 'Change language',
        toDark: 'Switch to dark mode',
        toLight: 'Switch to light mode',
        home: 'monitari home',
        close: 'Close',
        copyLink: 'Copy link',
        copied: 'Link copied',
        copyFailed: 'Could not copy the link',
        openProject: 'Open {title}',
        preview: 'Preview of {title}',
        sortLabel: 'Change sort order, currently {sort}',
        filterLabel: 'Choose a field',
        viewLabel: 'View',
        statsLabel: 'GitHub stats',
        ledeAll: '{n} project{s} so far',
        ledeCategory: '{n} {category} project{s} so far',
        ledeCode: '{n} homework repo{s} handed in',
        ledeSearch: '{n} result{s} for \'{query}\'',
        emptyTitle: 'Nothing matches that',
        emptyAction: 'Clear filters',
        synced: 'Synced {date}',
        loading: 'Loading',
        featured: 'Featured',
        demo: 'Demo',
        justNow: 'just now',
        unknown: 'Unknown',
        none: 'None',
        other: 'Other',
        createdAgo: 'created {time}',
        starCount: '{n} star{s}',
        forkCount: '{n} fork{s}',
        categoryGame: 'game',
        categorySimulation: 'simulation',
        categoryAi: 'AI',
        categoryWeb: 'web',
        categoryCode: 'homework',
        sortGroupDate: 'Date',
        sortGroupName: 'Name',
        sortGroupReaction: 'Reactions',
        sortGroupSize: 'Size',
        sortGroupOther: 'Other',
        'sort.updated-desc': 'Latest',
        'sort.updated-asc': 'Oldest',
        'sort.created-desc': 'Newly created',
        'sort.created-asc': 'First created',
        'sort.name-asc': 'Name, A to Z',
        'sort.name-desc': 'Name, Z to A',
        'sort.stars-desc': 'Most stars',
        'sort.forks-desc': 'Most forks',
        'sort.size-desc': 'Largest',
        'sort.size-asc': 'Smallest',
        'sort.language': 'By language',
        'sort.category': 'By field',
        'sort.demo': 'Playable first',
        'sort.featured': 'Featured first',
        'sort.shuffle': 'Shuffle'
    },
    ja: {
        pageTitle: 'monitari - プロジェクトWiki',
        pageDescription: 'ゲーム、シミュレーション、Webを作るmonitariのプロジェクトWiki',
        searchLabel: 'プロジェクトを検索',
        searchPlaceholder: 'プロジェクトを検索',
        changeLanguage: '言語を変更',
        toDark: 'ダークモードに切り替える',
        toLight: 'ライトモードに切り替える',
        home: 'monitari ホーム',
        close: '閉じる',
        copyLink: 'リンクをコピー',
        copied: 'リンクをコピーしました',
        copyFailed: 'リンクをコピーできませんでした',
        openProject: '{title}の詳細を見る',
        preview: '{title}のプレビュー',
        sortLabel: '並び順を変更、現在は{sort}',
        filterLabel: '分野を選ぶ',
        viewLabel: '表示方法',
        statsLabel: 'GitHubの統計',
        ledeAll: 'プロジェクトを{n}件作りました',
        ledeCategory: '{category}プロジェクトを{n}件作りました',
        ledeCode: '課題を{n}件提出しました',
        ledeSearch: '「{query}」の検索結果は{n}件です',
        emptyTitle: '見つかりませんでした',
        emptyAction: '絞り込みを解除',
        synced: '{date}に同期しました',
        loading: '読み込んでいます',
        featured: '代表作',
        demo: 'デモ',
        justNow: 'たった今',
        unknown: '不明',
        none: 'なし',
        other: 'その他',
        createdAgo: '{time}に作成',
        starCount: 'スター{n}',
        forkCount: 'フォーク{n}',
        categoryGame: 'ゲーム',
        categorySimulation: 'シミュレーション',
        categoryAi: 'AI',
        categoryWeb: 'Web',
        categoryCode: '課題',
        sortGroupDate: '日付',
        sortGroupName: '名前',
        sortGroupReaction: '反応',
        sortGroupSize: 'サイズ',
        sortGroupOther: 'その他',
        'sort.updated-desc': '新しい順',
        'sort.updated-asc': '古い順',
        'sort.created-desc': '作成が新しい順',
        'sort.created-asc': '作成が古い順',
        'sort.name-asc': '名前順',
        'sort.name-desc': '名前の逆順',
        'sort.stars-desc': 'スターが多い順',
        'sort.forks-desc': 'フォークが多い順',
        'sort.size-desc': 'サイズが大きい順',
        'sort.size-asc': 'サイズが小さい順',
        'sort.language': '言語別',
        'sort.category': '分野別',
        'sort.demo': 'すぐ試せる順',
        'sort.featured': '代表作から',
        'sort.shuffle': 'ランダム'
    }
};

const originals = new Map();

export function currentLocale() {
    return locale;
}

export function t(key, values = {}) {
    const template = interfaceText[locale][key] ?? interfaceText.ko[key] ?? key;
    const plural = (values.count ?? values.n) === 1 ? '' : 's';
    return template
        .replaceAll('{s}', plural)
        .replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
}

function translateDocument() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
        if (!originals.has(element)) originals.set(element, element.innerHTML);
        const translated = documents[locale]?.[element.dataset.i18n];
        element.innerHTML = translated ?? originals.get(element);
    });

    document.querySelectorAll('[data-i18n-label]').forEach((element) => {
        element.setAttribute('aria-label', t(element.dataset.i18nLabel));
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
        element.placeholder = t(element.dataset.i18nPlaceholder);
    });
}

function loadJapaneseFont() {
    if (locale !== 'ja' || document.querySelector('#font-ja')) return;
    const link = document.createElement('link');
    link.id = 'font-ja';
    link.rel = 'stylesheet';
    link.href = japaneseFontUrl;
    document.head.append(link);
}

function applyLocale() {
    root.lang = locale;
    document.title = t('pageTitle');
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('pageDescription'));
    loadJapaneseFont();
    translateDocument();
    root.classList.remove('i18n-pending');
}

export function setLocale(next) {
    if (!locales[next] || next === locale) return;
    locale = next;

    try {
        localStorage.setItem(storageKey, next);
    } catch {
        // The selected language still applies when storage is unavailable.
    }

    // 주소의 ?lang=이 다음 방문 때 고른 언어를 덮어쓰지 않게 지운다.
    const url = new URL(window.location.href);
    if (url.searchParams.has('lang')) {
        url.searchParams.delete('lang');
        window.history.replaceState(null, '', url);
    }

    applyLocale();
    document.dispatchEvent(new CustomEvent('localechange', { detail: next }));
}

applyLocale();
