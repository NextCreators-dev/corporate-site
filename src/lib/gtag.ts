// GA4 のイベント送信ヘルパー
// Head.astro で gtag.js が読み込まれている前提で、クライアント側から呼び出す

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export type GtagEventParams = Record<string, unknown>;

// GA4 にカスタムイベントを送信する。gtag 未ロード時は黙ってスキップする
export function trackEvent(name: string, params?: GtagEventParams): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", name, params ?? {});
}
