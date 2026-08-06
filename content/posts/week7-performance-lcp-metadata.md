---
title: "성능 최적화, 그리고 트레이드오프"
date: "2026-08-06T09:00:00.000Z"
description: "hero 이미지 하나가 LCP의 93%(7,904ms)를 먹고 있었다. next/image로 7.5MB를 130kB로 줄이고, 동적 metadata가 slow API를 기다리는 비용을 서버 호출 계수와 크롤러 TTFB로 재보며, 무엇을 바꾸고 무엇을 안 바꿨는지 근거와 함께 정리했다."
category: ["Next.js"]
---

## 들어가며

Lighthouse를 돌렸더니 LCP가 8.5초로 나왔다. 성능 점수를 끌어내리는 범인은 명확했다. 이번 과제가 hero 자리에 일부러 7.5MB짜리 큰 이미지를 심어놨기 때문이다. 그런데 "뭘 고칠까"로 바로 넘어가지 않고, 먼저 측정 조건부터 고정했다. 손을 대기 전과 후를 같은 자로 재지 못하면, 나중에 "빨라진 것 같다"는 느낌만 남고 무엇이 얼마나 바뀌었는지는 말할 수 없기 때문이다.

측정 조건은 이렇게 하였다.

- viewport 모바일 412×823 (Lighthouse 모바일 프리셋)
- CPU 4x slowdown, network Fast 4G, Disable cache
- `pnpm build && pnpm start`
- 크롬 게스트 프로필 (익스텐션 영향 제거)
- FCP·LCP·CLS를 5회 측정해 raw 5개 + 중앙값 + 최소 + 최대까지 기록

## hero 이미지 하나가 LCP의 93%였다

측정 구간은 네 구간으로 쪼갰다. 서버 응답 대기(TTFB), 이미지 요청 시작 대기(load delay), 이미지 전송(load duration), 화면에 그려지기까지(render delay).

![Before: LCP 4구간. Resource load duration 7,904ms가 8.5초의 93%를 차지한다](/week7-performance-lcp-metadata/lcp-breakdown-before.jpg)

이미지 전송 구간(Resource load duration)이 7,904ms, LCP의 93%였다. 원본 hero 이미지를 열어보니 7.5MB짜리 3840×2160 JPEG였다. 화면엔 잘해야 1280px 폭으로 그려지는데 원본을 통째로 내려받고 있었다.

그래서 `next/image`로 바꿨다. 여기서 내린 결정들:

**`sizes`로 슬롯 폭만 정했다.** 이 부분은 처음에 잘못 짚었다. 전송량을 줄이려면 내려받을 이미지 폭에 상한을 직접 정해야 하는 줄 알고, 문서 결정표에 "srcset 후보는 상한 1920px"이라고 적어뒀다. 한참 뒤에야 `sizes`가 후보 목록을 자르는 값이 아니라, 브라우저에게 "이 이미지가 화면에서 차지할 폭"만 알려주는 값이라는 걸 알았다. 폭만 정해주면 브라우저가 그 폭 × DPR 이상인 최소 후보를 srcset에서 알아서 고른다. 그래서 결국 손으로 잡던 상한을 걷어내고 `sizes="(min-width: 1280px) 1280px, 100vw"`만 남겼다. 모바일 412×2.625 = 1082px면 1200w 후보를, 데스크탑 1280 슬롯 DPR 1이면 1920w를 받는 식이다.

**게다가 그 "상한 1920px"이라는 서술부터가 틀렸다.** `next.config`에서 `deviceSizes`를 좁힌 적이 한 번도 없다. 그러니 기본 후보(640·750·828·1080·1200·1920·2048·3840)가 그대로 srcset이 됐고, 전송 상한은 1920이 아니라 원본 해상도(3840)였다. 레티나 데스크탑(1280×2=2560)은 2048이나 3840 후보를 받을 수 있다. 실제로 상한을 낮추려면 `deviceSizes`를 직접 좁혀야 하는데 누락되어 있었다. 

**포맷은 AVIF 우선, 압축률은 quality 75(기본값).**

