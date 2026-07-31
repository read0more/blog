---
title: "기존 과제 폴더를 옮기며 배운 FSD"
date: "2026-07-31T13:00:00.000Z"
description: "기술 역할로 나눈 폴더(hooks·services·queries)에서는 '상품 목록 조건이 어디 있나'를 보려면 폴더 세 개를 열어야 했다. 커머스 프로젝트를 Feature-Sliced Design으로 옮기며 손이 멈췄던 자리들 — ProductCard를 위젯으로 올리고, store를 변경 이유대로 쪼개고, Steiger가 잡은 상향 import를 고친 판단의 근거를 정리했다."
category: ["아키텍처"]
---

지난 몇 주 붙잡고 있던 커머스 프로젝트를 Feature-Sliced Design(FSD)으로 옮겼다. 이번 글은 폴더를 옮기며 망설였던 자리들을 정리한 것이다.

## 폴더는 깔끔한데 기능이 안 보였다

옮기기 전 구조는 흔한 모양이었다. `hooks/`, `services/`, `queries/`, `components/`, `stores/`, `utils/` — 파일이 하는 기술적 역할대로 폴더를 나눴다. 처음엔 깔끔해 보였는데, 기능 하나를 따라가려니 삐걱대기 시작했다.

"상품 목록 조건이 어디서 정의되나"를 확인하려 했더니 세 군데를 열어야 했다. URL 파싱은 `hooks/productListSearchParams.ts`, 쿼리 옵션은 `queries/products.ts`, 카테고리·정렬 상수와 타입가드는 `components/commerce/productListOptions.ts`에 흩어져 있었다. 한 기능을 이해하려고 폴더 세 개를 오간 셈이다.

FSD 문서를 읽다 이 대목에서 멈췄다. 폴더는 그 안의 파일이 "무엇인지"가 아니라 "왜 있는지"로 나뉘어야 한다는 얘기였다. `components`, `hooks`, `types` 같은 이름은 파일이 무엇인지는 알려주지만 어떤 기능에 속하는지는 말해주지 않는다. 그러다 보면 관련된 코드가 서로 멀어지고, 하나를 고치려 할 때 무관한 코드까지 같은 폴더에 있어 리뷰와 테스트 범위가 넓어지기 쉽다. 이 프로젝트가 딱 그 상태였다.

## 처음 헷갈린 것: feature가 entity보다 위?

레이어를 나누다 첫 벽을 만났다. FSD의 세로 순서는 위에서부터 `app → pages → widgets → features → entities → shared`인데, `features`가 `entities`보다 위에 있다. 문서를 보면 feature는 "사용자 상호작용", entity는 "비즈니스 엔티티"라고 되어 있다.

여기서 의문이 들었다. 상호작용이라면 결국 어떤 대상을 두고 하는 행동인데, 그 대상인 entity가 상호작용을 품어야 하는 것 아닌가? 왜 행동이 대상보다 위에 있지?

entity는 무엇인지(명사 — 상품, 장바구니 같은 도메인 개념)이고, feature는 무엇을 하는지(동사 — 담기, 찜하기 같은 행위)다. 위 레이어가 아래를 알되 아래는 위를 모르니, entity는 자기를 쓰는 feature를 몰라야 한다. 그러면 담기·찜처럼 여러 행위가 한자리에 모여 조합되는 UI는 어디에 두나? 여러 경로가 만나는 그 조합 지점이 곧 위젯이다. 마침 이 판단을 실제로 내린 자리가 바로 다음에 나오는 상품 카드라, 위젯으로 올리는 기준은 거기서 정리했다.

## "이 파일 어디 두지?" — 판단이 갈린 자리들

레이어를 갈라놓고 나니 정작 어려운 건 애매한 파일들이었다.

### ProductCard — 카드를 entity에 둘까, slot을 팔까

상품 카드를 `entities/product/ui`에 순수 UI로 두고, 담기·찜 같은 행위는 상위에서 주입하려 했다. `slot` 패턴을 떠올렸다. 그런데 카드에 붙을 행위가 담기·찜에서 끝나지 않을 것 같았다. 비교하기, 공유하기, 빠른 구매가 계속 붙으면 이렇게 된다.

```tsx
// ✕ entities/product/ui/ProductCard.tsx — 행위가 늘 때마다 prop이 는다
type Props = {
  product: Product;
  onAddToCart?: () => void; // features/add-to-cart
  onToggleWishlist?: () => void; // features/toggle-wishlist
  isWishlisted?: boolean;
  onCompare?: () => void; // features/compare
  onShare?: () => void; // features/share …
};
```

레이어 방향이 거꾸로 흐르지 않게 하기 위해 붙였으나 이 방법은 행위가 하나 붙을 때마다 카드를 고쳐야 하고, 카드를 고치면 그 카드를 쓰는 모든 화면이 영향을 받는다.

