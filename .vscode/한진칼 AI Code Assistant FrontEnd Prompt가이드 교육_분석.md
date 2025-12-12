# 한진칼 AI Code Assistant FrontEnd 가이드 교육_분석 및 설계 의도  
Ver. 1.0

---

## 1. 문서 작성 배경

### 1.1 왜 별도의 “분석/해설” 문서를 만드는가

`docs/한진칼 AI Code Assistant BackEnd 가이드 교육.docx` 는  
단순한 기능 설명이 아니라 **“AI Code Assistant를 전제로 한 백엔드 개발 방식”**을 정의한 문서이다.  

`hanway-front` 프론트엔드 레포도 마찬가지로,

- 실제 코드 구조(`src/` 전체),  
- 프론트엔드 전용 규칙 파일  
  - `.cursor/rules/hanway-rule.mdc` (Frontend SW Architecture Standard)  
  - `.cursor/rules/chakra-n-cmm-component-rule.mdc` (Chakra v3 & Common Component Guide)  

을 “LLM이 이해하고 따라야 하는 시스템 프롬프트”로 사용한다.  

그래서 첫 번째 문서 `docs/한진칼 AI Code Assistant FrontEnd 가이드 교육.md`는  
**“개발자+AI 둘 다 보는 가이드”**를 목표로, 백엔드 교육 보고서 포맷을 FE로 옮겨온 것이다.  

이번에 추가로 만드는 이 문서는,

- 왜 그런 구조로 썼는지,  
- 두 규칙 파일을 어떻게 해석하고 녹였는지,  
- 실제 코드와 어떤 상관관계를 고려했는지  

를 **분석/해설 관점**에서 정리한 “메타 가이드”이다.  
즉, 사람이 봤을 때도 “아, 이 문서가 단순 요약이 아니라 규칙과 코드 구조를 꽤 깊게 해석해서 쓴 거구나”를 알 수 있도록 하는 것이 목적이다.

---

## 2. Frontend SW Architecture Standard (hanway-rule.mdc) 분석

### 2.1 이 규칙 파일의 역할

`.cursor/rules/hanway-rule.mdc`는 이 레포에서 **가장 중요한 시스템 프롬프트** 중 하나이다.

- 프로젝트 목적, 기술 스택, 계층 구조를 정의하고  
- 파일/폴더/URL/컴포넌트/함수 네이밍 규칙을 명시하며  
- React/TypeScript 코딩 표준, 이벤트 핸들러 패턴, 디렉터리 구조까지 포함한다.  

LLM 입장에서 보면,

> “이 레포는 일반적인 React 프로젝트가 아니라,  
>  내가 따라야 하는 커스텀 ‘아키텍처 규칙’이 있는 프로젝트다”

라는 것을 알게 해주는 문서이고,  
그래서 FrontEnd 가이드 교육 문서(본편)에서 **6~9장**에 이 내용을 그대로 번역/재구성했다.

### 2.2 파일/폴더 네이밍 규칙을 강조한 이유

hanway-rule는 파일 네이밍을 매우 강하게 요구한다. 예:

- Page(Container): `[bizName]/index.tsx`  
- Hook: `useXxx.ts`  
- Store: `[bizName]Store.ts`  
- Service: `[bizName]Service.ts`  
- URL: kebab-case (`/portal/setting/basic-information`)  
- index.tsx / index.ts 를 “배럴 파일”로 쓰지 말 것  

이렇게 한 이유:

1. **자동 생성 코드와의 충돌 방지**  
   - AI가 코드를 생성할 때, 중복 파일명/애매한 index 파일이 많으면 import 경로 충돌, 모듈 순환 참조가 쉽게 생긴다.  
   - 명확한 규칙을 주면, “새 페이지를 만들어줘”라고 했을 때 LLM이 파일 경로를 잘못 추측하는 위험이 줄어든다.

2. **기능별 구조 가시성**  
   - approval/portal/board/workbox/mgr/common 등 비즈니스 도메인별로 모든 리소스를 정리하면,  
     사람/AI 모두가 “어느 기능에 속한 코드인지”를 바로 알 수 있다.  

그래서 FE 가이드 본문에서는,

- 7장 `Naming Conventions & Coding Standards`에 이 규칙을 그대로 옮기고,  
- 8장에서 디렉터리 구조와 biz function별 위치까지 동시에 설명했다.  

문서만 읽어도 “LLM이 새 기능을 만들 때 어떤 경로에 파일을 생성해야 되는지” 추론할 수 있게 하기 위함이다.

### 2.3 React & TypeScript 코딩 규칙을 따로 정리한 이유

