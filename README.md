# Monitari Portfolio

Junhoo Kim (`@monitari`)의 정적 포트폴리오 사이트입니다.

## 로컬 실행

ES modules를 사용하므로 파일을 직접 열기보다 로컬 HTTP 서버로 실행합니다.

```powershell
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`으로 접속합니다.

## 구조

- `index.html`: 소개, 대표 프로젝트, 기술, 연락처 콘텐츠
- `styles.css`: 반응형 레이아웃과 라이트·다크 테마
- `scripts/themes.js`: 테마 선택과 시스템 설정 연동
- `scripts/init.js`: 모바일 메뉴, 프로젝트 필터, 스크롤 인터랙션

사이트의 핵심 콘텐츠는 JavaScript나 GitHub API 없이도 표시됩니다. 공개 토큰이나 개인 키를 클라이언트 코드에 추가하지 마세요.

## 배포

`main` 브랜치가 GitHub Pages로 배포됩니다.