멘토링에서 이 고민을 꺼냈더니 답이 이렇게 돌아왔다.

> "천안 삼거리는 위젯이에요."

여러 경로가 만나는 조합 지점, 그게 위젯이라는 얘기였다. 카드에 행위가 셋 넷 모이는 자리가 딱 그거다. slot을 늘릴지 말지가 문제가 아니라, 조합이 반복되는 자리를 위젯으로 올리면 그 고민 자체가 사라진다는 것이었다.

그래서 카드를 통째로 `widgets/product-card`로 올렸다. 위젯은 feature를 직접 import할 수 있으니 slot조차 필요 없었다 — 카드가 `AddToCartButton`·`WishlistButton`을 자기 안에서 바로 조합했다.

```tsx
// widgets/product-card/ui/ProductCard.tsx — 위젯이라 feature 를 직접 조합한다
type Props = { product: Product };

export function ProductCard({ product }: Props) {
  return (
    <article>
      {/* 상품 표시 — entities/product 의 도메인 데이터 */}
      {/* 담기·찜은 feature 버튼에 productId 만 넘겨 조합 (slot 불필요) */}
      <AddToCartButton productId={product.id} />
      <WishlistButton productId={product.id} />
    </article>
  );
}
```

행위가 열 개로 늘어도 `ProductCard`가 받는 prop은 `product` 하나뿐이다. 새 행위는 위젯 안에 버튼을 하나 더 조합하면 끝이고, `entities/product`는 손대지 않는다. 멘토링에서 받은 판정 기준은 **feature가 늘어도 entities 파일이 안 바뀌면 방향이 맞다.** 카드를 위젯으로 올린 덕에, 버튼을 아무리 추가해도 `entities/product`(model·api)는 그대로다.

### commerceStore — 같은 Zustand인데 왜 나누나

장바구니와 위시리스트는 원래 `stores/commerceStore.ts` 하나에 담겨 있었다. 담긴 상품 id를 `Set`으로 들고 있는, 구조가 똑같은 두 상태였다. persist 로직도 같아서 "같은 store에 두는 게 자연스럽지 않나" 싶었다.

멘토링에서 나온 기준은 저장 방식이 아니라 변경 이유였다. 장바구니와 위시리스트는 앞으로 바뀌는 이유가 다르다. 장바구니엔 수량·재고·결제가 붙고, 위시리스트엔 정렬·공유가 붙는다. 지금 붙어 있다는 이유로 합쳐두면, **나중에 떼어내는 비용이 지금 나누는 비용보다 훨씬 커지곤 한다.** 그래서 `entities/cart/model`과 `entities/wishlist/model`에 각자 독립 store를 뒀다. 똑같던 persist 로직은 `shared/lib/createIdSetStore.ts` 팩토리로 빼고, 저장 키는 팩토리를 호출하는 쪽이 넘긴다. `entities/cart/model/store.ts`는 `cart-store`, `entities/wishlist/model/store.ts`는 `wishlist-store`를 각자 인자로 넘겨 인스턴스화했다.

### pagination과 도메인 fetch — shared는 도메인을 몰라야 한다

`Pagination`은 처음에 상품 목록 페이지 전용으로 봤다. 페이지를 넘기는 것도 사용자 동작이니 feature에 가까운 것 아닌가 싶어, 이 부분도 멘토링에서 물었다. 답을 듣고 보니 이 컴포넌트는 상품도, URL도 모른다. `page`와 `onPageChange`만 받아 숫자를 그리고 클릭을 콜백으로 넘길 뿐, 무엇을 페이징하는지도 페이지가 바뀌면 URL을 어떻게 고치는지도 모른다. 그 행위의 의미는 페이지가 다루고, 컴포넌트 자신은 도메인을 모르는 범용 UI다. 그래서 `shared/ui/pagination`으로 옮겼다.

반대 방향의 판단도 있었다. `services/commerce.ts`엔 `getProducts`, `getHome` 같은 조회 함수가 모여 있었는데, "공용이니 `shared/api`로 통째로?" 싶었다. 아니었다. `shared/api`는 http 클라이언트와 공통 규약(`requestJson`·`getBaseUrl`)만 두는 자리다. 특정 도메인을 조회하는 함수라면 그 도메인이 갖는 게 맞다고 봤다. 그래서 `getProducts`는 `entities/product/api/fetchProducts.ts`로, `getHome`은 홈 페이지가 소유하도록 `_pages/home/api/home.ts`로 갈랐다. 이때 스스로에게 던진 질문은 하나였다. **이 코드가 특정 비즈니스 도메인을 아는가.** 안다면 shared로 볼 수 없다.

## DTO는 api에, 도메인 타입은 model에 — entity 안의 경계

