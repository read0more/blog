---
title: "비대한 컴포넌트에 대한 리팩토링 — 11개 전략으로 Bad smell을 판별하고, 고치지 않을 것을 정하기"
date: "2026-06-24T13:00:00.000Z"
description: "동작은 하는 컴포넌트를 11개 전략으로 훑으며 무엇을 고치고 무엇을 그대로 둘지 판별한 기록."
category: ["React", "리팩토링"]
---

## Overview

이번엔 이미 동작하는 체크아웃 화면에 대한 컴포넌트에서 "여기서 뭘 고칠까"를 판단해보았다. 기능 추가가 아니라 **판별 → 리팩토링 → 근거 기록**에 대한 연습을 하였다.

실무에서 내가 기존에 신경 쓰던 부분은 이랬다.
1. props가 5개 이상이 되면 분리 고려
2. 파일을 열었을 때 라인이 너무 길면 분리
3. 단순히 계산된 값으로 처리 가능한데 불필요한 state / effect 사용 시.

2번처럼 기준 중에 추상적인 부분도 있고, 해당 기준은 너무 범위가 좁기도 하다. 따라서 강의에서 보았던 11가지의 전략을 보고 그 중에서 선택하여 적용하였다.

진행 방식은 **방향은 내가 정하고, 코딩은 AI에게 시켰다.** 그리고 결과물을 다시 읽어 의도한 변경이 아니면 되돌리거나 다시 지시함으로써 **설명할 수 없는 코드는 커밋하지 않는다.** 를 지키려 했다. 문제가 생겼을 때 또는 누군가 의도를 물어봤을 때 AI가 짰다면서 AI에게 책임을 전가할 수는 없지 않은가?

관련하여 다른 분의 말을 빌리자면...
> 요즘은 컴포넌트를 직접 손으로 짜기보다 AI에게 시키는 경우가 많다. AI는 "돌아가는 컴포넌트"를 순식간에 쏟아낸다. 그래서 진짜 병목은 작성이 아니라 **그게 잘 설계됐는지 읽어내는 눈**이고, 그 눈이 가장 먼저 드러나는 곳이 props의 경계·계약·합성이다.

이번 시도의 진짜 목적은 나의 그 눈을 확장하기 위함이다.

## 고려한 리팩토링 11개 전략

강의에서 다룬 아래 11개 전략을 체크리스트로 삼아 컴포넌트를 훑어 보았다.

```
경계 ① 변화의 경계 · ② 구현 vs 조합 · ③ God Component · ④ 성급한 추상화
계약 ⑤ props는 적게, 이름은 역할대로 · ⑥ boolean 폭발 → enum · ⑦ 파생 상태 + key · ⑧ 확장은 위임으로
합성 ⑨ Context 전에 composition · ⑩ children vs slot · ⑪ Drilling vs Context
```

## 고려하여 고친 것들

### CheckoutPage — God Component 해체

`CheckoutPage.tsx`는 한눈에 ① 변화의 경계 · ③ God Component · ② 구현 vs 조합 혼재에 모두 걸렸다. 배송지·쿠폰·적립금·약관·결제수단·결제금액이 한 컴포넌트 안에서 상태와 마크업으로 뒤엉켜 있었다.

```tsx
// before — 한 컴포넌트가 모든 섹션의 상태를 들고 있다
const [selectedAddressId, setSelectedAddressId] = useState(ADDRESSES[0].id);
const [couponCode, setCouponCode] = useState("");
const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
const [usePoint, setUsePoint] = useState(false);
const [pointInput, setPointInput] = useState(0);
const [isTermsOpen, setIsTermsOpen] = useState(false);
// ...그리고 모든 섹션의 마크업이 한 return 안에
```
마틴 파울러의 책인 리팩터링에서 가장 기억나고 공감이 가는 말이 있다.

> 리팩터링은 프로그램 수정을 작은 단계로 나눠 진행한다. 그래서 중간에 실수하더라도 버그를 쉽게 찾을 수 있다.

