import { allocate } from "./src/model/allocate";
import { mount } from "./src/render/view";
import type { View } from "./src/render/view";
import { readHash, writeHash } from "./src/ui/permalink";

const root = document.querySelector<HTMLElement>("[data-app]");

if (root) {
  let closed = readHash(location.hash);
  let view: View | null = null;

  const render = () => view?.update(allocate(closed));

  view = mount(root, (id) => {
    if (closed.has(id)) closed.delete(id);
    else closed.add(id);
    // replaceState, not pushState: toggling a strait is exploring the model,
    // not navigating, and it should not fill the back button with steps.
    history.replaceState(null, "", writeHash(closed) || location.pathname);
    render();
  });

  // Someone can still arrive at a shared state, or edit the hash by hand.
  addEventListener("hashchange", () => {
    closed = readHash(location.hash);
    render();
  });

  render();

  // The browser resolves a fragment against the page as it was parsed — before
  // any of this exists. It scrolls to an offset that is correct for a page of
  // masthead-plus-footer, then the interface is inserted above and that offset
  // lands somewhere in the middle of the map. Re-apply the fragment now that
  // the sections it names are actually there.
  const fragment = location.hash;
  if (fragment.length > 1 && !fragment.startsWith("#closed")) {
    try {
      document.querySelector(fragment)?.scrollIntoView();
    } catch {
      // Not a valid selector — someone hand-edited the hash. Leave it alone.
    }
  }
}
