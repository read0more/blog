---
title: "레이어 분리는 AI에게, 검증은 나에게 — service·hook·UI로 가른 코드를 직접 리뷰로 붙잡기"
date: "2026-07-01T13:00:00.000Z"
description: "536줄짜리 상품 리스트 화면을 레이어로 가르는 일은 AI에게 시키고, 나는 그 결과를 직접 코드 리뷰로 검증했다. 그 과정에서 다시 그은 경계와 잡아낸 버그의 기록."
category: ["React", "리팩토링"]
---

## Overview

저번에는 이미 동작하는 체크아웃 화면을 앞에 두고 [무엇을 고치고 무엇을 그대로 둘지 판별](/posts/component-props-refactoring-bad-smell/)했다. 이번엔 한 발 더 나갔다. 한 파일에 **536줄**이 뭉쳐 있던 상품 리스트 화면(`ProductListPage.tsx`)을 **service · hook · UI 레이어로 가르는 작업 자체를 AI에게 시키고**, 나는 그 결과물을 **코드 리뷰와 테스트로 검증**하는 쪽으로 진행했다.

이번에는 **AI에게 지침(스킬)을 주어 시키고, 그 코드를 검수하는 방향**을 택했다. 

## 방향은 내가, 코딩은 AI가, 리뷰는 다시 내가

작업 흐름은 이랬다.

1. 발제에서 받은 기준으로 **검수용 스킬**을 먼저 작성했다.
2. 그 스킬에게 상품 리스트 분리를 시키고, 결과 요약본을 받았다.
3. 요약본을 훑은 후 실제 코드와 화면을 직접 보며 1차 리뷰를 했다.
4. 1차 리뷰에서 나온 것 중 지침에 반영할 만한 건 스킬 문서에 반영하고, 1차 리뷰의 내용을 수정 요청했다.
5. 두 번째 결과물의 요약본과 코드를 보며 2차 리뷰를 했다.
6. 2차 리뷰에서 나온 것 중 지침에 반영할 만한 건 스킬 문서에 반영하고, 2차 리뷰의 내용을 수정 요청했다.

아래는 AI 생성 코드를 직접 보고 1차 리뷰, 2차 리뷰에서 발견한 것들이다.

## 1차 리뷰 — 레이어 경계를 다시 그었다

### `services/`를 시켰는데 `api/`로 나왔다

스킬에는 데이터 접근 레이어를 `services/`에 두라고 적어뒀는데, AI는 `api/productApi.ts`로 만들었다. `utils`, `types`도 마찬가지로 단일 파일에 흩어져 있었다. 사소해 보이지만 지침과 결과가 어긋난 첫 신호였고, 스킬 권장 구조에 맞춰 디렉토리로 정리하게 했다.

### 데이터 패칭을 TanStack Query로

원래 `main`의 목록 패칭은 `useEffect` 안에서 `fetch` 후 `setState` 하는 형태였는데, **정리 함수(cleanup)가 아예 없었다.**

```tsx
// before(main) — ignore 플래그도 AbortController도 cleanup return도 없다
useEffect(() => {
  const fetchProducts = async () => {
    setIsLoading(true);
    // ...
    const res = await fetch(`/api/products?${params.toString()}`);
    const data: ProductListResponse = await res.json();
    setProducts(data.products);
  };
  fetchProducts();
}, [category, minPrice, maxPrice, sortBy, searchQuery, page, inStockOnly]);
```

필터를 빠르게 바꾸면 먼저 보낸 요청이 나중에 도착해 **응답 순서가 뒤바뀌는 race condition**이 존재했다. 이걸 손으로 `ignore` 플래그나 `AbortController`를 붙여 막을 수도 있었지만, 로딩 상태·재시도까지 라이브러리에 맡기려 **TanStack Query를 택했다.** 앞서의 race condition은 TanStack이 `queryFn`에 넘겨주는 `AbortSignal`을 `fetch`까지 그대로 흘려보내 해결됐다. 필터가 빠르게 바뀌어 이전 요청이 낡으면, TanStack이 그 `signal`로 진행 중이던 `fetch`를 중단(abort)한다. 그래서 뒤늦게 도착한 낡은 응답이 최신 목록을 덮어쓰지 못한다.

