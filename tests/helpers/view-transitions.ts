import { expect, type Page } from "@playwright/test";

type TransitionRecord = {
  animations: string[];
  durations: number[];
  rootAnimation: string;
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
        animations: [],
        durations: [],
        rootAnimation: "",
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
          record.animations = effects.map((effect) => effect.pseudoElement!);
          record.durations = effects.map((effect) =>
            Number(effect.getComputedTiming().duration),
          );
          record.rootAnimation = getComputedStyle(
            document.documentElement,
            "::view-transition-new(root)",
          ).animationName;
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

export async function expectTitleTransition(page: Page, index = 0) {
  await expect
    .poll(() =>
      page.evaluate((i) => window.postTransitions[i]?.finished, index),
    )
    .toBe(true);
  const record = await page.evaluate((i) => window.postTransitions[i], index);
  expect(record.error).toBeUndefined();
  expect(record.animations).toEqual(
    expect.arrayContaining([
      expect.stringMatching(/^::view-transition-old\(post-title-/),
      expect.stringMatching(/^::view-transition-new\(post-title-/),
    ]),
  );
  expect(record.rootAnimation).toBe("none");
  expect(record.durations.some((duration) => duration > 0)).toBe(true);
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
