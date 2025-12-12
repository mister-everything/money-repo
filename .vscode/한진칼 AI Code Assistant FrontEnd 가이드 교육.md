# 한진KAL 그룹웨어(한웨이 2.0) 프론트엔드 고도화 프로젝트

## 한진칼 AI Code Assistant FrontEnd 가이드 교육 보고서

Ver. 1.0

---

## 목차

1. 개요
2. 교육 소감 & 페르소나 분석
3. 회사 내 향후 계획
4. 결론
5. AI 증강 개발 개요(Frontend 관점)
6. Frontend SW Architecture Standard
7. Naming Conventions & Coding Standards (FE)
8. Frontend 아키텍처 & 디렉터리 구조
9. Frontend 개발 가이드
10. Frontend Test 가이드(방향)
11. AI Code Assistant 설정 & 활용 원칙
12. Prompt 작성 가이드(Frontend)
13. Project 적용 실습 시나리오 (Frontend)
14. summary
15. AI Coding Assistant가 잘하는 것(Frontend)
16. AI Coding Assistant를 잘 활용하기 위한 TODO

---

## 1. 개요

본 문서는 `hanway-front` 저장소(한웨이 2.0 그룹웨어 프론트엔드) 전체 소스코드와  
사내 시스템 프롬프트 문서(`.cursor/rules/hanway-rule.mdc`, `.cursor/rules/chakra-n-cmm-component-rule.mdc`)를 기반으로,  
AI Code Assistant(이하 “코드 어시스턴트”)를 프론트엔드 개발에 효과적으로 적용하기 위한 가이드를 정리한 교육 보고서이다.

백엔드 교육 보고서(「한진칼 AI Code Assistant BackEnd 가이드 교육」)의 구조와 철학을 유지하면서,  
프론트엔드(React + TypeScript + Chakra v3 + 공용 Hw 컴포넌트 + Zustand + React Query + i18n) 아키텍처에 맞도록 내용을 재구성하였다.

이 문서는 다음을 목표로 한다.

- 한웨이 2.0 프론트엔드 아키텍처를 코드 어시스턴트 관점에서 이해
- 코드 어시스턴트에게 “어떻게 질문해야 하는지(프롬프트)”를 표준화
- 실 프로젝트에 단계적으로 적용할 수 있는 실습/시나리오 제시
- 향후 FE 개발 표준 및 자동화(코드 생성, 리팩토링, 문서화)의 기반 마련

---

## 2. 교육 소감 & 페르소나 분석 (Frontend 관점)

### 2.1 교육 소감

- 프론트엔드에서도 코드 어시스턴트는 반복적인 UI 코드 작성, 훅/서비스 템플릿 생성, 타입 정의, i18n 문구 추출 등  
  “패턴화된 작업”을 빠르게 처리해 주어, 개발자는 UX 설계·상태 흐름·에러 케이스 등 고난이도 문제에 집중할 수 있다.
- 특히 이 프로젝트는 공용 UI Kit(Hw\* 컴포넌트)와 Chakra v3 토큰, TanStack Query, Zustand 등 아키텍처 규칙이 많기 때문에  
  코드 어시스턴트가 “규칙을 기억하고 지켜주는 보조자” 역할을 할 때 생산성과 일관성이 크게 향상된다.
- 반면, 자동 생성 코드에 대한 검토/리뷰 없이 그대로 사용하는 경우
  - 디렉터리 구조나 네이밍 규칙 위반
  - 공용 컴포넌트를 사용하지 않고 Chakra/HTML을 그대로 사용하는 문제
  - 데이터 흐름(페이지 ↔ 훅 ↔ 서비스 ↔ HTTP Client) 파괴  
    등이 쉽게 발생할 수 있으므로, **“코드 어시스턴트가 제안한 코드는 항상 사람이 검증한다”**는 원칙이 필수적이다.

### 2.2 Proxy AI 페르소나(Frontend 버전)

Backend 교육 문서에서 정의한 Proxy AI 페르소나를 FE에 맞게 재정의한다.

- 역할
  - “한웨이 2.0 프론트엔드 레포를 이해하고, FE 아키텍처 규칙을 지키는 시니어 프론트엔드 개발자 보조”
  - Page/Component/Hook/Service/Store/Type/i18n 구조를 모두 알고 있다는 가정하에,  
    새로운 기능이 추가될 때 필요한 파일/타입/라우트/컴포넌트를 제안하고 생성한다.

- 전제 / 입력 정보
  - `.cursor/rules/hanway-rule.mdc` : Frontend SW Architecture Standard 및 네이밍/코딩 규칙
  - `.cursor/rules/chakra-n-cmm-component-rule.mdc` : Chakra v3 & Common Component 사용 규칙 및 예제
  - 실제 `src/` 전체 코드 구조, 존재하는 서비스/훅/스토어/타입/페이지 등을 항상 우선 참고

- 말투 & 응답 스타일
  1. 규칙 우선: “이 프로젝트의 규칙에 맞는지”를 먼저 검토한 뒤 코드를 제안
  2. 단계적 제안: 한 번에 모든 것을 만들지 않고, **타입 → 서비스 → 훅 → 스토어 → UI** 순으로 나누어 진행
  3. 차이/영향 설명: 변경이 기존 구조에 어떤 영향을 주는지 간단히 설명
  4. 코드 외 설명: 테스트 방법, 스토리, i18n 리소스 위치 등을 함께 제안

### 2.3 작은 단위로 나누어 요청하기 (FE 버전)

백엔드에서 “CRUD 전체를 한 번에 생성하지 말고, List 조회 → DTO → Mapper → Service → Controller 순으로 나눈다”는 원칙과 동일하게,  
프론트엔드에서도 다음과 같이 **작은 단위**로 나누어 코드 어시스턴트를 사용한다.

예: 새로운 Portal 설정 화면을 만든다고 할 때

