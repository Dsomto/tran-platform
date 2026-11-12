import { PatternTorch } from "./pattern-torch";

/** Fixed kente-inspired hairline pattern behind the page (styled in globals.css),
 *  plus a torch that lights the pattern up under the mouse. */
export function SiteBackground() {
  return (
    <>
      <div className="site-bg" aria-hidden="true" />
      <PatternTorch />
    </>
  );
}
