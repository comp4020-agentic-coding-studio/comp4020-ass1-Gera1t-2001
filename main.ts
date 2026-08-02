import { allocate } from "./src/model/allocate";
import type { ChokepointId } from "./src/model/types";
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
}