1. **Type 정의**
   - 예: `src/types/portal/newFeature.ts`에 필요한 DTO 인터페이스부터 정의 요청
2. **서비스 계층 작성**
   - 예: `src/services/portal/newFeatureService.ts`에서 Endpoint 상수(`services/endpoint.ts`)와 Axios 호출 작성
3. **데이터 Fetching 훅 작성**
   - 예: `src/hooks/portal/useNewFeature.ts` 에 React Query 기반 훅 생성
4. **상태 관리(Zustand) 필요 시 작성**
   - 예: `src/stores/portal/newFeatureStore.ts` 정의
5. **컨테이너/프리젠테이션 컴포넌트 작성**
   - 예: `src/pages/portal/newFeature/index.tsx`(Container), `components` 디렉터리 하위 Presentational 컴포넌트
6. **라우터/레이아웃 반영**
   - `src/routers/portal/router.ts`, `index.tsx`에 경로 추가
7. **i18n 리소스 및 UI 미세 조정**
   - `/public/locales/{ko,en}/portal.json` 등에 텍스트 추가 후 화면 확인

이 과정을 “한 번에 해달라”고 요청하기보다는,  
**각 단계마다 코드 어시스턴트와 상호작용하며 점진적으로 완성**하는 것이 유지보수성과 검증 측면에서 유리하다.

---

## 3. 회사 내 향후 계획 (Frontend)

백엔드 도입 계획과 동일한 큰 틀 안에서, 프론트엔드를 위한 구체적인 계획은 다음과 같다.

1. **프론트엔드 전용 교육 세션 정례화**
   - 주제 예시:
     - “Chakra v3 + Hw UI Kit + React Hook Form 조합으로 폼 화면 만들기”
     - “React Query + Axios + Zustand 패턴을 코드 어시스턴트로 빠르게 세팅하기”
     - “기존 Chakra v2 스타일을 v3 + 토큰 기반으로 마이그레이션”

2. **시범 기능(POC) 선정 후 집중 적용**
   - 예: Portal 설정 메뉴의 신규 화면, Workbox 신규 리스트, Board의 일부 뷰 등
   - 해당 기능에 대해 **AI 사용 전/후 개발 리드타임·버그율·리뷰 시간** 등을 측정하여 효과를 정량화

3. **프롬프트 템플릿 & 베스트 프랙티스 축적**
   - `docs/Frontend_Prompt.md`와 본 문서에 축적된 예시들을 기반으로,  
     “프론트엔드 개발자가 자주 쓰는 프롬프트 템플릿”을 정리 및 공유

4. **FE 코드 리뷰 문화와 연계**
   - PR 템플릿에 “AI 도움 여부 / 어떤 프롬프트를 사용했는지 / 주의한 규칙(토큰, Hw 컴포넌트 등)”을 간단히 기록하도록 하여  
     AI 활용 흔적을 남기고, 리뷰어가 포인트를 쉽게 파악하도록 지원

---

## 4. 결론

프론트엔드 교육을 통해, 한웨이 2.0 FE 레포의 구조와 규칙(Architecture Standard, Chakra v3 & Common Components, Zustand/React Query 패턴 등)을  
코드 어시스턴트에게 명확히 전달하는 것이 얼마나 중요한지 확인하였다.

이제 개발자는 “코드를 대신 써주는 도구”가 아닌,  
**“우리 FE 아키텍처를 학습한 시니어 보조 개발자”로서 코드 어시스턴트를 활용**해야 한다.

본 문서(FrontEnd 가이드)와 기존 BackEnd 가이드를 함께 활용하면,  
한진정보통신 전사 차원에서 Backend/Frontend 전 영역에 걸쳐 일관된 AI 증강 개발 문화를 정착시킬 수 있을 것이다.

---

## 5. AI 증강 개발 개요 (Frontend 관점)

### 5.1 프론트엔드에서 AI 코드 어시스턴트가 특히 유용한 영역

- 반복적인 UI 패턴 구현
  - 리스트 + 검색 영역 + Pagination
  - 모달/Drawer + Form + Validation
  - 상세 보기 + 탭 구성(HwTabs 사용)
- 타입/DTO 정의 및 동기화
  - Swagger/OpenAPI(JSON) 기반 TypeScript 인터페이스 생성
  - FE/BE 간 DTO 스키마 차이 검출 및 보정
- 데이터 흐름 템플릿
  - React Query 쿼리 키 설계
  - HTTP 서비스 인터페이스 + Axios 호출 래퍼
  - Zustand 스토어 초기 상태 및 액션 정의
- 다국어(i18n) 처리
  - 화면 텍스트를 i18n 리소스로 추출, `t('key', { ns })` 형태로 치환
- 문서화
  - 페이지/컴포넌트/훅/서비스 역할 설명 주석
  - 사내 위키/Markdown 문서 자동 생성

### 5.2 프론트엔드 개발 패러다임 전환

- 기존: “개발자가 모든 코드를 직접 작성 → 단위 기능을 하나씩 구현”
- 전환: “개발자는 요구사항/아키텍처/규칙을 정의 → 코드 어시스턴트가 초안을 생성 → 개발자가 검토·수정·테스트”

특히 이 레포처럼 UI 토큰/공용 컴포넌트/디렉터리 구조가 엄격한 프로젝트는  
**“규칙을 잘 정의된 프롬프트로 제공하고, 어시스턴트가 이를 지키게 하는 것”**이 핵심이다.

---

## 6. Frontend SW Architecture Standard

Backend SW Architecture Standard를 FE에 맞게 정리하면 다음과 같다.  
기본 원칙은 `.cursor/rules/hanway-rule.mdc`에 정의된 내용을 따른다.

### 6.1 프로젝트 개요

