# GoalMorning

아침마다 목표를 리마인드하는 모바일 앱 (Expo / React Native). 이 폴더가 프로젝트의 기본 폴더다.
저장소 맨 위에는 GitHub가 요구하는 `.github/workflows`(APK 자동 빌드)만 둔다.

- 기획: `PLAN.md`
- 디자인: `DESIGN.md` — 화면을 만들거나 고치기 전에 반드시 읽고 따른다 (애플 디자인 언어 기반, 폰트: Pretendard 300·400·600·700). 원본 분석은 `design/apple-reference.md`.
- 디자인 원칙 참고: `.claude/skills/stageshow/references/craft.md`. 앱스토어 스크린샷·소개용 화면 일러스트는 stageshow 스킬로 만든다.
- Expo 작업 규칙: `AGENTS.md`
- APK: `main`에 `GoalMorning/` 변경이 올라가면 `../.github/workflows/goalmorning-apk.yml`이 빌드해 GitHub Releases에 올린다.
- 사용자는 코딩 경험이 적다. 설치·실행 방법은 쉬운 한국어로 단계별로 안내한다.
