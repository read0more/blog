import { expect, type Page } from "@playwright/test";

type TransitionRecord = {
  durations: number[];
  finished: boolean;
  error?: string;
};

declare global {
  interface Window {
    postTransitions: TransitionRecord[];
  }
}

/** jsdom에서는 검증할 수 없는 브라우저의 실제 스냅샷 애니메이션을 관찰한다. */
export async function observeTransitions(page: Page) {
  await page.addInitScript(() => {
    window.postTransitions = [];
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (...args) => {
      const transition = start(...args);
      const record: TransitionRecord = {
        durations: [],
        finished: false,
      };
      window.postTransitions.push(record);
      void transition.ready.then(
        () => {
          const effects = document
            .getAnimations()
            .map((animation) => animation.effect)
            .filter((effect): effect is KeyframeEffect =>
              Boolean(
                effect instanceof KeyframeEffect &&
                effect.pseudoElement?.startsWith("::view-transition"),
              ),
            );
          record.durations = effects.map((effect) =>
            Number(effect.getComputedTiming().duration),
          );
        },
        (error: Error) => {
          record.error = error.message;
        },
      );
      void transition.finished.then(() => {
        record.finished = true;
      });
      return transition;
    };
  });
}

export async function resetTransitions(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.postTransitions.every((record) => record.finished),
      ),
    )
    .toBe(true);
  await page.evaluate(() => {
    window.postTransitions = [];
  });
}