- 목적: 그룹웨어(조직도, 전자결재, 포털, 공통, 다중 게시판, 업무함, 관리자 등)의 프론트엔드를 개발
- Tech Stack
  - React 18 (Vite, TypeScript, SWC)
  - Chakra UI v3 (Custom Theme + Tokens)
  - 공용 Hw UI Kit 컴포넌트 (`src/components/uiKit`, 기타 hw\* 컴포넌트)
  - Zustand (상태 관리), Axios, TanStack Query (데이터 패칭)
  - React-i18next (다국어), CKEditor(리치 텍스트), react-hook-form + Yup(폼 검증)

### 6.2 FE 데이터 흐름 (표준 패턴)

**Page/Container → Hook(Data Fetching) → Service(HTTP Client) → Backend API → Store(Zustand) → Presentational UI**

- Page/Container (`src/pages/...`)
  - 라우트 엔트리. 비즈니스 로직 최소화, Hook/Store/Presentational 컴포넌트를 조합
- Hook (Data Fetching, `src/hooks/...`)
  - TanStack Query 기반. `useXxx` 형태로 네트워크/캐시/에러 핸들링 담당
- Service (HTTP Client, `src/services/...`)
  - Axios 인스턴스(`services/http.ts`) 사용. Endpoint 상수(`services/endpoint.ts`) 기반으로 호출
  - 인터페이스/구현 분리 권장 (`IExampleService` + `exampleService.ts`)
- Store (Zustand, `src/stores/...`)
  - 전역 상태 관리. Data Fetching Hook을 직접 호출하지 않음 (hanway-rule 규칙)
  - 초기 상태/액션/리셋 로직을 명확히 정의
- Types (`src/types/...`)
  - 백엔드 API DTO/응답 타입 정의. interface 사용, any 지양
- Presentational Components (`src/components/...`)
  - 비즈니스 로직 없이 UI 표현에 집중. 공용 Hw 컴포넌트 및 Chakra v3 토큰 사용

---

## 7. Naming Conventions & Coding Standards (FE)

### 7.1 파일/폴더 네이밍 (hanway-rule 요약)

- Page(Container): camelCase, `[bizFunction]/index.tsx`
- Tab: `[BizName]Tab.tsx`, 해당 Page의 `components` 폴더 하위
- Presentational Component: camelCase, Page 또는 공용 `components` 내에 위치
- Hook: `useXxx.ts` (camelCase, use 접두사)
- Store(Zustand): `[bizName]Store.ts`
- Service: `[bizName]Service.ts`
- Utility: camelCase (`formatDate.ts` 등)
- Style: kebab-case (`global-style.scss`)
- URL: kebab-case, 디렉터리 경로 기반 (`/portal/setting/basic-information`)
- **index.tsx / index.ts**를 “재수출용 배럴 파일”로 별도 생성하지 않는다. (Page의 엔트리 index는 예외)

### 7.2 변수/함수/컴포넌트 네이밍

- 컴포넌트: PascalCase (`UserProfile`)
- 변수: camelCase (`userName`)
- 상수: UPPER_CASE (`API_BASE_URL`)
- 함수: camelCase (`fetchUserData`)
- 상태 변수(Zustand): camelCase (`userToken`, `isLoading` 등)

### 7.3 코딩 스타일 (TypeScript & React)

- 객체 타입은 `interface`, 단순 타입은 `type` 사용
- `any` 사용 금지, 필요 시 `unknown` 또는 구체적인 타입
- 함수 반환 타입 명시
- 함수형 컴포넌트 + Arrow Function 사용, Class Component 금지
- Presentational Component는 **Named Export** 사용, Page는 default export 허용
- Self-closing 태그 활용 (`<Button />`)

### 7.4 이벤트 핸들러 규칙

- 네이밍: `handleXxx` (예: `handleSubmit`, `handleChangeKeyword`)
- UI 이벤트 핸들러는 반드시 `useCallback`으로 메모이즈
- 커스텀 데이터 전달 시 Curried Handler 사용

```ts
// Memoized Event Handler
const handleChangeKeyword = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  setKeyword(e.target.value)
}, [])

// Curried Event Handler
const handleClickRemoveUser = useCallback(
  (userId: string) => () => {
    setUserList((prev) => prev.filter((user) => user.userId !== userId))
  },
  []
)
```

---

## 8. Frontend 아키텍처 & 디렉터리 구조

### 8.1 최상위 구조

- `src/assets` : 이미지, 아이콘, 스타일(SCSS), 폰트 등
- `src/components` : 재사용 가능한 공용 UI 컴포넌트(Hw UI Kit, Layout 단위 컴포넌트 등)
- `src/hooks` : 커스텀 훅 및 Data Fetching 훅(React Query)
- `src/layouts` : FO/MGR 레이아웃, 공통 헤더/푸터/사이드바
- `src/pages` : 실제 라우트에 매핑되는 Page/Tab/Presentational UI
- `src/services` : HTTP Client/서비스 레이어 (Axios 래퍼)
- `src/stores` : Zustand 상태관리
- `src/types` : 타입 정의 (DTO, 응답 모델, 공통 타입)
- `src/utils` : 유틸리티 함수, 헬퍼
- `src/routers` : FO/BO/MGR 등 라우팅 설정
- `src/theme.ts` : Chakra v3 토큰 기반 테마 정의

### 8.2 기능별 하위 구조 (Biz Function)

- `approval/` : 전자결재
- `portal/` : 포털 & TODO & 통합검색
- `board/` : 게시판
- `workbox/` : 업무함
- `mgr/` : 관리자 (approval/portal/common/board/workbox 하위 포함)
- `common/` : 공통 기능

각 기능은 `hooks/pages/services/stores/types` 하위에 동일한 Biz 이름으로 모아 관리한다.

---

## 9. Frontend 개발 가이드

### 9.1 Chakra v3 & Common Component Usage Guide 준수