```ts
// next.config.ts: 포맷 협상만 켰다. deviceSizes는 기본 후보 그대로.
images: { formats: ["image/avif", "image/webp"] }
```

AVIF는 같은 화질에 JPEG보다 50% 이상 작다. quality는 기본값 75를 그대로 썼는데, hero 사진 기준 육안으로 손실이 거의 안 보였다. 실무였다면 이 값은 디자이너와 눈으로 같이 확인하는 게 좋을 것이라 생각된다.

접근성은 뒤늦게 챙겼다. `next/image`로 바꿀 때 원래 `<img>`에 있던 `alt=""`를 그대로 들고 왔다. 배너를 장식 이미지로 보고 빈 alt를 둔 셈인데, 화면 전체를 채우는 hero라 스크린리더에 아무것도 안 읽히는 게 맞나 싶었다. 이틀 뒤 "따뜻한 자연광이 드는 공간에 진열된 브라운 가죽 토트백…"처럼 실제 장면을 묘사하는 alt로 채웠다.

결과는 이랬다.

| 지표 | Before 중앙값 | After 중앙값(raw) |
| --- | --- | --- |
| LCP | 8.5s (8.5~8.5) | **0.8s** (0.8, 0.9, 0.8, 0.8, 0.8) |
| FCP | 0.5s | 0.5s (0.4, 0.5, 0.5, 0.5, 0.5) |
| CLS | 0 | 0 |

hero 이미지 전송은 7.5MB → 130kB(AVIF)로 줄었다.

![After: hero 전송이 130kB, load duration 270ms로 줄었다](/week7-performance-lcp-metadata/network-after.jpg)

스켈레톤 추가도 과제 요구사항이라 `HeroSkeleton`을 넣었는데, 새 요소가 붙는 만큼 이걸로 CLS가 새로 생기지 않도록 신경 썼다. hero와 같은 박스(`aspect-ratio` 동일)를 미리 잡아둬, 스켈레톤에서 실제 이미지로 교체될 때 아래 콘텐츠가 밀리지 않게 했다.

## priority가 fetchpriority를 안 붙였다 (Next 16)

4단계에서 After를 재측정하다 Lighthouse가 낯선 안내를 띄웠다. LCP 이미지에 `fetchpriority="high"`가 안 붙어 있다는 것이다. 1단계에서 분명 `next/image`의 `priority`를 줬는데도.

공식 문서를 보고 원인을 알았다. Next 16.0.0부터 `next/image`의 `priority` prop이 deprecated됐고, 하는 일이 쪼개졌다. 13.x~15.x까지는 `priority` 하나가 eager 로딩 + preload `<link>` 방출 + `fetchpriority="high"`를 한 번에 묶어줬는데, 16에서는 `priority`가 앞의 둘까지만 하고 `fetchpriority`는 안 붙인다.

그래서 deprecated된 `priority` 대신 `preload` + `fetchPriority="high"`로 분리해 명시했다.

```tsx
// HeroSection.tsx: Next 16에서 priority가 fetchpriority를 안 붙이므로 직접 나눠 준다.
<Image
  src="/images/week-07/hero-original.jpg"
  alt="따뜻한 자연광이 드는 공간에 진열된 브라운 가죽 토트백, 크림색 스니커즈, 니트 스웨터와 도자기 소품"
  fill
  sizes="(min-width: 1280px) 1280px, 100vw"
  preload
  fetchPriority="high"
/>
```

이걸 적용하니 LCP가 1.0s → 0.8s로 한 번 더 내려갔다. hero 요청의 우선순위가 높아진 결과다.

미세하게 악화된 항목도 같이 봤다.

| 항목 | Before | After | 판정 |
| --- | --- | --- | --- |
| LCP Element Render delay | 37ms | 50ms | 소폭 악화(+13ms) |
| document 전송 크기 | 8.2KB | 9.0KB | 소폭 악화(+0.8KB) |

document가 커진 건 `next/image`가 초기 HTML에 preload `<link>`와 여러 해상도 후보 `srcset`을 밀어넣기 때문이다. render delay가 늘어난 건 디코딩·레이아웃 경로 차이다. 둘 다 유지하기로 했다. 이미지 전송이 7,904ms → 270ms로 줄어든 이득(약 7.7초)에 비하면 +13ms·+0.8KB는 hero를 더 빨리·작게 받기 위한 의도된 트레이드오프라고 봤다.

