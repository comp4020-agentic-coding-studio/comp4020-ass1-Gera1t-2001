import { allocate } from "../model/allocate";
import type { ChokepointId } from "../model/types";
import { mount } from "../render/view";
import type { Intent } from "../render/view";
import { readHash, writeHash } from "./permalink";

/**
 * The wiring between the URL, the model and the view.
 *
 * This lives here rather than in main.ts so that the tests drive the same
 * function the page does. When it lived inline in the entry script the test
 * suite had to rebuild it by hand, which meant the three lines that actually
 * touch `location` and `history` were asserted against a copy of themselves and
 * had never run under test.
 */

export interface App {
  /**
   * Detach the hashchange listener. The page never calls this; a test suite
   * mounting twenty roots into one window does, because the listener lives on
   * `window` and outlives the root it was created for.
   */
  readonly destroy: () => void;
}

/**
 * Work out the closed set an intent leads to.
 *
 * Deliberately returns a value with no `default` branch: adding a variant to
 * `Intent` without a case here fails `tsc` with TS2366 rather than silently
 * doing nothing. `rerouteLabel` in view.ts is the same pattern.
 */
function nextClosed(
  intent: Intent,
  closed: ReadonlySet<ChokepointId>,
): Set<ChokepointId> {
  switch (intent.type) {
    case "toggle": {
      const next = new Set(closed);
      if (next.has(intent.id)) next.delete(intent.id);
      else next.add(intent.id);
      return next;
    }
  }
}

export function start(root: HTMLElement): App {
  // On first load the URL is the only source of truth — there is no earlier
  // state to preserve, so an empty hash correctly means "nothing closed".
  let closed: ReadonlySet<ChokepointId> = readHash(location.hash);

  const render = () => view.update(allocate(closed));

  const view = mount(root, (intent) => {
    closed = nextClosed(intent, closed);
    // replaceState, not pushState: toggling a strait is exploring the model,
    // not navigating, and it should not fill the back button with steps.
    history.replaceState(null, "", writeHash(closed) || location.pathname);
    render();
  });

  const onHashChange = () => {
    closed = readHash(location.hash);
    render();
  };
  addEventListener("hashchange", onHashChange);

  render();

  // The browser resolves a fragment against the page as it was parsed — before
  // any of this exists. It scrolls to an offset that is correct for a page of
  // masthead-plus-footer, then the interface is inserted above and that offset
  // lands somewhere in the middle of the map. Re-apply the fragment now that
  // the sections it names are actually there.
  const fragment = location.hash;
  if (fragment.length > 1 && !fragment.startsWith("#closed")) {
    let target: Element | null = null;
    try {
      target = document.querySelector(fragment);
    } catch {
      // Not a valid selector — someone hand-edited the hash. Leave it alone.
    }
    target?.scrollIntoView();
  }

  return {
    destroy: () => removeEventListener("hashchange", onHashChange),
  };
}