`.cursor/rules/chakra-n-cmm-component-rule.mdc`에 정의된 규칙은 FE 개발의 핵심이다.

- UI 컴포넌트 우선순위
  1. `src/components/uiKit` 하위 Hw\* 컴포넌트
  2. `src/components` 하위 공용 컴포넌트
  3. `src/components/uiKit/ui` 하위 컴포넌트
  4. 마지막 수단으로 순수 Chakra UI 컴포넌트

- 토큰 기반 스타일링
  - width/height/size 등 크기 관련 prop: `theme.tokens.sizes` 값 사용
  - margin/padding/gap/position 등 간격 관련 prop: `theme.tokens.spacing` 값 사용
  - color/bgColor 등 색상: `theme.tokens.colors` 값 사용
  - border/shadow/opacity/font/textStyle 등: 각 토큰 그룹 사용
  - `100%` 대신 `full`, `100vh` 대신 `vh` 사용
  - px/%/rem 직접 사용 금지 (토큰으로 치환)
  - Stack 계열 spacing 대신 `gap` 사용

- Tree UI는 반드시 `HwTreeView`/`TreeNode` 사용
- Border는 `border='solid'` + `borderWidth='thin|light|md'` 조합으로 표현

새로운 화면을 코드 어시스턴트에게 생성시키는 경우,  
반드시 프롬프트에 **“Chakra v3 & Common Component Usage Guide를 지키고, 토큰만 사용해라”**라고 명시해야 한다.

### 9.2 Form 개발 가이드 (react-hook-form + Yup)

- Validation은 반드시 Yup 스키마로 정의 후 `yupResolver` 사용
- 폼 입력은 Hw\* 컴포넌트의 `hookFormed` prop 활용 (`HwInput`, `HwSelect`, `HwRadioGroup`, `HwCheckboxGroup` 등)
- 라벨/필수 표시: `HwText label="..." required` 사용
- `FormProvider`와 `<form onSubmit={onSubmit}>` 패턴 고정

### 9.3 데이터 패칭 & 상태 관리

- React Query
  - `useQuery` / `useMutation` 사용, Query Key는 의미 있는 배열로 정의 (`['portal', 'favoriteList']` 등)
  - API 호출은 서비스(`services/portal/...Service.ts`) 레이어에만 위치
  - 응답 타입은 `src/types/...`에 정의된 인터페이스 사용

- Zustand
  - 비동기 호출 직접 수행 금지 (Hook/Service를 통해 데이터 주입)
  - `stores/root.ts`의 `create`/`resetAllStores` 패턴 활용
  - `authStore`처럼 persist/devtools를 적절히 조합

---

## 10. Frontend Test 가이드(방향)

현재 레포에는 본격적인 FE 테스트 코드가 많지 않거나, 도입 초기 단계이다.  
향후 FE 테스트 프레임워크(예: Vitest + React Testing Library)를 도입할 때를 대비한 원칙을 정의한다.

1. **테스트 대상 우선순위**
   - 비즈니스 로직이 많은 Hook/Zustand Store
   - 복잡한 Form Validation 로직
   - 권한/라우팅 제어(PrivateRoute, 메뉴 권한 로직)

2. **패턴**
   - Backend와 동일하게 **Given-When-Then** 구조
   - 테스트 메서드 네이밍: `test[대상메서드또는기능명]`

3. **데이터 준비**
   - 테스트 데이터는 코드 내부에서 직접 생성 (외부 파일/DB 의존 X)
   - Zustand Store는 `resetAllStores()`로 초기화 보장

4. **코드 어시스턴트 활용**
   - “이 Hook의 시나리오별 테스트 케이스를 Given-When-Then 형식으로 제안해줘”
   - “이 Zustand Store의 액션별 테스트를 작성해줘” 와 같이 요청하여 초안을 얻고,  
     실제 환경에 맞게 수정 및 실행한다.

---

## 11. AI Code Assistant 설정 & 활용 원칙

### 11.1 계정/모델 설정

- 사용 가능한 모델:
  - claude-3.7-sonnet(-thinking), gpt-4.5, o1, o3-mini, deepseek-v3, gemini-2.0-pro-exp 등
- 프론트엔드 작업은 **맥락과 규칙을 잘 따르는 모델**을 우선 사용하고,  
  성능/속도에 따라 보조 모델(o3-mini 등)을 병행한다.

### 11.2 보안 & 민감 정보

- 실제 서비스 도메인·계정·토큰 등 민감정보는 프롬프트에 직접 포함하지 않는다.
- 예시 코드나 설명에는 가상의 값 혹은 `.env`/환경변수 이름만 사용하도록 한다.

---

## 12. Prompt 작성 가이드 (Frontend)

Backend 보고서의 Prompt 기법을 FE에 맞게 정리한다.

### 12.1 명시적 화제 전환

- “이제부터는 한웨이 2.0 프론트엔드 레포 기준으로만 답해줘.”
- “지금까지 말한 것은 버리고, 새로 시작해서 Portal 즐겨찾기 기능만 집중하자.”

### 12.2 명료하고 직접적인 작업 지시

나쁜 예:

> “전자결재 화면 전체 만들어줘”

좋은 예:

> “`src/hooks/approval/useApprovalHistory.ts`를 추가해서,  
> `Endpoint.ApprovalGetEapDocumentHistoryList`를 호출하는 React Query 훅을 만들어줘.  
> 타입은 `src/types/approval` 하위에 새 파일을 만들어 정의하고, 페이지는 나중에 만든다.”

### 12.3 Prompt 포맷팅

- **입력**: 참고 파일/타입/컴포넌트/Endpoint 경로를 명시
- **출력 형식**:
  - “새 파일 전체 코드를 Markdown 코드블록으로 보여줘”
  - “기존 파일에서 수정할 부분만 SEARCH/REPLACE 형식으로 설명해줘”

### 12.4 예시 제시