`entities/product/model`에는 프론트엔드 관점에서 필요한 도메인 구조(`model/product.ts`의 `Product`, `Category` 같은 화면·로직용 타입)를 둔다. 반면 백엔드가 내려준 응답 그대로의 형태(`ProductListResponse` 같은 DTO)는 fetch 함수 바로 옆, `entities/product/api/fetchProducts.ts`에 둔다. 같은 entity 안이라도 백엔드를 다루는 `api`와 프론트 도메인을 다루는 `model`을 세그먼트로 갈라둔 것이다.

백엔드 구조와 프론트엔드 구조는 역할과 책임이 다르다. 백엔드가 필드를 쪼개거나 합쳐도, 그 변화가 닿는 경계를 `api` 세그먼트로 한정하려 했다. DTO의 모양이 `model`까지 스며들면 서버가 바뀔 때마다 화면을 그리는 코드까지 함께 흔들릴 수 있다.

## public API — barrel file과 다른 점

FSD에선 모든 slice가 `index.ts`로만 바깥에 공개하고 내부 파일 직접 import를 막는다. 처음엔 "그냥 다 export하는 barrel file 아냐?" 싶었는데, 두 가지가 달랐다.

하나는 내부 구현을 숨긴다는 점이다. 상위 레이어가 `@/entities/product`로만 가져가면, product slice가 내부에서 파일을 쪼개거나 옮겨도 상위는 영향을 받지 않는다. 반대로 `@/entities/product/api/fetchProducts`처럼 내부 경로를 직접 파고들면(이 fetch 구현은 `index.ts`가 공개하지 않는 내부다), 그 상위 코드는 product의 내부 구조를 알아야 하고 내부가 바뀔 때 함께 고쳐야 한다. 결합도가 그만큼 커진다.

다른 하나는 무엇을 공개할지 명시한다는 점이다. 밖에서 실제로 쓰는 것만 `index.ts`에 노출하고, 안 쓰는 내부 심볼은 export하지 않는다. 기준 없이 전부 내보내면 그건 그냥 barrel file일 뿐이다. `index.ts`가 "이 slice의 계약서" 역할을 하려면 공개 목록 자체가 선택의 결과여야 한다.

## Steiger를 통해 잡은 FSD 규칙 위반

구조를 다 옮긴 뒤 FSD 공식 린터인 Steiger로 경계를 검증했다. `steiger src`를 돌리니 위반이 하나 나왔다.

상품 목록의 서버 프리패치(`ProductListSection`, `pages` 레이어)가 `_app/queryClient`(`app` 레이어)를 import하고 있었다. 아래 레이어가 위 레이어를 가져가는 상향 import였다. `queryClient`는 앱·페이지가 함께 쓰는 도메인 무관 데이터 인프라라, `shared/api`로 내려 하향 import로 바로잡았다.

나머지 경고는 오탐이거나 의도한 설계였다. `_app`·`_pages` 프리픽스를 레이어명 오타로 오해한 규칙, RADIO 단계에서 일부러 나눈 단일 소비 feature(정렬·카테고리 셀렉트처럼 상품 목록 한 곳에서만 쓰는)를 "무의미한 slice"로 본 규칙 같은 것들이다. 이런 건 `steiger.config.ts`에서 껐는데, 그냥 끄지 않고 **왜 껐는지 근거 주석을 함께 남겼다.** 린터가 틀렸다고 판단한 근거가 다음 사람에게도 보여야, 규칙 회피가 아니라 하나의 결정으로 남는다고 생각했다.

## 마치며 — 이 규모에 FSD가 과했을까

솔직히 이 정도 학습 프로젝트에 FSD가 과했나 싶은 순간도 있었다. slice마다 `index.ts`를 쓰고 세그먼트를 가르는 보일러플레이트가 분명히 늘었다.

그런데 폴더를 옮기는 내내 실제로 한 일은 단순히 파일을 나르는 게 아니었다. "이건 무엇인가, 무엇을 하는가", "이 코드는 어떤 도메인을 아는가", "의존 방향이 위에서 아래로 흐르는가", "변경 이유가 다른가"를 파일 하나하나에 물었다. FSD가 준 건 정답 폴더 트리가 아니라 경계를 어디에 그을지 스스로 판단하는 기준이었다.

그렇다고 내가 그 판단에 능숙해졌다는 뜻은 아니다. 사실 아키텍처 설계라는 걸 제대로 해본 적이 없고 FSD도 이번이 처음이라, 공식 문서부터 더듬더듬 읽으며 시작했다. 솔직히 지금도 어떤 파일 앞에서는 여전히 손이 멈추고, 문서를 읽으며 이해했다고 생각한 레이어 경계가 실제로 해보니 잘 되지 않았다. 그래도 막힐 때마다 그 파일에 "이건 무엇을 아나?"라고 물어보는 경험을 해볼 수 있었다. 정답까진 아니어도, 다음에 비슷한 자리에서 덜 헤맬 실마리는 되어 줄 것 같다.

