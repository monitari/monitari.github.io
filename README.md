# Monitari Portfolio

monitari(`@monitari`)의 GitHub 프로젝트를 모아 둔 정적 포트폴리오. 위키 문서 레이아웃에 인스타그램식 그리드와 스토리 필터를 섞었고, 패널은 글래스모피즘으로 처리했다.

## 프로젝트 자동 동기화

[Sync GitHub projects](.github/workflows/sync-projects.yml) 워크플로가 다음 상황에 실행됩니다.

- 매시간 17분에 자동 실행
- GitHub Actions의 `Run workflow` 버튼으로 수동 실행
- 동기화 스크립트나 설정 파일이 `main`에 변경됐을 때 실행

워크플로는 GitHub가 자동으로 제공하는 `GITHUB_TOKEN`으로 공개 저장소를 읽고, [`data/projects.json`](data/projects.json)을 갱신한 뒤 변경이 있을 때만 커밋합니다. README에 적절한 이미지가 있으면 `assets/projects`에 로컬 미리보기로 저장하고, 이미지가 없으면 언어별 타이포그래피 SVG 커버를 자동 생성합니다. 방문자의 브라우저에서는 GitHub API나 이미지 서버를 직접 호출하지 않으므로 API 제한이나 토큰 노출 때문에 사이트가 멈추지 않습니다.

새 공개 저장소는 별도 설정 없이 자동으로 그리드에 추가됩니다. 포트폴리오에서 제외할 저장소, 앞쪽에 고정할 저장소, 표시 이름, 설명, 분류, 데모 URL은 [`data/project-config.json`](data/project-config.json)에서 관리합니다.

로컬에서 프로젝트 데이터를 다시 만들려면 다음 명령을 실행합니다.

```powershell
node scripts/sync-projects.mjs
```

로컬 비인증 요청은 GitHub API 제한을 적용받습니다. GitHub Actions에서는 저장소 기본 토큰을 사용하므로 개인 액세스 토큰을 코드에 추가하면 안 됩니다.

## 로컬 실행

ES modules와 JSON 요청을 사용하므로 파일을 직접 열기보다 로컬 HTTP 서버로 실행합니다.

```powershell
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`으로 접속합니다.

## 주요 구조

- `index.html`: 위키 문서 본문, 정보 상자, 프로젝트 폴백, 상세 다이얼로그
- `styles.css`: 글래스모피즘 반응형 UI, 라이트/다크 테마
- `scripts/init.js`: 데이터 렌더링, 검색과 필터, 최근 변경, 언어 비율, 각주, 프로젝트 상세
- `scripts/themes.js`: 테마 선택과 시스템 설정 연동
- `scripts/sync-projects.mjs`: GitHub API 데이터를 정적 JSON으로 생성
- `scripts/cover.mjs`: README 이미지가 없는 저장소의 커버 SVG 생성. 디자인을 바꾸면 `COVER_VERSION`을 올린다
- `data/project-config.json`: 제외, 고정, 표시 정보 설정
- `data/projects.json`: 자동 생성된 프로젝트 데이터

## 배포

`main` 브랜치가 GitHub Pages로 배포됩니다.