## 동적 metadata가 slow API를 기다린 비용

상품 목록 페이지의 title·description·og:image를 URL 조건과 조회 결과로 동적 생성하게 했다. 문제는 이 데이터의 출처가 1.5초 걸리는 slow API라는 점이었다. 동적 metadata는 공짜가 아니고, 그 비용이 어디서 얼마나 새는지 확인해보았다.

먼저 비용을 줄이려고 설계한 부분. `generateMetadata`가 본문(`ProductListSection`)과 **같은 로더·같은 query factory**를 쓰게 해서, 둘이 만드는 GET URL을 똑같이 맞췄다.

```ts
// productListMetadata.ts: 본문과 같은 로더·query factory로 같은 GET URL을 만든다.
// → 같은 request 안에서 native fetch가 memoize되어 slow Route Handler를 한 번만 친다.
const query = resolveProductListQuery(await loadProductListParams(searchParams));
const queryClient = getQueryClient();
try {
  const result = await queryClient.fetchQuery(productQueries.list(query));
  return buildProductListMetadata(query, result);
} catch {
  return {}; // 조회 실패 시 루트 공통 metadata를 상속하게
}
```

URL을 같게 맞추면 Next의 native fetch memoization이 metadata 소비자와 본문 소비자를 한 호출로 합쳐준다. 실제로 그런지 서버 호출 계수를 찍어봤다. Route Handler GET에 임시 카운트 로그를 심고 `/products?scenario=slow`에 접속했더니:

```
[TEMP-COUNT] count: 1 ?sort=latest&page=1&pageSize=12&scenario=slow ua=node
[TEMP-COUNT] count: 2 ?sort=latest&page=1&pageSize=12&scenario=slow ua=node
[TEMP-COUNT] count: 3 ?sort=latest&page=2&... ua=Mozilla/5.0 ...
```

의도한 대로면 page=1은 한 번만 나가야 하는데 두 번 나갔다(count 1, count 2 둘 다 `ua=node`, 서버 발원). 원인을 바로 짚진 못했다. `generateMetadata`와 `ProductListSection`에 각각 실행 태그 로그를 더 심고 나서야, 두 번째 호출이 `generateMetadata`의 2번째 실행에 붙어 나온다는 걸 봤다.

참고로 세 번째 호출(count 3, page=2)은 문제가 아니다. 5주차에 붙여둔 다음 페이지 prefetch라 의도된 요청이다. 그러니 여기서 따질 건 page=1이 두 번 나간 것뿐이다.

두 번 호출된 이유는 이렇다. 서버는 `getQueryClient()`가 실행마다 새 QueryClient를 만든다(요청 간 캐시 오염을 막으려는 의도적 설계다). 그래서 1번째 실행이 채운 TanStack Query 캐시가 2번째엔 없다. 그럼 남는 건 native fetch memoization인데, 이건 "같은 렌더 작업 안에서" 같은 URL을 재사용해주는 장치다. 그런데 metadata가 느려서 Next가 스트리밍 metadata로 처리하는 순간, 2번째 실행은 본문과 별개의 렌더 작업으로 돈다. Next 입장에선 "아까 그 URL을 또 부른다"는 걸 알 방법이 없어 또 호출한다.

여기서 수정 방안을 두 개 적었고, **둘 다 적용하지 않았다.**

**방안 1. 목록 fetch에 Next Data Cache(`revalidate`) 부여.** 렌더 패스가 달라도 캐시 hit이 나서 서버 호출이 1회로 준다. 하지만 걸리는 문제가 많아 적용하기엔 무리라고 봤다.