- “`useFavorites` 훅처럼, `useWorkboxList` 훅을 만들어줘.  
   Query Key, 에러 처리, mutation 패턴도 비슷하게 맞춰줘.”

### 12.5 Divide and Conquer / Prompt Chaining

- Step 1: 타입 정의
- Step 2: 서비스 인터페이스 및 구현
- Step 3: Data Fetching 훅
- Step 4: Store (필요시)
- Step 5: 페이지/컴포넌트

각 단계마다 코드를 검토·수정하면서 다음 단계를 요청하는 방식으로,  
코드 품질과 구조를 통제한다.

### 12.6 생각의 사슬(Chain of Thought) 활용

- “어떤 파일들을 수정해야 하는지 먼저 목록을 나열해주고,  
  그 다음 각 파일별 변경 내용을 순서대로 설명한 뒤, 마지막에 코드를 제시해줘.”

---

## 13. Project 적용 실습 시나리오 (Frontend)

네 가지 대표 실습 시나리오를 정의한다.

### 13.1 시나리오 1: Portal 즐겨찾기 기능 확장

- 목표
  - `useFavorites` 훅(`src/hooks/portal/useFavorite.ts`)과 연계하여,  
    새 “즐겨찾기 통계/정렬” 화면을 Portal 설정 하위에 추가

- 단계
  1. 타입 정의: `src/types/portal/favoriteStats.ts`
  2. 서비스: `src/services/portal/favorite/favoriteStatsService.ts`
  3. 훅: `src/hooks/portal/useFavoriteStats.ts`
  4. 페이지: `src/pages/portal/settings/favoriteStats/index.tsx`
  5. 라우트: `src/routers/portal/router.ts`, `index.tsx` 수정
  6. i18n: `public/locales/ko/portal.json`, `public/locales/en/portal.json` 갱신

### 13.2 시나리오 2: Workbox 신규 작업 등록 화면

- 목표
  - Workbox에 신규 업무 등록 화면을 추가하고, 공용 Hw\* Form 컴포넌트/토큰을 사용하는 패턴을 연습

- 단계
  1. Endpoint 정의 및 타입 작성
  2. Service/Hook 생성
  3. Form 페이지 컨테이너 + Presentational 컴포넌트 분리
  4. Validation 규칙을 Yup으로 정의하고, 에러 메시지를 i18n으로 처리

### 13.3 시나리오 3: Chakra v2 → v3 마이그레이션 리팩토링

- 목표
  - 일부 레거시 컴포넌트에서 남아 있는 Chakra v2 스타일 사용을, v3 + 토큰 기반으로 전환
  - `.cursor/rules/chakra-n-cmm-component-rule.mdc`의 예제를 활용

- 단계
  1. 코드 어시스턴트에 “이 컴포넌트의 Chakra v2 props를 찾아서 v3 props로 전환해줘” 요청
  2. gap/spacing/px 값 등을 토큰으로 치환
  3. 공용 Hw 컴포넌트로 대체 가능한 부분 찾아 리팩토링

### 13.4 시나리오 4: 에러/로딩 처리 공통화

- 목표
  - 여러 페이지에 흩어져 있는 로딩/에러 UI를 HwProcessBar, HwNotify, 글로벌 에러 핸들러로 통일

- 단계
  1. 현재 로딩/에러 처리 방식 조사
  2. 코드 어시스턴트에 “HwProcessBar + Notify를 사용하는 표준 에러/로딩 패턴 템플릿” 요청
  3. 주요 페이지에 순차 적용

---

## 14. summary

- 이 문서는 한웨이 2.0 프론트엔드 레포의 실제 구조와  
  `.cursor/rules/hanway-rule.mdc`, `.cursor/rules/chakra-n-cmm-component-rule.mdc`에 정의된 규칙을 통합하여,  
  코드 어시스턴트를 프론트엔드 개발에 적용하는 방법을 정리한 가이드이다.
- 핵심은 **“아키텍처 규칙 + 공용 컴포넌트 + 데이터 흐름 패턴”을 AI에게 명확히 전달하고,  
  작은 단위로 나누어 반복적으로 협업하는 것**이다.

---

## 15. AI Coding Assistant가 잘하는 것 (Frontend)

- 패턴 기반 UI 코드 생성 (리스트, 폼, 모달, 탭 등)
- 타입/DTO/인터페이스 작성 및 스키마 기반 코드 생성
- 기존 코드 스타일/토큰/컴포넌트 사용 패턴을 학습한 후, 유사한 코드 생성
- i18n 리소스 추출 및 다국어 문구 템플릿 생성
- 반복적 리팩토링(이벤트 핸들러 정리, Hook 추출, Props 정리 등)

---

## 16. AI Coding Assistant를 잘 활용하기 위한 TODO

1. 프론트엔드 개발자들이 자주 사용하는 프롬프트를  
   `docs/Frontend_Prompt.md` 및 본 문서 하단에 지속적으로 추가
2. 신규 기능 개발 시, PR에 “AI 코드 어시스턴트 사용 여부 및 주요 프롬프트” 기록
3. Chakra v3 & Common Component Rule 위반 사례를 정리하고,  
   코드 어시스턴트가 자동으로 수정 제안을 하도록 실험
4. 향후 FE Test 코드 도입 시, 테스트 템플릿/패턴도 코드 어시스턴트 기반으로 정립

---

본 문서는 프론트엔드 기준으로 Chakra v3 & Common Component Usage Guide와  
Frontend SW Architecture Standard(hanway-rule)를 충실히 반영하여 작성하였다.

---\_\_\_\_--------

## 1. 기본 정보

- 기능명: 결재문서 신규 등록(기안/임시저장)
- API URL: /app/approval/gnrl/createEapDocument
- HTTP Method: POST
- 소속 모듈/레이어(패키지 경로 기준):
  com.hanjingroup.hanway.approval.app.eap.gnrl.document.controller.EapDocumentController