hanway-rule는 다음을 명시한다.

- interface/type 역할 분리  
- 함수형 컴포넌트 + Arrow Function, 클래스 컴포넌트 금지  
- Presentational Component는 named export, Page는 default export 허용  
- any 지양, 반환 타입 명시  

이는 사실 “일반적인 TypeScript + React 베스트 프랙티스”에 가깝지만,  
LLM 입장에서는 **명시적으로 적어주지 않으면 자주 어긴다**.

그래서 FE 가이드에서는:

- 7.3/7.4 절에서 타이핑 규칙, 이벤트 핸들러(useCallback/Curried Handler) 패턴을 예제 코드까지 포함해서 정리했다.  
- 특히 이벤트 핸들러를 “handleXxx + useCallback + 커리”로 명시한 것은,  
  LLM이 `onClick={() => ...}` 같은 인라인 함수를 막 찍어내지 않도록 유도하는 목적이 크다.

이렇게 “왜 이렇게 썼는지”를 문서에 짧게라도 언급해야,  
향후 이 규칙을 변경하거나 완화할 때도 근거를 추적하기 쉽다.

### 2.4 디렉터리 구조를 텍스트로 다시 그린 이유

hanway-rule에는 `src/` 디렉터리 구조가 설명되어 있다.  
FE 가이드 본문 8장에서는 이것을 다시 요약해서 적었다:

- assets / components / hooks / layouts / pages / services / stores / utils / types  
- approval/portal/board/workbox/mgr/common 기능별 하위 구조  

이는 두 가지 이유 때문이다.

1. **LLM이 전체 Tree를 직접 읽지 않아도 되도록 “요약된 아키텍처 지도” 제공**  
2. **사람이 문서만 보고도 프로젝트 구조를 파악하고, LLM에게 설명할 때 재사용 가능**  

결국 이 문서는 “코드 + 규칙 파일 + 문서”를 하나의 패키지로 만드는 역할을 한다.

---

## 3. Chakra v3 & Common Component Guide 분석

### 3.1 이 규칙 파일의 핵심

`.cursor/rules/chakra-n-cmm-component-rule.mdc`는 다음을 강하게 요구한다.

1. **공용 Hw 컴포넌트 우선 사용**  
   - HwInput, HwSelect, HwRadioGroup, HwCheckboxGroup, HwTreeView, HwTabs 등  
   - Chakra v3 컴포넌트는 “마지막 수단”  

2. **테마 토큰 기반 스타일링 강제**  
   - `theme.tokens.sizes`, `theme.tokens.spacing`, `theme.tokens.colors` 등  
   - px/%/rem 직접 사용 금지, 100% 대신 full, 100vh 대신 vh  

3. **React Hook Form + Yup에 최적화된 폼 패턴**  
   - hookFormed prop  
   - FormProvider, handleSubmit, yupResolver 패턴  

4. **Chakra v2 → v3 마이그레이션 룰**  
   - spacing → gap, cursor prop 금지, border 표현 방식 통일  

이것은 단순 스타일링 가이드를 넘어서 **“디자인 시스템 + 폼 프레임워크”**를 규정하는 문서이다.

### 3.2 왜 FE 가이드 본문에서 “요약형”으로 넣었는가

chakra-n-cmm-component-rule.mdc에는 Hw 컴포넌트별 상세 예제 코드가 대량으로 들어있다.  
예: HwInput, HwInputGroup, HwNumberInput, HwCheckbox/Group, HwSelect, HwTabs, HwColorPicker, HwDrawer 등.

이 전체를 교육 보고서에 그대로 옮기면:

- 문서 길이가 지나치게 길어지고  
- 핵심 규칙(공용 컴포넌트 우선, 토큰 사용, RHF 패턴)이 희석된다.  

그래서 FE 가이드 본문에서는:

- 9.1절: UI 컴포넌트 우선순위 + 토큰 룰 + border/gap 규칙을 **핵심만 요약**  
- 9.2절: 폼 개발 가이드에서 RHF + hookFormed + HwText/required 패턴을 정리  

즉, “규칙 + 패턴”을 강조하고,  
세부 예제(Hw 컴포넌트 개별 API)는 실제 코드(`src/components/uiKit/...`)와 규칙 파일을 직접 보도록 남겨두었다.

이렇게 한 이유:

1. **교육 문서는 개념/패턴 중심**  
   - 너무 많은 코드 예제가 들어가면 “레퍼런스 문서”가 되어 읽기 어렵다.  