- **신선도 지연이 겹친다.** Data Cache는 서버 전역 캐시라 SSR 시점에 이미 최대 60초 묵은 목록이 내려가고, 그 위에 클라이언트 `staleTime` 60s가 또 얹힌다. 사용자가 보는 데이터가 최악이면 ~2분 전 상태일 수 있다.
- **전 사용자 공유 캐시다.** 지금은 응답이 다 같아 안전하지만, 가격이 회원 등급별로 개인화되는 순간 남의 캐시가 샌다. 결국 "이 API는 영원히 비개인화"라는 조건이 코드에 암묵적으로 깔린다.
- **hit율이 낮다.** 캐시 키가 URL 전체라 검색어 조합마다 새 캐시가 생긴다. 이득 없이 저장소만 불어난다.

**방안 2. metadata의 slow 데이터 의존 축소.** title·description을 URL 조건만으로 만들고 og:image를 fallback으로 고정하면(=상품 이미지를 동적으로 안 불러오면) metadata fetch 자체가 사라진다. 스트리밍할 이유가 없어지니, 스트리밍 때문에 생긴 중복 호출도 함께 사라진다. 근본 해법은 이쪽이지만, 대신 og:image의 동적 생성을 아예 포기하는 셈이다.

지금은 응답이 개인화되지 않아 방안 1이 당장 이득이지만, 2,3번째 항목의 리스크를 안고 갈 정도는 아니라고 생각하였다. 또한 방안 2는 위에서 언급한 대로 og:image의 동적 생성을 아예 포기하는 셈이니 이것도 선택하지 않았다.

### 그 비용은 누가 치르나: 일반 UA vs facebookexternalhit

"metadata가 slow 데이터를 기다린 비용"이 실제 사용자에게 얼마나 체감되는지, UA만 바꿔 `curl -w`로 TTFB를 쟀다.

![일반 UA는 TTFB 5ms, facebookexternalhit는 1,514ms](/week7-performance-lcp-metadata/ua-timing.png)

| UA | TTFB | total |
| --- | ---: | ---: |
| 일반 브라우저 UA | ~0.005s | ~1.51s |
| `facebookexternalhit/1.1` | ~1.514s | ~1.52s |

일반 UA는 Next가 셸을 즉시 스트리밍하니 TTFB가 5ms, 느린 섹션은 Suspense로 뒤따라온다. 반면 크롤러 UA엔 스트리밍을 끄고 완성 문서를 다 만든 뒤 첫 바이트를 준다. 그래서 slow API의 지연 전체가 크롤러의 TTFB로 드러난다. total(완성 시점)은 양쪽이 같다. slow API를 기다린 비용은 크롤러 쪽에만 청구되고, 일반 사용자는 못 느낀다는 뜻이다.

이 스트리밍 metadata 때문에 태그가 붙는 위치도 평소와 다르다. 느린 `generateMetadata`를 안 기다리고 셸을 먼저 보낸 뒤, 준비되면 title·og·twitter 태그를 문서 끝(body)에 추가한다. 단 이건 JS를 실행하는 클라이언트(일반 브라우저·Googlebot) 얘기고, JS를 안 돌리는 크롤러엔 스트리밍을 꺼서 처음부터 `<head>`에 넣는다.

![정상 empty: 스트리밍 metadata 태그가 head가 아니라 body 끝에 붙는다](/week7-performance-lcp-metadata/metadata-streaming-empty.jpg)

### 정상 empty와 조회 실패는 다른 fallback을 탄다

metadata가 실패하면 어떻게 되는지도 확인했다. 서버 fetch base를 못 가게(`APP_ORIGIN=http://127.0.0.1:9`) 만들어 `fetchQuery`에서 NetworkError가 발생하게 하고, 그 에러를 catch해서 `{}`를 리턴해 루트 공통 metadata를 상속하여 아래와 같이 루트 metadata를 보이게 했다.

![metadata 조회 실패: 루트 공통 metadata로 상속](/week7-performance-lcp-metadata/metadata-failure.jpg)

이는 Next의 metadata 병합 규칙에서 나온다. metadata는 루트 layout → 하위 layout → page 순으로 위에서 아래로 shallow merge된다. 페이지가 어떤 키(title·description·og…)를 채우면 그 키만 부모 값을 덮고, 안 채운 키는 부모(루트) 값을 그대로 물려받는다.