- 호출 주체: 전자결재 작성 화면의 “저장/기안” 요청(사용자 인증 필요)

## 2. 기능 설명

- 한 줄 요약: 기안자가 입력한 결재문서 본문·결재선·열람자·첨부·관련문서를 저장하고 후속 결재/알림
  세팅을 수행한다.
- 상세 설명: 컨트롤러에서 요청 DTO를 검증·초기화하고 로그인 사용자 정보를 등록자 정보에 주입한 뒤,
  서비스가 문서번호/작성정보 세팅 → 본문·속성 데이터 저장 → 첨부/관련문서/결재선·열람자·의견/이력/
  권한 → Google 파일 권한 부여 → 결재 후처리(알림, TLOver/UNDO 타이머, 메일 발송 배치 등록) 순으로
  트랜잭션 내 처리한다.

## 3. 선행 조건 (Pre-condition)

- 인증/인가 요구사항: Spring Security @AuthenticationPrincipal UserPrincipalDetails 필요. 별도
  Role 제한 없음.
- 필요한 사전 데이터 상태:
  - 요청 필수값(양식 ID, 문서제목, 문서상태, 결재선 목록, 문서속성 입력값 등)이 DTO 검증(@Valid)
    및 커스텀 BindingResultHelper를 통과해야 함.
  - documentLineList, documentAttributeInputData가 null/빈 컬렉션이 아니어야 이후 로직 NPE 방지.
  - tempApprovalDocId, approvalId 등 키 값은 호출 측에서 생성 후 전달하는 구조(코드 내 생성
    없음).
- 기타 선행 조건: 업로드된 임시파일은 UploadConstants.UPLOAD_TEMP 위치에 존재해야 정상 복사 처
  리됨.

## 4. 후행 조건 (Post-condition)

- 메인 엔티티 상태 변화: eap_document, eap_document_main에 신규 행 생성.
- 연관 엔티티/이력/로그 테이블 변화:
  - 본문/히스토리: eap_document_contents, eap_document_contents_his, eap_document_his 삽입.
  - 속성값: eap_document_attribute_mapping 및 value 테이블(DATETIME/GENERAL) 삽입.
  - 결재선/대상/결재자: eap_document_line(결재선), eap_line_target, eap_approver 생성.
    (docStatus = ‘D’일 때 기안자/다음 결재자 세팅)
  - 열람자: eap_show 생성(+부서 열람자 자동 추가 조건 처리).
  - 첨부: eap_document_file, eap_document_file_mapping 삽입 및 임시파일 → 승인경로 복사/삭제.
  - 관련문서: eap_document_relation, 필요 시 eap_document_relation_viewer 생성.
  - 의견: 기안 의견 존재 시 eap_document_opinion 등록.
  - 알림/배치: eap_mail_feed_alarm 등에 알림 작업 enqueue,
    approvalCommonBatchService.requestSendEmailBatch 비동기 호출 예약.
  - TLOver/UNDO 타이머: 설정에 따라 대상자별 시간 정보 삽입.
- 외부 시스템/큐/이벤트 발행 여부:
  - Google Cloud Storage 객체 복사·삭제(cmGcsService).
  - Google Drive 권한 부여(cmApprovalFilePermissionService) – 본문 Google File ID가 있을 때.
  - 이메일 발송 배치 호출(내부 배치 서비스).

## 5. 입력 데이터 (Request DTO 기준, 필드 상세 X)

### 5-1. 주요 Request DTO 목록

| 구분(직접/간접)          | DTO 파일명/클래스명                                                  | 패키지/경로                   | 역할/설명                                    |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------- | -------------------------------------------- |
| 직접                     | CreateEapDocumentReqDto                                              | ...document.dto               | 문서 생성 전체 요청(본문, 속성, 결재선, 열람 |
| 자, 첨부, 관련문서 포함) |
| 간접                     | CreateEapDocumentInputDataReqDto                                     | ...document.dto               | 문서속성 입력값 컬렉션 요소                  |
| 간접                     | CreateEapLineTargetReqDto                                            | ...line.dto                   | 결재선 대상(결재자/합의자 등) 정의           |
| 간접                     | CreateEapShowReqDto                                                  | ...line.dto                   | 열람자 목록 정의                             |
| 간접                     | CreateEapDocumentFileReqDto                                          | ...documentfile.dto           | 첨부파일 메타정보                            |
| 간접                     | CreateEapDocumentRelationReqDto                                      | ...document.dto               | 관련문서 매핑 요청                           |
| 간접                     | GetDocumentAttributeListReqDto                                       | ...attribute.dto              | 양식별 문서속성 조회                         |
| 간접                     | GetDraftEmployeeInfoReqDto                                           | ...document.dto               | 조직도 정보 조회(기안자/대상자 정보 보       |
| 정)                      |
| 간접                     | GetEapConfigSetupReqDto / GetDocNoReqDto                             | ...mng.basic.dto / ...cmm.dto | 회사 문서번호                                |
| 설정 조회 및 채번        |
| 간접                     | CreateEapDocumentContentsReqDto / CreateEapDocumentContentsHisReqDto |
| ...documentcontents.dto  | 본문/본문이력 저장 요청                                              |
| 간접                     | CreateEapDocumentHisReqDto                                           | ...document.dto               | 문서 변경이력 저장                           |
| 간접                     | CreateEapDocumentFileMappingReqDto                                   | ...documentfile.dto           | 첨부-문서 매핑 저장                          |
| 간접                     | CreateEapDocumentRelationViewerReqDto                                | ...document.dto               | 관련문서 열람권한 매핑                       |
| 간접                     | CreateEapApproverReqDto                                              | ...line.dto                   | 결재자 엔티티 생성                           |
| 간접                     | CreateEapShowReqDto                                                  | ...line.dto                   | 열람자 엔티티 생성                           |
| 간접                     | CreateEapOpinionReqDto                                               | ...opinion.dto                | 기안 의견 저장                               |
| 간접                     | CreatePostEapDocumentReqDto                                          | ...document.dto               | 결재 후처리(doPost) 파라미터                 |
| 간접                     | CreateTLOverTimeReqDto / CreateUNDOTimeReqDto                        | ...document.dto               | TLOver/UNDO 타이머 등                        |
| 록                       |