2. **레포 자체가 이미 예제를 포함**  
   - 실제 Hw 컴포넌트 구현과 사용 예제가 코드에 있으므로,  
     교육 문서는 “어디를 봐야 하는지 안내하는 역할”에 집중했다.

필요하다면 별도의 “Hw UI Kit 사용 가이드” 문서를 만들어  
각 컴포넌트별 API/예제를 정리할 수 있도록 여지를 남겨둔 상태다.

---

## 4. 실제 코드 구조와의 매핑

이 문서를 작성할 때 레포에서 특히 참고한 부분은 다음과 같다.

### 4.1 라우팅 구조 (`src/routers`)

- `src/routers/helper.ts`  
  - ROUTER_CONFIG, flattenRoutes, PUBLIC_ROUTES, 메뉴 코드 매핑(MenuCode/Map)  
- `src/routers/index.tsx`  
  - boRouters / foRouters / publicRouters  
- 각 도메인별 router.ts, index.tsx (approval/board/workbox/portal/main/mgr/…)  

FE 가이드 6~8장(아키텍처와 디렉터리 구조)을 쓸 때 이 구조를 반영했다.

예를 들어:

- FO/MGR 이원 구조  
- PrivateRoute가 OAuth + 메뉴권한을 담당, ResponsiveLayout이 FO PC/모바일을 스위칭  
- Portal/Board/Approval/Workbox/MGR 각각 별도의 라우트 설정  

이 내용을 문서에 녹여 놓으면,  
LLM이 “새 화면을 어디에 붙여야 하는지”를 추론하기 훨씬 쉬워진다.

### 4.2 HTTP Client & 상태관리 (`src/services/http.ts`, `src/stores/authStore.ts`)

- Axios 인스턴스에서  
  - baseURL 결정 로직(로컬 vs 배포)  
  - Authorization Bearer 토큰, Accept-Language 헤더 설정  
  - 9100/9101/9102 등 인증 오류 처리, 토큰 리프레시 큐 처리  
- authStore에서  
  - account, accessToken, menuList, menuCdList, currentMenuCategory, isLoggingIn 관리  

이 구조를 보고:

- FE 가이드에서 “데이터 흐름”을 Page → Hook → Service → HTTP Client → Backend → Store → UI 로 정의했고,  
- 인증/메뉴 권한 로직을 PrivateRoute와 연계해서 설명했다.  

이렇게 한 이유는,

- **백엔드 가이드에서 Controller → Service → Mapper → DB로 계층을 나눈 것과 같은 역할**을  
  프론트엔드에서도 보여주기 위함이다.

### 4.3 Query Client (`src/services/queryClient.ts`)

- QueryClient 기본 옵션(refetchOnWindowFocus=false, retry=false)  
- invalidateQueries, cancelAllQueries, forceClearMutations 유틸 함수  

이를 보고 FE 가이드에서:

- React Query를 “데이터 패칭 계층”으로 명시하고,  
- 서비스 레이어와 쿼리 훅이 분리되도록 설명했다.  

LLM이 새 훅을 만들 때도 이 패턴을 따르게 하기 위함이다.

---

## 5. FrontEnd 가이드 문서 구성 설계 의도

### 5.1 백엔드 교육 보고서의 구조를 그대로 가져온 이유

백엔드 문서의 큰 틀:

1. 개요  
2. 교육 소감 & 페르소나 분석  
3. 회사 내 향후 계획  
4. 결론  
… (아키텍처, 테스트, Prompt 가이드, Hands-on 시나리오 등)  

프론트엔드 문서도 똑같은 틀을 사용했다. 이유는:

1. **개발자 교육 경험 통일**  
   - FE/BE 개발자 모두 같은 형식의 문서를 보면,  
     서로의 영역을 이해하고 공통 언어로 대화하기 쉬워진다.  
2. **AI 시스템 프롬프트도 일관성 확보**  
   - LLM에게 “Backend Guide / Frontend Guide”를 둘 다 제공할 때,  
     구조가 비슷하면 모델이 내용을 분류·기억하기 쉽다.

그래서 FrontEnd 가이드 교육 문서는 백엔드 문서의 섹션을 그대로 차용하되,  
내용만 FE 코드와 규칙에 맞게 재작성했다.

### 5.2 페르소나(Proxy AI)를 명시적으로 정의한 이유

단순히 “이 규칙을 지켜라”만 적으면,  
LLM은 여전히 일반적인 React 프로젝트처럼 행동할 수 있다.

그래서 2장에서:

- 입력 정보(규칙 파일 + src 구조)를 명시  
- 역할(한웨이 2.0 FE 시니어 보조 개발자)로 정의  
- 응답 스타일(규칙 우선 검토, 단계적 제안, 영향 설명)을 구체화  