## 찜 클릭에 카드 24개가 다 렌더됐다 (INP)

마지막은 상호작용 지연(INP)이었다. 이 현상을 위해 따로 제공된 페이지가 있었고, 그 페이지에서 상품 카드의 찜 버튼을 클릭할 때 문제가 있었다. 과제의 요구 사항대로 Performance 탭 Interactions track을 보니 processing duration이 96ms대로 길었다. React Profiler를 켜보니 이유가 나왔다. 찜 하나 누를 때마다 화면의 카드 24개가 전부 리렌더됐다.

![Before: 찜 한 번에 카드 24개가 전부 렌더된다](/week7-performance-lcp-metadata/inp-profiler-before.jpg)

원인은 selector 한 줄이었다. 카드마다 store에서 `wishlistIds` 배열 전체를 구독하고 있었다. 토글하면 새 배열 참조가 나오고, 24개 카드의 selector가 전부 "값이 바뀌었다"고 보고 다 리렌더됐다. 카드는 자기가 찜됐는지 여부(boolean)만 알면 된다. 따라서 아래와 같이 수정하였다.

```diff
- const wishlistIds = usePerformanceWishlist((state) => state.wishlistIds);
- const selected = wishlistIds.includes(product.id);
+ // 배열 전체가 아니라 자기 id의 boolean만 구독한다.
+ const selected = usePerformanceWishlist((state) =>
+   state.wishlistIds.includes(product.id),
+ );
```

![After: 찜한 카드 1개만 렌더, 나머지 23개는 회색(skip)](/week7-performance-lcp-metadata/inp-profiler-after.jpg)

| 구간 | Before(3회) | After(3회) |
| --- | --- | --- |
| input delay | 11, 15, 13ms | 8, 7, 8ms |
| processing duration | 105, 96, 96ms | **12, 12, 11ms** |
| presentation delay | 20, 24, 23ms | 32, 33, 33ms |

processing이 96ms → 12ms(중앙값)로 약 87% 줄었고, INP 전체는 대략 132ms → 53ms가 됐다. 적은 변경 치고는 큰 폭이다.

## 후기

이번 주엔 여러 최적화 시도와 측정법을 시도했다. next/image의 srcset·sizes로 후보 선택을 브라우저에 맡기는 법, LCP 요소에 preload·fetchPriority로 우선순위를 주는 법, Zustand selector를 좁혀 관계없는 리렌더를 걷어내는 법. 측정법은 LCP는 Lighthouse 5회에 Performance 패널의 4구간 분해, 전송 크기는 Network waterfall, INP는 Interactions track과 React Profiler, 서버 호출 수는 Route Handler 로그, 크롤러 지연은 `curl -w`로 UA만 바꿔 동작의 변화를 확인했다.

고칠 때마다 트레이드오프가 붙었다. hero 전송을 7.5MB에서 130kB로 줄이는 대가로 document가 0.8KB 늘고 render delay가 13ms 붙었다. metadata 스트리밍으로 생긴 page=1 중복 호출을 줄이려 두 방안을 검토했지만 트레이드오프를 비교하여 둘 다 적용하지 않았다. Data Cache는 서버 호출을 하나 줄여주는 대신 신선도 지연과 캐시 누수를 담보로 잡아서, 중복 호출을 걷어내는 근본적인 해법이라 볼 수 있는 동적 생성 제거는 og:image의 동적 생성을 통째로 포기해야 해서 적용하지 않았다. 공짜로 좋아지는 변경은 거의 없었다.

이번 과제에서 가장 예상 못 한 건 동적 metadata였다. title·og를 데이터로 채우겠다는 결정 하나가 metadata를 느리게 만들고, 느린 metadata는 스트리밍을 부르고, 스트리밍은 렌더 패스를 쪼개 같은 page=1을 한 번 더 부르고, 태그가 붙는 위치와 첫 바이트 타이밍마저 User Agent에 따라 갈렸다. 기능 하나 붙인 줄 알았는데 서버 호출 수와 크롤러 응답 시점까지 딸려 움직인 것이다. 측정하지 않았으면 이 연쇄를 끝까지 몰랐을 것이다.
