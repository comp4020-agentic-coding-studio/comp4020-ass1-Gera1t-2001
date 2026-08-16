import { start } from "./src/ui/app";

// `[data-app]` is a contract between index.html and this entry script, so the
// lookup and its null case stay here — the wiring itself takes a root it can
// rely on, which is what lets the tests drive it with a root of their own.
const root = document.querySelector<HTMLElement>("[data-app]");

if (root) start(root);
