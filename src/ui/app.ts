import { allocate } from "../model/allocate";
import type { ChokepointId } from "../model/types";
import { mount } from "../render/view";
import type { Intent } from "../render/view";
import { carriesClosedState, readHash, writeHash } from "./permalink";

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
    case "reopen-all":
      return new Set();
  }
}

/**
 * How an intent should touch the history stack.
 *
 * The reason `Intent` is tagged rather than one callback per control: this is a
 * per-intent decision, not a per-app one. Toggling a strait is exploration and
 * rewrites the current entry, so the back button does not fill with steps.
 * Reopening everything is destructive — several closed straits gone at once,
 * with no other route back — so it is the one interaction here the back button
 * should undo.
 *
 * Also returns a value with no `default`, so a new variant cannot be added
 * without answering this question as well as the state one above.
 */
function historyMode(intent: Intent): "push" | "replace" {
  switch (intent.type) {
    case "toggle":
      return "replace";
    case "reopen-all":
      return "push";
  }
}

export function start(root: HTMLElement): App {
  // On first load the URL is the only source of truth — there is no earlier
  // state to preserve, so an empty hash correctly means "nothing closed".
  let closed: ReadonlySet<ChokepointId> = readHash(location.hash);

  const render = () => view.update(allocate(closed));

  const view = mount(root, (intent) => {
    closed = nextClosed(intent, closed);
    const url = writeHash(closed) || location.pathname;
    if (historyMode(intent) === "push") history.pushState(null, "", url);
    else history.replaceState(null, "", url);
    render();
  });

  const onHashChange = () => {
    // Someone can arrive at a shared state, or edit the hash by hand — but the
    // masthead nav and the skip link move the hash too, and those must not be
    // read as "nothing is closed". Unlike the initial load, there is state here
    // worth protecting, so only a hash that claims something about the model
    // gets to replace it.
    if (!carriesClosedState(location.hash)) {
      // The model survives, but the address bar now says `#flows` while Hormuz
      // is shut — copy it and you share baseline. The fragment is being asked
      // to name a section and to name a state, and the state is the half worth
      // sharing, so the section fragment is transient: it has already done its
      // scrolling by the time this runs, and the URL goes back to describing
      // the model.
      //
      // KNOWN COST: the fragment nav pushed its history entry before this ran,
      // so the stack holds two adjacent entries with the same URL. The first
      // back press changes nothing — same URL, no hashchange, no visible
      // response. The second either leaves the site or is equally inert,
      // depending on whether the visitor arrived here from somewhere else;
      // measured both ways in a real browser over CDP. Either way Back reads as
      // broken for a press or two after a nav click, which is the cost.
      //
      // Accepted deliberately, because a URL that lies about what it shows is
      // worse: this page is built to be shared by its address. Only paid when
      // there is state to protect — with nothing closed the fragment is already
      // an honest description of the page and is left alone.
      if (closed.size > 0) {
        history.replaceState(null, "", writeHash(closed) || location.pathname);
      }
      return;
    }
    closed = readHash(location.hash);
    // One state, one URL. `#closed=` and a bare path both mean baseline, and
    // the bare path is canonical — so without this, reaching baseline by a
    // preset link and reaching it by the reopen-all control would leave two
    // different addresses for the same page. replaceState, because normalising
    // a spelling is not a navigation.
    history.replaceState(null, "", writeHash(closed) || location.pathname);
    render();
  };
  addEventListener("hashchange", onHashChange);

  render();

  // The browser resolves a fragment against the page as it was parsed — before
  // any of this exists. It scrolls to an offset that is correct for a page of
  // masthead-plus-footer, then the interface is inserted above and that offset
  // lands somewhere in the middle of the map. Re-apply the fragment now that
  // the sections it names are actually there.
  // The same predicate as the handler above, rather than a second informal
  // copy of the grammar: `startsWith("#closed")` also swallowed `#closedfoo`.
  const fragment = location.hash;
  if (fragment.length > 1 && !carriesClosedState(fragment)) {
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