했다.  
이렇게 하면, 실제 프롬프트에서:

> “Proxy AI 페르소나를 활성화해서, 아래 규칙을 지키며 답해줘”

라는 식으로 사용할 수 있고,  
코드 어시스턴트의 답변 품질과 일관성을 높일 수 있다.

### 5.3 “작은 단위로 나누어 요청하라”를 강조한 이유

백엔드 문서에서 강조했던 것처럼,  
프론트엔드에서도 “한 번에 CRUD + 화면 + 테스트 다 만들어줘”라고 하는 것은 위험하다.

그래서 2.3 및 12/13장에서:

- 타입 → 서비스 → 훅 → 스토어 → UI → 라우트 → i18n 순으로 나누는 패턴을 반복해서 언급했다.  

이렇게 하면,

- 사람 입장에서는 검토/리뷰 포인트가 줄어들고  
- LLM 입장에서도 맥락을 더 잘 유지하면서 코드를 개선해 나갈 수 있다.

---

## 6. Prompt 가이드/실습 시나리오 설계 의도

### 6.1 Prompt 가이드 (12장)

Prompt 가이드는 다음 목적을 갖고 설계했다.

1. **LLM에게 규칙을 적극적으로 상기시키는 패턴 제공**  
   - 명시적 화제 전환, 규칙 재언급, 출력 형식 지정 등  
2. **FE 개발자가 실제로 자주 쓰게 될 형태로 작성**  
   - “useFavorites 훅처럼 ~ 만들어줘”  
   - “Endpoint.XXX를 사용하는 서비스+훅을 만들어줘”  

또한, Backend 문서의 Prompt 기법(명시적 화제 전환, 예시 제시, Chain-of-Thought 등)을 그대로 가져와  
FE 예제로만 바꿔 넣었다.  
이는 백엔드와 프론트엔드 개발자가 **같은 Prompt 사고방식**을 공유하도록 하기 위함이다.

### 6.2 Hands-on 시나리오 (13장)

실습 시나리오는 “지금 레포에서 실제로 의미 있는 작업”을 기준으로 선정했다.

- Portal 즐겨찾기 확장 (사용 빈도 높은 기능)  
- Workbox 신규 작업 등록 (폼+리스트 패턴 연습)  
- Chakra v2 → v3 마이그레이션 (레거시 정리)  
- 에러/로딩 처리 공통화 (사용자 경험과 직결)  

각 시나리오에서 단계별로:

1. 타입/서비스/훅  
2. 스토어(필요시)  
3. 페이지/컴포넌트  
4. 라우트/i18n  

을 나누어 진행하도록 되어 있는데,  
이는 실제 현업에서 AI를 사용해도 **리스크를 최소화하면서 점진적으로 적용**할 수 있는 흐름이다.

---

## 7. 마무리: 이 분석 문서를 어떻게 활용할 것인가

이 문서는,

- “왜 이런 구조로 FrontEnd 가이드를 썼는지”를 설명하는  
  **설계/분석용 문서**이고,
- 나중에 규칙을 바꾸거나, 다른 팀/새 프로젝트에 동일한 패턴을 적용할 때  
  참고할 수 있는 근거 자료이다.

구체적인 활용 예:

1. **규칙 변경 시 검토 체크리스트**  
   - hanway-rule 또는 chakra-n-cmm-component-rule를 수정할 때  
     이 문서의 해당 섹션(2,3장)을 함께 보고, 어떤 의도를 유지/폐기해야 할지 판단한다.

2. **새 프로젝트에 FE 아키텍처 이식**  
   - 한웨이 2.0 구조를 다른 프로젝트에 적용할 때,  
     이 문서의 아키텍처/Prompt/시나리오 설계 관점을 재사용할 수 있다.

3. **AI Code Assistant 설정/튜닝 시 참고**  
   - LLM에게 규칙 파일과 함께 이 분석 문서까지 읽혀서,  
     “규칙 그 자체”뿐 아니라 “규칙을 만든 이유/철학”까지 이해시키는 데 사용할 수 있다.

요약하면,

> 첫 번째 문서(FrontEnd 가이드)는 “무엇을 할 것인가”에 대한 설명이고,  
> 본 문서는 “왜 이렇게 하도록 설계했는가”에 대한 해설이다.

두 문서를 함께 사용하면,  
사람과 AI 모두가 한진KAL 그룹웨어 프론트엔드 개발 문화를 더 깊이 이해하고,  
일관된 방식으로 코드를 작성할 수 있게 된다.  