```tsx
// after — TanStack이 넘겨준 AbortSignal을 fetch로 전달 → 낡은 요청은 abort되어 최신 응답만 남는다
export async function fetchProducts(
  query: ProductQuery,
  options?: { signal?: AbortSignal },
): Promise<ProductListResponse> {
  const params = buildProductSearchParams(query);
  const res = await fetch(`/api/products?${params.toString()}`, {
    signal: options?.signal,
  });
```

```tsx
// hooks/useProducts.ts
const { data, isLoading, isFetching, error, refetch } = useQuery({
  queryKey: ["products", query],
  queryFn: ({ signal }) => fetchProducts(query, { signal }),
  placeholderData: keepPreviousData,
});
```

여기서 함께 구조분해한 `refetch`는 뒤의 [일시적 오류 후 재시도](#다시-화면을-만지며--세-가지-점검)에서, 새로고침 없이 같은 쿼리만 다시 부르는 데 쓴다.

### FilterPanel — "재사용"이 아니라 SRP로 쪼갠다

여기서 AI와 판단이 갈렸다. AI는 `FilterPanel`을 통째로 둔 채 요약본에 이렇게 적어놨다.

> FilterPanel을 Category/PriceRange/InStock으로 더 쪼개기 → 다른 곳에서 재사용되지 않음. 재사용이 생기면 그때 쪼갠다.

**나는 이 판단이 틀렸다고 봤다.** 쪼갤지 말지를 "재사용되는가"로만 재면, 재사용이 없는 컴포넌트는 아무리 여러 일을 해도 영원히 안 쪼개진다. `FilterPanel`은 카테고리 선택·가격 범위·재고 토글이라는 **명백히 다른 세 가지 일**을 한 컴포넌트가 떠안고 있었고, 그 증상으로 **props가 9개**까지 늘어 있었다.

```
// before — FilterPanel 하나가 받던 props 9개
category, minPrice, maxPrice, inStockOnly,
onCategoryChange, onMinPriceChange, onMaxPriceChange, onInStockToggle, onReset
```

재사용 여부가 아니라 **SRP 위배**를 기준으로 `CategoryFilter` / `PriceRangeFilter` / `InStockToggle`로 가르도록 요청했다. 남은 `FilterPanel`은 자식을 배치하고 초기화 버튼만 가지게 됐다.

```tsx
// after — FilterPanel은 조합만, props는 2개
export default function FilterPanel({
  children,
  onReset,
}: {
  children: ReactNode;
  onReset: () => void;
}) {
  return (
    <section className="filter-panel">
      {children}
      <button className="reset-button" onClick={onReset}>필터 초기화</button>
    </section>
  );
}
```


그런데 AI가 하필 "재사용"을 기준으로 든 데는 이유가 있었다. 검수 스킬에는 컴포넌트를 언제 추출하는지가 사실상 "같은 상태·로직이 두 곳 이상 반복될 때", 즉 **재사용 중심으로만** 적혀 있었고, 거기에 "성급한 추상화는 피하라"는 원칙이 겹쳐 있었다. 그러니 AI는 지침을 충실히 따라 "한 곳에서만 쓰는 `FilterPanel`을 쪼개면 성급한 추상화"라고 결론지었다. 단일 사용이라도 SRP를 위반하면 쪼갠다는 규칙이 지침에 없었으니, 재사용을 분리의 **필요조건**으로 오해할 여지가 그대로 열려 있었다.

그래서 이번엔 코드만 고치지 않고 **지침 자체를 고쳤다**(인트로에서 말한 "지침에 반영"이 이 경우다). 분리의 판단 축을 재사용이 아니라 SRP·응집도로 바꾸고, 한 줄을 못 박았다.

> "지금 한 군데서만 쓰니까 안 쪼갠다"는 분리하지 않을 근거가 못 된다 — 판단 기준은 재사용이 아니라 SRP·응집도다.

돌이켜보면 AI가 틀리게 판단했다기보다, **틀린 지침을 정확히 따른 것**에 가까웠다.

### SearchSortBar도 세 가지 일을 하고 있었다

같은 눈으로 보니 `SearchSortBar`도 상품명 검색 input, 정렬 select, view mode select라는 서로 다른 셋을 한데 묶고 있었다. `SearchInput` / `SortSelect` / `ViewModeSelect`로 나누고, `SearchSortBar`는 이 셋을 **합성으로 조립하기만 하는 6줄짜리 컴포넌트**로 남기도록 했다.


### 디바운스 없이 매 타이핑마다 요청

상품명 검색과 가격 범위 입력에 디바운스가 없어, **키 입력 한 번마다 네트워크 요청**이 나갔다. `useDebouncedValue` 훅을 두고, **서버로 나가는 값에만** 디바운스가 걸리게 했다. 카테고리·정렬·페이지처럼 즉시 반영돼야 자연스러운 값은 디바운스에서 빼도록 했다.

```tsx
// hooks/useProductFilters.ts — 네트워크로 가는 값만 디바운스
const debouncedSearchQuery = useDebouncedValue(state.searchQuery, SEARCH_DEBOUNCE_MS);
const debouncedMinPrice = useDebouncedValue(state.minPrice, SEARCH_DEBOUNCE_MS);
const debouncedMaxPrice = useDebouncedValue(state.maxPrice, SEARCH_DEBOUNCE_MS);

const query: ProductQuery = {
  category: state.category,          // 즉시 반영
  minPrice: debouncedMinPrice,
  maxPrice: debouncedMaxPrice,
  sortBy: state.sortBy,              // 즉시 반영
  searchQuery: debouncedSearchQuery,
  page: state.page,                 // 즉시 반영
};
```


### 검색 중 로딩이 입력창을 덮고 포커스를 앗아갔다

이건 코드만 봤으면 놓치기 쉬웠을 버그였다. 검색 결과가 없는 상태에서 상품명을 한 글자 더 치면, 매번 "로딩 중..."이 **전체 화면을 덮으면서 검색창이 언마운트**됐다. 그 순간 input이 사라지니 **포커스도 날아가** 연속 입력이 불가능했다.

`keepPreviousData`로 재요청 중에도 이전 목록을 유지하고, 전체화면 로딩은 **데이터가 아예 없는 최초 로드에만** 띄우도록 고치게 했다. 재검색 중에는 하단에 작은 갱신 배너만 보인다.

```tsx
// 최초 로드에서만 전체화면 로딩. 재검색 중에는 keepPreviousData로 목록·검색창이 유지된다
if (isLoading) {
  return <div className="loading">로딩 중...</div>;
}
// ...본문 하단...
{isFetching && <div className="background-loading">데이터 갱신 중...</div>}
```

`isLoading`(데이터가 처음부터 없음)과 `isFetching`(재요청 중)을 구분하는 것 하나로, 포커스 유실과 화면 깜빡임이 동시에 사라졌다.

<!-- 이미지 자리(사용자가 채움): 검색 중 로딩이 입력창을 덮어 포커스가 사라지는 before ↔ keepPreviousData 적용 후 목록·입력창이 유지되는 after, 짧은 GIF 2컷 -->


### 작은 것들 — parsePrice, HighlightPart, Pagination

- **`parsePrice`를 utils로.** 가격 파싱은 UI가 아니라 순수 함수라 `utils`로 옮기게 하고, 빈 문자열·`NaN`을 `""`로 통일하는 가드를 붙이도록 했다.

  ```tsx
  export function parsePrice(raw: string): number | "" {
    if (raw === "") return "";
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? "" : parsed;
  }
  ```

- **`type HighlightPart`가 utils에 있었다.** 타입은 `types/index.ts`로 옮기게 했다. 함수가 사는 곳과 타입이 사는 곳을 섞지 않는다.
- **Pagination의 `page === 1` / `page === totalPages` 반복.** 같은 비교가 버튼마다 흩어져 있어, 의미 있는 이름으로 한 번만 계산해 재사용하도록 했다.

  ```tsx
  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;
  // ...
  <button onClick={() => onPageChange(1)} disabled={isFirstPage} aria-label="첫 페이지">«</button>
  <button onClick={() => onPageChange(page + 1)} disabled={isLastPage} aria-label="다음 페이지">›</button>
  ```

## red-green — 고치기 전에 실패를 한 번 본다

지난 과제 때 나는 이런 질문을 했다.

> 작성한 테스트가 happy path라 기존 결함 증명은 아닌 것 같은데, 어떤 방식이 좋았을까요?

그에 대한 피드백은 이랬다.

> 다음 과제 때 "고치기 전에 실패하는 테스트 하나"를 먼저 써보세요. 빨강을 한 번 보고 고치면, 그게 진짜 회귀 테스트가 되거든요.

마침 이번에 딱 해보기 좋은 결함이 있었다. **구조와 무관하게 남아 있는 별개의 로직 결함**이었다. 검색어 하이라이트는 입력값 `q`를 `new RegExp("(" + q + ")")`처럼 그대로 정규식에 끼워 넣어 매치 위치를 찾았다. 그래서 `(` 같은 정규식 특수문자를 검색하면 패턴 문자열이 `(()`처럼 괄호 짝이 안 맞는 꼴이 되고, 정규식을 만드는 그 순간 "Invalid regular expression" 예외를 던지며 하이라이트가 통째로 깨졌다.

피드백을 적용해 보기 위해 히스토리에 테스트 실패 커밋을 일부러 하나 남기기로 했다.

```tsx
// 결함 증명: 옛 코드는 "(" 입력 시 "Invalid regular expression"으로 throw 했다.
// escapeRegExp 적용을 제거하면 이 테스트는 다시 빨갛게 실패한다.
describe("splitHighlightParts — 정규식 특수문자 검색 (결함 증명)", () => {
  it("'(' 를 검색해도 throw 하지 않는다", () => {
    expect(() => splitHighlightParts("a(b)c", "(")).not.toThrow();
  });
  it("특수문자도 일반 문자처럼 매치로 표시한다", () => {
    const parts = splitHighlightParts("a(b)c", "(");
    expect(parts.some((part) => part.isMatch && part.text === "(")).toBe(true);
    expect(parts.map((part) => part.text).join("")).toBe("a(b)c");
  });
});
```

위의 실패를 확인한 후에 **바로 다음 커밋**에서야 escape를 넣어 테스트를 성공하도록 수정하였다.

```tsx
const REGEXP_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;
function escapeRegExp(value: string): string {
  return value.replace(REGEXP_SPECIAL_CHARS, "\\$&");
}
// ...
const pattern = new RegExp(`(${escapeRegExp(query)})`, "gi");
```

올바른 방법인지는 모르겠으나, red와 green을 이렇게 두 커밋으로 갈라 두니, `git log`만 되짚어도 이 테스트가 왜 태어났는지는 알 수 있겠다 싶었다.

### 계약은 테스트하고, 흔들리는 표현은 두었다

레이어 분리 자체가 동작을 바꾸지 않았다는 것도 테스트로 고정하고 싶었다. 그래서 URL 쿼리로 진입했을 때 그 조건이 **실제 요청 URL과 화면 상태로 복원되는지**를 통합 테스트로 잡게 했다.

```tsx
expect(firstRequestUrl).toContain("category=fashion");
expect(firstRequestUrl).toContain("sort=price-asc");
expect(firstRequestUrl).toContain("q=coat");
expect(firstRequestUrl).toContain("page=2");
// ...
const inStockCheckbox = screen.getByRole<HTMLInputElement>("checkbox");
expect(inStockCheckbox.checked).toBe(true);
```

여기서 의도적으로 **선을 그었다.** 요청 URL의 파라미터, 검색창의 value, 체크박스의 checked까지는 단언했지만, "카테고리 칩에 active 클래스가 붙었는지"나 "화면에 '가격 낮은 순' 텍스트가 떠 있는지"는 **넣지 않았다.** 칩의 클래스명이나 정렬 라벨 문구는 **쉽게 바뀔 수 있는 표현**이라, 거기에 테스트를 걸면 리팩토링할 때마다 애먼 곳이 빨개진다. 발제에서 "색이나 그런 건 테스트하지 말라"던 조언도 같은 맥락으로 이해했기 때문에 선을 그었다. 

## 2차 리뷰 — 남은 냄새들

위의 1차 리뷰를 하고, 해당 부분들을 다시 AI에게 위임하고, 그 결과물을 다시 보며 세 가지를 더 짚었다.

### `constants.ts`에 있던 타입가드

`isCategory` 같은 **함수**가 `constants.ts`에 들어가 있었다.

```tsx
export const isCategory = (value: string): value is CategoryFilter =>
  CATEGORIES.some((opt) => opt.value === value);
```

상수를 모으는 파일에 로직이 섞이면 파일 이름이 거짓말을 한다. 타입가드 함수들은 직접 `utils`로 옮겼다.

### 흩어진 `setPage(1)`을 useReducer로 모았다

필터 관련 상태를 개별 `useState`로 들고 있다 보니, **필터를 바꿀 때마다 "값 변경 + `setPage(1)`"을 짝으로** 호출하는 로직이 여기저기 흩어져 있었다. 어느 한 곳에서 `setPage(1)`을 빠뜨리면 조용히 버그가 된다. 또 타입도 `FilterState`를 제대로 활용하지 못하고 있었다.

이 규칙을 한곳에 모으려고 `useReducer`로 바꾸도록 요청했다. 각 액션 케이스가 `page: 1`을 스스로 챙긴다.

```tsx
const [state, dispatch] = useReducer(
  filtersReducer,
  window.location.search,
  parseFiltersFromUrl,
);

// reducer — "필터가 바뀌면 첫 페이지로" 규칙을 케이스마다 흩뿌리지 않고 여기 한곳에
switch (action.type) {
  case "setCategory":
    return { ...state, category: action.value, page: 1 };
  case "setSortBy":
    return { ...state, sortBy: action.value, page: 1 };
  case "setSearchQuery":
    return { ...state, searchQuery: action.value, page: 1 };
  case "setPage":
    return { ...state, page: action.value }; // 페이지 이동만 page 유지
}
```

`FilterState`는 `Omit<ProductFilters, "viewMode">`로 정의하게 하고, `viewMode`는 서버 조회나 URL과 무관한 단발 표시값이라 일부러 reducer 밖 `useState`에 남기도록 했다. 상태를 전부 reducer로 몰아넣는 게 목적이 아니라, **같이 움직여야 하는 규칙만** 모으는 게 목적이었기 때문이다.


### ProductGrid가 그냥 통과시키던 prop을 합성으로

`ProductGrid`가 `onToggleWishlist`, `onProductClick`을 **자기는 손도 안 대고** 그대로 `ProductCard`로 내리는 Bad Smell이 있었다. `ProductGrid`가 굳이 알 필요 없는 콜백을 매개하고 있는 것이다.

`ProductGrid`는 배치와 빈 상태만 알면 되므로, `ProductCard`를 **children으로 바깥에서 합성**하도록 바꾸게 했다.

```tsx
// after — ProductGrid는 배치/빈상태만. 콜백은 알지 못한다
export default function ProductGrid({
  viewMode,
  isEmpty,
  children,
}: {
  viewMode: ViewMode;
  isEmpty: boolean;
  children: ReactNode;
}) {
```

```tsx
// 호출부에서 ProductCard를 직접 합성해 통과용 prop 드릴링을 없앴다
<ProductGrid viewMode={filters.viewMode} isEmpty={visibleProducts.length === 0}>
  {visibleProducts.map((product) => (
    <ProductCard
      key={product.id}
      product={product}
      searchQuery={filters.searchQuery}
      isWished={isWished(product.id)}
      onToggleWishlist={toggleWishlist}
      onClick={addRecentlyViewed}
    />
  ))}
</ProductGrid>
```


이 모든 분리 끝에, 536줄이던 `ProductListPage.tsx`는 **129줄**로 줄었다. 이제 데이터도 로직도 없이, 훅을 호출하고 컴포넌트를 조립하기만 한다.

## 고치지 않은 것 — "재고 있는 것만"의 총 개수

"재고 있는 것만" 체크박스를 켜면 상단의 "총 n개의 상품" 숫자가 갱신되지 않는다. 처음엔 고치려 했지만, **이번 범위에서는 일부러 남겨뒀다.**

총 개수와 페이지네이션은 **서버가 재고를 무시하고 계산**하는데, 재고 필터는 **클라이언트의 현재 페이지에만** 적용된다. 그래서 클라이언트에서 개수만 맞추면, 실제 페이지 수와 모순되는 **더 큰 불일치**가 생긴다. 정합적으로 풀려면 재고 필터를 서버(`_mockApi.ts`)에서 적용해야 하는데, 그 파일은 과제 scaffolding이라 수정 대상이 아니라고 판단하였다.

## 다시 화면을 만지며 — 세 가지 점검

과제에서 추가적으로 확인할 항목이 몇 가지 더 붙었다. 하나씩 짚으며 버그를 잡았다.

**1. 필터·검색·페이지를 적용한 뒤 새로고침하거나, 그 URL을 공유·북마크해 다시 열어도 조건이 유지되는가?**
새로고침하면 필터가 전부 초기화됐다. 필터 훅이 **마운트 시 `window.location.search`를 읽어 초기 상태로 복원**하게 하고(`parseFiltersFromUrl`), 반대로 상태가 바뀌면 URL에 동기화하도록 했다. 무효한 값은 기본값으로 폴백한다. 위 useReducer의 lazy initializer가 바로 이 복원 지점이다.

**2. 일시적인 API 오류가 난 뒤에도 새로고침 없이 다시 시도할 수 있는가?**
기존에는 오류 화면에서 재시도할 방법이 없었다. 여기서도 TanStack Query가 두 겹으로 거들었다. 우선 일시적 실패는 대개 **자동 재시도**가 먼저 흡수한다 — 쿼리가 실패하면 retry 기본값만큼 몇 차례 알아서 다시 요청하므로, 순간적인 오류는 금방 조용히 회복된다. 그 자동 재시도까지 모두 소진돼 진짜 오류 화면에 도달했을 때를 위한 **수동 탈출구**가 두 번째 겹이다. 전체 페이지를 다시 로드하면 캐시·위시리스트·URL 동기화까지 초기화되니, `refetch`로 **해당 쿼리만** 다시 요청하게 했다.

```tsx
return <ProductListError error={error} onRetry={() => refetch()} />;
```

**3. 불필요한 API 요청이 지나치게 많이 발생하지 않는가?**
이건 앞서 [디바운스](#디바운스-없이-매-타이핑마다-요청)로 이미 막아둔 부분이다. 타이핑마다 나가던 요청이 확정 시점 한 번으로 줄었다.

## 회고 — 직접 읽어 믿되, 그 믿음을 구조에 넘긴다

지난번에는 "AI가 짠 코드를 설계로 **읽어내는 눈**"을 얘기했다. 이번에도 결국 같은 눈이 일을 했다.

AI에게 레이어 분리를 시키니, 실제로 꽤 잘해주었다. 하지만 직접 코드를 보면 `services/`가 `api/`로 나오고, "재사용 안 되니 안 쪼갠다"며 SRP를 위반한 컴포넌트가 남아 있었다거나 검색 중 포커스가 날아가는 버그가 드러났다. 이건 AI가 잘 못 잡는 부분이고, 개발자도 화면을 직접 안 보면 인지하기 힘든 버그라 생각되었다.

또 하나 배운 건 **AI의 오판이 종종 지침의 빈틈에서 온다**는 점이다. AI가 `FilterPanel`을 "재사용되지 않으니 안 쪼갠다"고 판단한 건, 검수 스킬이 컴포넌트 추출 기준을 "같은 로직이 두 곳 이상 반복될 때"라는 **재사용 중심으로만** 적어 뒀기 때문이다. 거기에 "성급한 추상화는 피하라"가 겹치자, AI는 지침을 충실히 따라 정확히 틀린 결론에 도달했다. 그래서 요즘 드는 고민은, 나온 코드를 리뷰해 고치는 데서 그치지 않고 **같은 오해가 애초에 나오지 않도록 스킬 자체를 얼마나 촘촘히 못 박아 둘 것인가**다. 판단 기준을 애매하게 남겨 두면, AI는 그 애매함을 나 대신 채워 넣는다.

