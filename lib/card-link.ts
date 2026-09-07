/**
 * 카드 홈 주소 만들기.
 * 카드 홈은 토큰(?t=) 없이 열면 "확인할 수 없는 카드"가 되므로
 * 앱 안에서 카드 홈으로 돌아갈 때는 반드시 토큰을 붙인다.
 * 토큰을 모르면 null 을 돌려주고, 호출한 쪽은 첫 화면("/")으로 보낸다.
 */
export function cardHref(cardId: string | null | undefined, tagToken: string | null | undefined): string | null {
  if (!cardId || !tagToken) return null;
  return `/c/${encodeURIComponent(cardId)}?t=${encodeURIComponent(tagToken)}`;
}
