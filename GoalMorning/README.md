# GoalMorning

매일 아침 나의 비전과 목표를 다시 떠올리게 해주는 앱.

- 기획: [PLAN.md](PLAN.md)
- 디자인: [DESIGN.md](DESIGN.md)

## 안드로이드 폰에 설치하기 (APK, 컴퓨터 필요 없음)

코드가 GitHub에 올라가면 GitHub가 자동으로 설치 파일을 만들어요 (10~20분).

1. 폰 브라우저로 https://github.com/aaronkoo-svg/myprojects/releases 열기
2. 맨 위 **GoalMorning 테스트 빌드 N** 에서 `GoalMorning-N.apk` 누르기
3. 다운로드가 끝나면 파일을 눌러 설치
   - "출처를 알 수 없는 앱" 경고가 나오면 **설정 → 이 출처 허용**을 켜고 다시 설치
   - Play 프로텍트 경고가 나오면 **무시하고 설치** (직접 만든 테스트 앱이라 나오는 경고)
4. 새 빌드가 나오면 같은 방법으로 설치하면 업데이트돼요 (데이터 유지)

## 개발용으로 실행해보기 (Expo Go)

처음 한 번만 준비하면, 다음부터는 3번만 하면 돼요.

### 1. 준비물 설치 (처음 한 번)

1. **컴퓨터**에 [Node.js](https://nodejs.org) 설치 (LTS 버전, 설치 버튼만 누르면 됨)
2. **컴퓨터**에 [Git](https://git-scm.com/downloads) 설치 (Mac은 보통 이미 있음)
3. **폰**에 **Expo Go** 앱 설치 (앱스토어 / 플레이스토어에서 "Expo Go" 검색)

### 2. 코드 내려받기 (처음 한 번)

컴퓨터에서 터미널(Mac: "터미널" 앱, Windows: "PowerShell")을 열고 한 줄씩 입력:

```bash
git clone https://github.com/aaronkoo-svg/myprojects.git
```

```bash
cd myprojects/GoalMorning
```

```bash
npm install
```

### 3. 실행

```bash
npx expo start
```

화면에 QR 코드가 나오면:

- **아이폰**: 기본 카메라 앱으로 QR 코드를 찍고, 뜨는 알림을 누르기
- **안드로이드**: Expo Go 앱을 열고 "Scan QR code"로 찍기

> 컴퓨터와 폰이 **같은 와이파이**에 있어야 해요.
> 잘 안 되면 `npx expo start --tunnel` 로 실행해 보세요.

끝낼 때는 터미널에서 `Ctrl + C`.

### 나중에 새 버전 받기

```bash
git pull
```

```bash
npm install
```

그다음 다시 `npx expo start`.

## 개발자 메모

- Expo SDK 58, Expo Router (`src/app/`), TypeScript
- 디자인 토큰: `src/constants/theme.ts` (색, 글꼴, 간격)
- 공통 부품: `src/components/` (`AppText`, `Card`, `Button`, `Screen`, `EmptyState`)
- 아이콘: `phosphor-react-native`
- 확인: `npx tsc --noEmit`, 웹 미리보기 `npx expo start --web`