### 5-2. DTO 상속/구성 구조

- BaseDto
  - CreateEapDocumentReqDto
    - 포함: CreateEapDocumentInputDataReqDto (List)
    - 포함: CreateEapLineTargetReqDto (documentLineList)
    - 포함: CreateEapShowReqDto (showList)
    - 포함: CreateEapDocumentFileReqDto (fileList)
    - 포함: CreateEapDocumentRelationReqDto (relationList)

## 6. 연동 인터페이스 (API 호출 목록)

| 구분(내부/외부)                                            | 호출 대상(API/시스템)                                                                 | 호출 방식            | 목적                              | 호출 시점(처리 단계) |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------- | --------------------------------- | -------------------- |
| 내부                                                       | eapDocumentTrxMapper.insertEapDocument, insertEapDocumentMain                         | DB write             | 문서/문서메인                     |
| 저장                                                       | 초기 저장                                                                             |
| 내부                                                       | eapMngBasicMapper.selectEapConfigBasicSetup                                           | DB read              | 문서번호 채번 정책 조회           | 저장 초              |
| 반                                                         |
| 내부                                                       | cmmApprovalService.getApprovalDocNoWithFormId                                         | Service              | 문서번호 채번(상시 채번 설정      |
| 시)                                                        | 저장 초반                                                                             |
| 내부                                                       | eapDocumentAttributeMappingService.\*, ...VluDatetimeService, ...VluGeneralService    |
| Service/Mapper                                             | 양식 속성값 저장                                                                      | 본문/속성 처리       |
| 내부                                                       | cmmUploadService.fileUploadPath                                                       | Service              | 경로 계산                         | 첨부 처리            |
| 외부(GCS)                                                  | cmGcsService.copyObject, deleteObject                                                 | GCS API              | 임시첨부를 승인 경로로 이동 및 삭 |
| 제                                                         | 첨부 처리                                                                             |
| 내부                                                       | eapDocumentFileService.createEapDocumentFile,                                         |
| eapDocumentFileMappingService.createEapDocumentFileMapping | Service/Mapper                                                                        | 첨부 메타 및 매핑 저 |
| 장                                                         | 첨부 처리                                                                             |
| 내부                                                       | eapDocumentRelationService.createEapDocumentRelation, createEapDocumentRelationViewer |
| Service                                                    | 관련문서 및 열람자 매핑                                                               | 관련문서 처리        |
| 내부                                                       | eapDocumentLineService.createEapDocumentLineAll                                       | Service              | 결재선/대상 저장                  | 결재선 처            |
| 리                                                         |
| 내부                                                       | eapApproverService.createEapApprover                                                  | Service              | 결재자 생성(기안자/다음결재자)    | 결재선               |
| 처리                                                       |
| 내부                                                       | eapShowService.createEapShow                                                          | Service              | 열람자 저장                       | 열람자 처리          |
| 내부                                                       |

eapDocumentContentsService.createEapDocumentContents, ...HisService.createEapDocumentContentsHis,
eapDocumentHisService.createEapDocumentHis | Service | 본문 및 이력 저장 | 본문 처리 |
| 내부 | eapDocumentOpinionService.createEapDocumentOpinionAll | Service | 기안 의견 저장 | 의견
처리 |
| 외부(Google Drive) | cmApprovalFilePermissionService.approvalFilePermission | Google Drive 권한
부여 | 결재자/열람자 Google 문서 권한 추가 | 권한 부여 단계 |
| 내부 | eapDocumentMainMapper.selectPerusalGoogleFileIdList, selectApproverGoogleIdList,
selectPerusalGoogleIdList | DB read | 권한 부여 대상 조회 | 권한 부여 단계 |
| 내부 | eapDocumentTrxMapper.insertTargetTLOverTime, insertTargetUNDOTime | DB write | TLOver/
UNDO 타이머 설정 | doPost 후처리 |
| 내부 | eapDocumentTrxMapper.insertTargetMailFeedAlarm | DB write | 메일/피드 알림 대기등록 |
doPost 후처리 |
| 내부 | approvalCommonBatchService.requestSendEmailBatch | Service (비동기 Executor) | 실제 메일
발송 요청 | doPost 후처리 |
| 내부 | generateApprovalHtmlPdfFile (조건 시) | Service | PDF/HTML 생성 | doPost 후처리(완결/부결
시) |

## 7. 출력 데이터 및 결과 (Response DTO 기준, 필드 상세 X)

- 주요 Response DTO 파일명/클래스명: ApiResponse<Integer>
- 패키지/경로: com.hanjingroup.hanway.common.base.entity.ApiResponse
- 역할/설명: 처리 건수(주로 삽입 성공 시 합산된 int)만 body로 반환하는 래퍼.
- HTTP Status Code별 의미:
  - 200/201: 정상 저장 완료(본문 int 결과 포함)
  - 400: 요청 DTO 유효성 오류(BindingResultHelper) 또는 BizException 매핑 시
  - 401/403: 미인증/권한없음(Spring Security)
  - 404: 코드상 별도 처리 없음 (미사용)
  - 500: 내부 예외(파일 복사 실패, DB 오류 등)

## 8. 처리 흐름

1. Controller (EapDocumentController.createEapDocument):
   - @PostMapping("/createEapDocument")
   - @Valid + BindingResultHelper.checkBindingResult → reqDto.init()
   - 로그인 사용자에서 registerEmployeeNo, registerEmployeeDepartmentId 주입
   - eapDocumentService.createApprovalDocument(reqDto, userPrincipalDetails) 호출 → ApiResponse
     래핑 후 반환.
