# Daymark

이모지 세 개로 하루를 남기는 iOS/Android 다이어리입니다.
웹은 개발 미리보기 용도로만 사용합니다.

## 시작하기

Node 24 LTS와 npm을 사용합니다. 앱 코드는 mobile/에 있습니다.

```sh
cd mobile
npm ci
npm start
```

터미널 QR을 SDK 57 호환 Expo Go로 열거나 개발 빌드를 사용합니다.
웹 미리보기는 `npm run web`으로 실행합니다.
포트가 비어 있으면 기본 주소는 http://localhost:8081 입니다.

## 검증

```sh
npm run typecheck
npm run lint
npx expo-doctor
npx expo export --platform all
```

## 현재 범위

2단계: 테마, 네 개의 하단 탭, 한국어/영어 전환, 자체 이모지 선택기,
최근 사용·카테고리·한영 검색, 80자 메모, 기록 저장·수정.
기록·초안·최근 이모지·언어 선택은 현재 메모리에만 유지됩니다.
앱 종료 또는 새로고침 시 사라집니다. 달력 데이터, 리캡, 알림, 공유는 아직 구현하지 않았습니다.
2단계 전체 코드와 실행 순서는 docs/STEP-02.md에 있습니다.

## 다음 단계

3. 데이터 모델과 영구 로컬 저장소
4. 월간 달력
5. 주간/월간 리캡과 스트릭
6. 알림과 설정 저장
7. 규칙 기반 조합 문구, 선택적 AI 확장
8. 이미지 공유와 배포

## 협업

- main 직접 푸시 금지. PR 한 건에 기능 하나.
- 브랜치: feature/setup, feature/home, feature/calendar, feature/recap.
- 커밋: feat:, fix:, docs:, chore: 접두사 사용.
- PR에 변경 요약, iOS/Android 확인 결과, 화면 캡처를 포함합니다.
- 최소 한 명 승인 후 squash merge 합니다.
- GitHub main 보호 규칙에서 PR과 승인 1개를 필수로 설정합니다.
- package-lock.json을 커밋하고 팀원은 npm ci를 사용합니다.
- 공통 테마/번역/의존성 수정은 PR에 명시합니다.

## 폴더 담당

- src/app: 경로와 네비게이션
- src/screens: 기능별 화면
- src/components: 공통 UI
- src/hooks: 상태와 화면 연결
- src/storage: 로컬 저장 및 향후 동기화 경계
- src/ai: 규칙 기반 요약 및 선택적 AI 연동
- src/theme: 색상과 공통 스타일
- src/i18n: 한국어/영어 문구

## 데이터와 프라이버시 원칙

기록은 기기 현지 날짜당 하나, 이모지 정확히 3개, 선택 메모 최대 80자입니다.
초기 버전은 로컬 저장을 사용합니다. 앱 삭제 시 기록을 잃을 수 있으므로
가족 배포 전 내보내기/복원 기능을 마련합니다.
로컬 저장이 암호화 보관을 의미하지는 않습니다.
공유는 사용자가 실행한 이미지 공유만 지원하며 메모 포함 기본값은 끕니다.
AI API 키를 앱이나 EXPO_PUBLIC 환경 변수에 넣지 않습니다.

## 배포 방향

개발: Expo Go 또는 development build.
가족 테스트: Android APK, iOS TestFlight.
iOS TestFlight 배포에는 Apple Developer 계정이 필요합니다.
알림과 공유는 웹이 아닌 실제 iOS/Android 기기에서 검증합니다.