수정을 작은 단계로 나누려면 우선 비대한 컴포넌트를 잘게 나누는 시도를 하였다. 처음부터 11개의 전략을 전부 고려하기 전에 최대한 컴포넌트는 하나의 일만 담당하도록 관심사를 분리하였다. 이 부분은 **① 변화의 경계** 에 해당한다고 생각한다. 또한 관심사의 분리는 [리액트 공식문서](https://react.dev/learn/thinking-in-react#step-1-break-the-ui-into-a-component-hierarchy)에서도 언급되는 내용이기도 하다.

그렇게 컴포넌트를 분리하고, 계산 로직은 util로 빼냈다. 그렇게 걷어내자 `CheckoutPage`에 대해서 어떻게 리팩터링 할지 목표가 보였다 — 결국 "체크아웃 시 제출할 상태만 들고, 나머지는 **조합만 하는** 컴포넌트"여야 한다는 기준을 세웠다.

그 기준으로 보면 `couponCode`(입력 중인 쿠폰 코드), `usePoint`(적립금 사용 체크 여부), `isTermsOpen`(약관 모달 열림)은 **제출 데이터가 아니라 각 섹션의 UI 상태**다. 그래서 각 컴포넌트 안으로 내려보냈다. `CheckoutPage`에는 실제로 결제에 들어가는 값(`appliedCoupon`, `pointInput`, `agreed`...)만 남겼다.

```tsx
// after — 제출할 도메인 상태만, UI 상태는 각 컴포넌트 소유
const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
const [pointInput, setPointInput] = useState(0);
const [payment, setPayment] = useState<PaymentMethod>("card");
const [agreed, setAgreed] = useState(false);

<CouponSection appliedCoupon={appliedCoupon} onApply={setAppliedCoupon} />
<PointSection
  memberPoint={member.point}
  pointInput={pointInput}
  onChangePointInput={setPointInput}
/>
```

> **근거 한 줄** — God Component를 섹션별로 쪼개 "조합만 하는 컴포넌트"로 만들었다.

### finalPrice 계산 함수 — param 폭발을 객체로

`calculateFinalPrice`는 처음부터 있던 함수가 아니다. God Component를 해체하면서 `CheckoutPage`에 인라인으로 박혀 있던 최종 금액 계산식(`itemTotal + shippingFee - couponDiscount - pointDiscount`)을 util로 빼낸 결과다. 그렇게 **분리하면서 생긴** `calculateFinalPrice`는 금액 인자를 네 개나 나열로 받는 형태였다.

```ts
// 분리하며 빼낸 직후 — 같은 타입(number) 인자가 줄줄이. 순서 한 번 바뀌면 조용히 틀린다
export function calculateFinalPrice(
  itemTotal: number,
  shippingFee: number,
  couponDiscount: number,
  pointDiscount: number,
): number {
  return itemTotal + shippingFee - couponDiscount - pointDiscount;
}
```

할인 종류가 늘수록 인자도 늘고, 전부 `number`라 **호출부에서 순서를 바꿔 넣어도 컴파일이 통과**한다. 관련된 값(상품가·배송비·각종 할인)은 하나의 "결제 금액 묶음"이니, `PaymentAmounts` 객체로 묶었다.

```ts
// after — "이 값들은 묶여 있다"를 타입으로 명시
export type PaymentAmounts = {
  itemTotal: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
  memberDiscount: number;
};

export function calculateFinalPrice(amounts: PaymentAmounts): number {
  const { itemTotal, shippingFee, couponDiscount, pointDiscount, memberDiscount } =
    amounts;
  return itemTotal + shippingFee - couponDiscount - pointDiscount - memberDiscount;
}
```

> **근거 한 줄** — 해체하며 util로 빼내자 드러난 param 폭발을 객체로 접었다. ⑤ props(인자)는 적게 — 순서 의존 호출 실수를 없애고, 관련된 값이 한 묶음임을 타입으로 드러냈다. 새 할인이 생겨도 객체에 키 하나만 늘면 된다.

### finalPrice — 파생값을 state에서 빼기

원래 `finalPrice`가 `useState`에 담겨 있었다.

```tsx
// before — 파생값을 state에 담아 둔 안티패턴
const [finalPrice] = useState(
  calculateFinalPrice(itemTotal, shippingFee, couponDiscount, pointDiscount),
);
```

이렇게 state에 한 번 담아 두면 쿠폰·배송비가 바뀌어도 다시 계산되지 않아 화면에 **실시간 반영이 안 된다.** 그래서 렌더 중 계산으로 바꿨다.

```tsx
// after — 렌더 중 계산. 입력이 바뀌면 자연히 다시 계산된다
const itemTotal = calculateItemTotal(cart);
const amounts: PaymentAmounts = {
  itemTotal,
  shippingFee: calculateShippingFee(itemTotal, selectedAddress.isRemote),
  couponDiscount: calculateCouponDiscount(appliedCoupon),
  pointDiscount: calculatePointDiscount(pointInput, member.point, itemTotal),
  memberDiscount: calculateMemberDiscount(itemTotal, member),
};
const finalPrice = calculateFinalPrice(amounts);
```

> **근거 한 줄** — ⑦ 파생 상태 + key에서 파생 상태에 해당. useEffect를 추가해서 그 안에서 state를 변경해도 실시간 반영이 되기는 하겠지만, 이 경우에는 단순히 계산된 값을 사용하면 되기 때문에 계산된 값을 사용. 이런 상황에서의 useEffect 사용은 [공식문서에서도 언급하는 대표적인 안티 패턴](https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)이다.

### OrderLineRow — 제일 어려웠던 파트

가장 고민했던 컴포넌트다. `OrderLineRow`는 `type`에 따라 분기하며 props를 8개나 받고 있었다.

```tsx
// before — type 분기 + props 폭발
type OrderLineType = "product" | "subtotal" | "shipping" | "coupon" | "point";

type Props = {
  type: OrderLineType;
  label: string;
  amount: number;
  thumbnail?: string;
  option?: string;
  quantity?: number;
  isDiscount?: boolean;
  couponCode?: string;
};
// type 및 특정 type에만 필요한 prop을 optional으로 받아서 분기처리 하여 렌더링.
// 만약 새 타입(부분취소, 선물포장, 결제수단 즉시할인...)이 생길 경우 계속하여 분기가 늘어난다
```

props가 많은 건 증상이고, **원인은 따로 있었다.** `주문 상품 목록`의 한 줄과 `결제 금액` 명세의 한 줄은 명백히 **다른 일**인데, 이걸 한 컴포넌트가 `type` 분기로 같이 처리하려다 보니 양쪽에 필요한 모든 props가 한자리에 모인 것이다.

그래서 줄에서 **위치가 고정**되는 부분(썸네일, 우측 금액)은 **slot**으로 컴포넌트가 직접 잡고, **무엇이 들어올지 종류가 다양한** 부분(상품명+옵션 라인인지, 결제 금액 항목 섹션의 라인인지)은 **children**으로 바깥에 넘겼다. 이 과정에서 무엇을 출력할지 바깥에 맡김으로써 추상화가 되어 type을 받을 필요가 없어졌다.

```tsx
// after — 골격은 slot, 가변부는 children
type Props = {
  thumbnail?: ReactNode; // 위치 고정 slot
  children: ReactNode; // 줄마다 다른 가변부
  amount: number;
  isDiscount?: boolean;
};

export function OrderLineRow({ thumbnail, children, amount, isDiscount }: Props) {
  return (
    <div className="line">
      {thumbnail ? <span className="thumb">{thumbnail}</span> : null}
      <div className="grow">{children}</div>
      <Price amount={amount} isDiscount={isDiscount} />
    </div>
  );
}
```

호출부는 이제 줄의 내용을 **자리(children)에 직접** 채운다.

```tsx
// 주문 상품 목록
<OrderLineRow thumbnail={it.thumbnail} amount={it.price * it.quantity}>
  <span>{it.name}</span>
  {it.option ? <small>{it.option} · 수량 {it.quantity}</small> : null}
</OrderLineRow>

// 결제 금액 명세
<OrderLineRow amount={couponDiscount} isDiscount>
  <span>쿠폰 할인</span>
  <small>{appliedCoupon.code}</small>
</OrderLineRow>
```

금액 표시의 **색깔과 음수(-) 부호** 로직은 원래 `OrderLineRow` 안에 있었는데, 정말 관련된 위치는 금액을 그리는 `Price`라고 판단해 그쪽으로 옮겼다(아래 Price 항목).

여기서 한 번 더 멈춰서 판단한 게 있다. "그럼 아예 `주문상품목록Row`와 `결제금액Row`로 컴포넌트를 둘로 나눌까?" 지금은 골격이 같고 차이가 크지 않아, **굳이 지금 나누지는 않기로** 했다. 따라서 ④ 성급한 추상화로 판단하였다.

> **근거 한 줄** — ⑩ 위치 고정은 slot, 가변부는 children. 서로 다른 두 일을 한 컴포넌트가 type 분기로 떠안던 구조를 합성으로 풀어 props 폭발을 제거했다. 단, 더 쪼개는 건 보류.

### Price — 몰래 할인하던 컴포넌트를 순수 표현으로

`Price`는 겉보기엔 금액을 그리는 작은 컴포넌트인데, 실제로는 `member`를 받아 **VIP 할인을 몰래 적용**하고 있었다.

```tsx
// before — 표현 컴포넌트가 VIP 할인까지 한다
export function Price({ amount, member }: Props) {
  const value = calculateMemberPrice(amount, member); // 여기서 ×0.9
  return <strong>{value.toLocaleString()}원</strong>;
}
```

금액을 그리는 컴포넌트가 할인 계산까지 책임지니, 같은 `Price`를 쓰는 위치마다 보이지 않는 곳에서 값이 달라졌다(이게 아래 [결제 금액 불일치 버그](/posts/component-props-refactoring-bad-smell/#결제-금액-섹션과-결제-버튼의-금액이-달랐다)의 원인이다). 할인은 util(`calculateMemberDiscount`)로 빼고, `Price`는 받은 금액을 **그대로 그리기만** 하는 컴포넌트로 되돌렸다. 동시에 `OrderLineRow`에 흩어져 있던 색/부호 로직도 이리로 모았다.

```tsx
// after — 받은 값을 그리기만 하는 컴포넌트
export function Price({ amount, isDiscount }: Props) {
  return (
    <strong style={{ color: isDiscount ? "#ef4444" : "var(--text-h)" }}>
      {isDiscount ? "- " : ""}
      {amount.toLocaleString()}원
    </strong>
  );
}
```

> **근거 한 줄** — 표현 컴포넌트에서 도메인 계산(할인)을 들어내 순수하게 만들고, 금액 표시 책임(색·부호)을 한곳에 모았다.

### OrderStatusTag — boolean 폭발 → union 타입

`OrderStatusTag`는 주문 상태를 boolean 다섯 개로 받고 있었다.

```tsx
// before — boolean 폭발. isPaid && isShipped 같은 말이 안되는 상태가 타입상 허용된다
type Props = {
  isPaid?: boolean;
  isPreparing?: boolean;
  isShipped?: boolean;
  isDelivered?: boolean;
  isCancelled?: boolean;
};
```

주문 상태는 본래 **하나**다. 그런데 boolean 다섯 개로 받으면 `isPaid`와 `isCancelled`가 동시에 true인 모순 상태가 타입상 가능해지고, 호출부도 길어진다. 게다가 프로젝트에는 이미 `OrderStatus` 유니온 타입이 있었기 때문에 이를 활용하여 개선하였다.

```tsx
// after — OrderStatus 하나만 받고, 표는 Record로 선언적으로
const STATUS_TAG: Record<OrderStatus, { label: string; color: string }> = {
  paid: { label: "결제완료", color: "#3b82f6" },
  preparing: { label: "상품 준비중", color: "#f59e0b" },
  shipped: { label: "배송중", color: "#8b5cf6" },
  delivered: { label: "배송완료", color: "#22c55e" },
  cancelled: { label: "주문취소", color: "#ef4444" },
};

export function OrderStatusTag({ status }: { status: OrderStatus }) {
  const { label, color } = STATUS_TAG[status];
  return (
    <span className="tag" style={{ color, border: `1px solid ${color}` }}>
      {label}
    </span>
  );
}
```

호출부도 `<OrderStatusTag status={o.status} />` 한 줄로 줄었고, `OrderStatus`에 상태가 추가되면 `Record`가 컴파일 단에서 빠진 항목을 잡아 준다.

> **근거 한 줄** — ⑥ boolean 폭발을 이미 존재하던 union 타입(`OrderStatus`)으로 접고, if 체인을 `Record` 룩업으로 바꿔 불가능한 상태 자체를 제거했다.

## 고치지 않은 것

### DeliverySection과 그 자식들

`DeliverySection`과 그 자식들은 11개 전략을 한 줄씩 대보며 훑었지만, 뒤에서 말할 [도서산간 해제 버그](/posts/component-props-refactoring-bad-smell/#도서산간-해제-시-초기-선택이-초기화되지-않았다)를 빼면 구조적으로 걸리는 게 없다고 판단했다. 경계도 깔끔하고, props도 과하지 않아 보여 고치지 않았다.

### Price 컴포넌트를 결제 버튼의 금액 표기에 사용할지

이 부분은 확신은 없지만 버튼 안의 텍스트인 `58,500원 결제하기` 여기서 정말로 금액 부분만 따로 빼서 Price 컴포넌트를 쓰게 하는 게 맞을까 하는 의문이 생겼다.

버튼 안의 텍스트인 `결제하기`도 금액과 스타일을 맞추게 수정해야 할 텐데 그럴 거면 애초에 지금처럼 버튼 자체에 대한 css를 타게 하는 게 맞지 않을까 생각하여 그대로 두었다.

## 화면을 만져보다 — 숨어있던 버그들

과제에는 이런 문장이 있었다. **"코드만 읽지 말고 화면을 직접 조작해보자. 눈으로 안 보이던 냄새가 동작에서 드러난다."** 그래서 실제로 값을 넣어 가며 화면을 만졌고, 코드만 봤으면 눈치채기 힘들었을 버그들을 발견했다.

### 결제 금액 섹션과 결제 버튼의 금액이 달랐다

위 `Price`가 몰래 VIP 할인을 적용한 탓에, **결제 금액 섹션의 최종 금액**과 **하단 결제 버튼의 금액**이 서로 달랐다. 같은 화면에서 결제할 금액이 두 개로 보이는 셈이다. `finalPrice`를 한 번만 계산해 두 곳이 **같은 값을 공유**하게 하면서 해결됐다.

### VIP 할인이 화면 어디에도 안 보였다

VIP라서 10%가 깎이는데, 정작 **왜 깎였는지가 화면에 없었다.** 이와 더불어 아래의 VIP 할인이 배송비·쿠폰·적립금까지 깎는 부분까지 합쳐져서 이게 왜 이 결제금액이지? 하고 나도 코드를 보기 전까진 이해할 수 없었다. 따라서 결제 금액 명세에 회원 할인 줄을 추가했다.

### VIP 할인이 배송비·쿠폰·적립금까지 깎고 있었다

개인적으로 만약 실제 이커머스였다면 가장 크다고 생각한 부분이었다.

```
(상품 + 배송비 − 쿠폰 − 적립금) × 0.9
```

VIP 10% 할인을 **합계 전체에 곱해 버리니**, 상품가뿐 아니라 배송비·쿠폰·적립금까지 10%에 휘말렸다.

| 상황 | 현재 코드 | 표준 방식 | 차이 |
|---|---|---|---|
| 도서산간(배송 3,000) | `(65000+3000)×0.9 = 61,200` | `65000×0.9 + 3000 = 61,500` | 배송비 3,000원까지 10% 깎여 **−300원** (회사 손해) |
| 적립금 4,200P 사용 | `(65000−4200)×0.9 = 54,720` | `65000×0.9 − 4200 = 54,300` | 적립금이 90%로 인정돼 **고객이 420원 손해** |
| 쿠폰 5,000원 | `(65000−5000)×0.9 = 54,000` | `65000×0.9 − 5000 = 53,500` | 할인끼리 곱해져 VIP 할인폭이 6,500→6,000으로 줄어듦 |

배송비는 회사가 손해 보고, 적립금/쿠폰은 고객이 손해 보는 어느 쪽도 곤란해지는 방향이다. VIP 할인은 **상품 금액에만** 붙어야 한다. 그래서 회원 할인을 별도 함수로 떼고, 상품가 기준으로만 계산하게 고쳤다.

```ts
// after — VIP 할인은 상품 금액(itemTotal)에만. 배송비·쿠폰·적립금엔 적용하지 않는다
const VIP_DISCOUNT_RATE = 0.1;

export function calculateMemberDiscount(itemTotal: number, member?: Member): number {
  return member?.grade === "VIP"
    ? Math.floor(itemTotal * VIP_DISCOUNT_RATE) // 소수점 발생 시 1원도 고객이 손해 봤다고 느끼지 않게 내림 처리
    : 0;
}
```

```tsx
{memberDiscount > 0 ? (
  <OrderLineRow amount={memberDiscount} isDiscount>
    <span>회원 할인 (VIP 10%)</span>
  </OrderLineRow>
) : null}
```

### 도서산간 해제 시 초기 선택이 초기화되지 않았다

도서산간 주소를 라디오로 고른 뒤 "도서산간 제외" 체크박스를 켜면, **이미 선택돼 있던 도서산간 주소가 그대로 남아** 결제 완료 시 그 값으로 넘어갔다. 제외를 켜면 도서산간이 선택돼 있을 때 비-도서산간 첫 주소로 자동 전환하게 고쳤다.

```tsx
const handleExcludeRemoteToggle = (checked: boolean) => {
  setShouldExcludeRemote(checked);
  if (!checked) return;
  if (!selectedAddress.isRemote) return;

  const firstNonRemoteAddress = addresses.find((a) => !a.isRemote);
  if (firstNonRemoteAddress) onSelectAddress(firstNonRemoteAddress);
};
```

### 적립금 입력이 음수·무한대로 들어갔다

적립금 사용 input은 결제 금액에 반영될 땐 보유치까지만 잡혔지만, **입력값 자체**는 보유 적립금보다 크게 올라갔고, number input 기본 스피너로 0 아래까지 내리면 **음수**도 들어갔다. 음수 문제는 단순히 input의 min 속성에 0을 주었고, 최대값은 input onChange 시 보유치를 최대 값으로 잡아서 막았다.

```tsx
const handleChangePointInput = (points: number) => {
  onChangePointInput(usePoint ? Math.min(memberPoint, points) : 0);
};
```

## 회고 — AI가 쏟아내는 코드를 설계로 읽어낸다

맨 위에 언급한대로, 그동안 내가 컴포넌트를 보며 "여기서 뭘 고칠까"를 판단하던 기준은 몇 개 안 됐다 — props가 5개를 넘는지, 파일이 너무 긴지, 계산으로 될 걸 굳이 state·effect로 들고 있는지 정도였다. 이번에 11개 전략을 하나씩 대보면서 그 막연하던 기준을 훨씬 잘게 쪼개 확인해볼 수 있었던 게 가장 좋았다. 같은 "props가 많다"도 ⑤ 인자를 묶는 문제인지 ⑩ slot/children으로 가를 문제인지 갈렸고, "불필요한 state"도 ⑦ 파생 상태라는 이름이 붙으니 판단이 또렷해졌다.

그리고 새삼 코딩 자체는 AI에게 맡기더라도, **무엇을 고칠지 판별하고 근거를 남기는 일은 결국 사람의 몫**이라고 생각했다.

실제로 AI에게 지시하며 작업하는 동안, 내 생각과 어긋난 결과물이 종종 나왔다. 결제 금액을 계산할 때 이커머스에서는 보통 고객에게 유리하게 내림(`Math.floor`)하는 처리를 반올림으로 짜 두거나, `OrderLineRow`를 `OrderStatusTag`까지 하나로 끌어안으려는(서로 다른 일을 ④ 성급하게 추상화하려는) 시도가 그랬다. 둘 다 화면은 그대로 돌아가니, 코드를 읽고 "이건 설계가 틀렸다"고 짚지 않으면 그냥 지나갔을 것들이다. 이게 바로 맨 위에 인용한 — **AI는 "돌아가는 컴포넌트"를 순식간에 쏟아내고, 진짜 병목은 그게 잘 설계됐는지 읽어내는 눈**이라는 — 지점이라고 느꼈다.