2. Service – 사전 세팅 (createApprovalDocument):
   - 양식 속성 목록 조회 (GetDocumentAttributeListReqDto)
   - 조직도 조회로 등록자 정보 보정(GetDraftEmployeeInfoReqDto,
     eapCommonService.selectDraftEmployeeInfo) 및 기본값 세팅(setDefaultData)
   - 첨부/관련/의견 개수 계산, 문서번호 채번(회사 설정이 상시채번 && docNo 미지정 시
     cmmApprovalService.getApprovalDocNoWithFormId) 및 본문 내 문서번호/등록일 치환
3. Service – 본문/기본 저장:
   - eapDocumentTrxMapper.insertEapDocument, insertEapDocumentMain
   - 문서속성 값 저장(createDocumentAttributeData)
   - 본문/본문이력/문서이력 저장 (eapDocumentContentsService, ...HisService,
     eapDocumentHisService)
4. Service – 첨부 처리:
   - fileType 'G' → 메타/매핑만 생성
   - 기타 → 임시경로→승인경로 복사(cmGcsService.copyObject), 임시 삭제, 파일/매핑 등록
5. Service – 관련문서 처리:
   - eapDocumentRelationService.createEapDocumentRelation
   - 결재선 대상·열람자별 관련문서 열람권한 추가(createEapDocumentRelationViewer)
6. Service – 결재선/열람자/결재자:
   - createDocumentLineList → eapDocumentLineService.createEapDocumentLineAll (결재선 + 대상)
   - docStatus='D'일 때 createDraftApprover(기안자 승인 상태 W), createNextApprover(다음 결재자
     승인 상태 I)
   - 열람자 리스트 존재 시 createShowList; 부서열람 설정 시 부서 자동 추가
7. Service – 의견: 기안 의견 존재 시 eapDocumentOpinionService.createEapDocumentOpinionAll
8. Service – Google 권한: 본문 Google File ID 리스트 조회 후 결재자/열람자 이메일 기준 권한 추가
   (cmApprovalFilePermissionService.approvalFilePermission)
9. Service – 후처리(doPostEapApprovalProcess):
   - TLOver/UNDO 타이머 저장, 알림 설정 조회 후 메일/피드 알림 대기등록
   - 메일 승인 사용 시 배치 요청(approvalCommonBatchService.requestSendEmailBatch) 비동기 실행
   - 문서 상태가 완료/부결 등일 때 PDF/HTML 생성 트리거
10. 응답: 삽입 건수 합계(int)를 ApiResponse body로 반환.

의사 시퀀스:

Client -> Controller:createEapDocument
-> BindingResultHelper.validate
-> reqDto.init + set register info
-> Service:createApprovalDocument
-> 조회:양식속성/조직도/번호채번
-> insert eap_document + eap_document_main
-> save attributes / contents / histories
-> handle files (copy GCS, save meta+mapping)
-> save relations (+relation viewers)
-> save approval line/targets -> approvers (draft/next)
-> save show list (+auto dept) -> opinions
-> grant Google file permissions
-> doPostEapApprovalProcess (TLOver/UNDO, alarms, email batch)
-> ApiResponse(result)

## 9. 예외 처리 및 에러 메시지 목록

| 상황                                      | 에러코드(있으면)          | 예외 타입/발생 위치                               | 사용자 메시지(있으면) | 처리 방식                          |
| ----------------------------------------- | ------------------------- | ------------------------------------------------- | --------------------- | ---------------------------------- |
| 요청 DTO 유효성 오류                      | 없음                      | Controller BindingResultHelper.checkBindingResult | Validator 설정        |
| 에 따름                                   | 예외 발생 → 트랜잭션 롤백 |
| (본 API 경로 내 명시적 BizException 없음) | -                         | -                                                 | -                     | @Transactional로 발생 시 전부 롤백 |
| 도중 파일/외부 연동 실패                  | 없음(일반 예외)           | 파일 복사/권한 부여/메일 배치 등                  | 메시지 없음           |
| Exception 발생 시 롤백                    |

※ create 경로에서는 명시적 BizException이 없어, 실제 에러 메시지는 전역 예외 처리 설정에 따름.

## 10. 권한 제어

- 필요한 Role/권한 코드: 명시적 어노테이션 없음(일반 사용자 인증만 필요).
- 데이터 소유자/작성자 제한 여부: 생성 시 작성자 정보는 로그인 사용자로 강제 주입.
- 권한 부족 시 동작: Spring Security 미인증/인가 실패 시 401/403 (전역 필터 처리, 코드 내 메시지
  없음).

## 11. 추가로 유의할 점

- 트랜잭션: createApprovalDocument 전체가 @Transactional(rollbackFor=Exception.class)이지만, 내부
  비동기 메일 배치 실행은 별 스레드로 처리되어 롤백과 무관.
- 필수 컬렉션 null 체크 없음: documentLineList, documentAttributeInputData, showList, fileList,
  relationList가 null이면 NPE 가능. 호출측에서 빈 리스트라도 전달 필요.
- 문서번호 채번: 회사 설정 numberingDt="1" && docNo 미지정일 때만 채번; 나머지는 호출 측이 docNo
  제공해야 함.
- Google Drive 권한 부여: 본문 Google File ID가 없거나 이메일이 없는 결재자/열람자는 권한이 부여되
  지 않음.
- 첨부 처리: fileType='G'는 복사 없이 메타만 저장; 그 외는 임시경로 파일 존재 여부 필수.
- 알림/메일: doPost에서 알림 설정 테이블 값에 따라 Mail/Feed가 eap_mail_feed_alarm에 적재되고 별도
  배치가 실제 발송 수행.
