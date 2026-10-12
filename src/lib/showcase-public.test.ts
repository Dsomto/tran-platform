import assert from "node:assert/strict";
import test from "node:test";
import {
  ballotShapeError,
  displayName,
  driveEmbedUrl,
  driveOpenUrl,
  driveThumbnailUrl,
  orderForViewer,
  PUBLIC_ENTRY_KEYS,
  safePublicUrl,
  showcaseSlug,
  stableShuffle,
  type PublicShowcaseEntry,
} from "./showcase-public";

const ID_A = "a".repeat(24);
const ID_B = "b".repeat(24);
const ID_C = "c".repeat(24);

test("Drive links convert to /preview for every sharing variant the finalists used", () => {
  const variants = [
    "https://drive.google.com/file/d/1AXJcyCiDJ9BtQ9WTXpZu-Z8tRyRbJdlc/view?usp=sharing",
    "https://drive.google.com/file/d/1AXJcyCiDJ9BtQ9WTXpZu-Z8tRyRbJdlc/view?usp=drivesdk",
    "https://drive.google.com/file/d/1AXJcyCiDJ9BtQ9WTXpZu-Z8tRyRbJdlc/view?usp=drive_link",
    "https://drive.google.com/file/d/1AXJcyCiDJ9BtQ9WTXpZu-Z8tRyRbJdlc/view",
    "https://drive.google.com/open?id=1AXJcyCiDJ9BtQ9WTXpZu-Z8tRyRbJdlc",
    "  https://drive.google.com/file/d/1AXJcyCiDJ9BtQ9WTXpZu-Z8tRyRbJdlc/view?usp=sharing  ",
  ];
  for (const v of variants) {
    assert.equal(driveEmbedUrl(v), "https://drive.google.com/file/d/1AXJcyCiDJ9BtQ9WTXpZu-Z8tRyRbJdlc/preview", v);
    assert.equal(driveOpenUrl(v), "https://drive.google.com/file/d/1AXJcyCiDJ9BtQ9WTXpZu-Z8tRyRbJdlc/view", v);
    assert.equal(driveThumbnailUrl(v), "https://lh3.googleusercontent.com/d/1AXJcyCiDJ9BtQ9WTXpZu-Z8tRyRbJdlc=w1280", v);
  }
});

test("non-file or unsafe Drive links never become an embed", () => {
  for (const bad of [
    "https://drive.google.com/drive/folders/1oHAbdoAasMhYv-sAeNEolKowtIrkDsj9?usp=drive_link",
    "http://drive.google.com/file/d/1AXJcyCiDJ9BtQ9WTXpZu-Z8tRyRbJdlc/view",
    "https://evil.example/file/d/1AXJcyCiDJ9BtQ9WTXpZu-Z8tRyRbJdlc/view",
    "https://drive.google.com.evil.example/file/d/1AXJcyCiDJ9BtQ9WTXpZu-Z8tRyRbJdlc/view",
    "https://docs.google.com/document/d/1AXJcyCiDJ9BtQ9WTXpZu-Z8tRyRbJdlc/edit",
    "javascript:alert(1)",
    "",
    null,
  ]) {
    assert.equal(driveEmbedUrl(bad), null, String(bad));
  }
});

test("project links must be public https URLs", () => {
  assert.equal(safePublicUrl("https://github.com/adeyemisodiq/AuthPath"), "https://github.com/adeyemisodiq/AuthPath");
  assert.equal(safePublicUrl("https://breaktheroot.com/"), "https://breaktheroot.com/");
  assert.equal(
    safePublicUrl("https://github.com/Nada-cybersecurity/cyberPASS_UBI_project.git"),
    "https://github.com/Nada-cybersecurity/cyberPASS_UBI_project.git",
  );
  for (const bad of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://github.com/x",
    "https://user:pass@github.com/x",
    "https://localhost/x",
    "https://127.0.0.1/x",
    "https://10.0.0.5/x",
    "https://intranet/x",
    "not a url",
  ]) {
    assert.equal(safePublicUrl(bad), null, bad);
  }
});

test("finalist names are normalised only when typed in one case", () => {
  assert.equal(displayName("ETIGBUE ADAEZE", "CLARET"), "Etigbue Adaeze Claret");
  assert.equal(displayName("Nada", "maach"), "Nada Maach");
  assert.equal(displayName("Adegbite Adeyemi", "sodiq"), "Adegbite Adeyemi Sodiq");
  assert.equal(displayName("Mercy", "McDavid"), "Mercy McDavid");
});

test("slugs are URL-safe and derived from name and title", () => {
  assert.equal(showcaseSlug("Hamza Hashim", "Break The Root"), "hamza-hashim-break-the-root");
  assert.equal(
    showcaseSlug("Elizabeth Nyimenka Benson", "Silent Success — when a security tool reports success"),
    "elizabeth-nyimenka-benson-silent-success",
  );
  assert.match(showcaseSlug("Adegbite Adeyemi Sodiq", "AuthPath: Automated Authorization"), /^[a-z0-9-]+$/);
});

test("display order is stable for one viewer and differs across viewers", () => {
  const items = Array.from({ length: 4 }, (_, i) => ({ id: String(i).repeat(24).slice(0, 24) }));
  const first = stableShuffle(items, "viewer-one").map((i) => i.id);
  for (let i = 0; i < 20; i += 1) assert.deepEqual(stableShuffle(items, "viewer-one").map((x) => x.id), first);
  // Input order must not matter (database order is not an input).
  assert.deepEqual(stableShuffle([...items].reverse(), "viewer-one").map((x) => x.id), first);

  // Across many viewers every item should lead sometimes: nobody owns slot one.
  const leaders = new Map<string, number>();
  for (let v = 0; v < 400; v += 1) {
    const lead = stableShuffle(items, `viewer-${v}`)[0].id;
    leaders.set(lead, (leaders.get(lead) ?? 0) + 1);
  }
  assert.equal(leaders.size, 4);
  for (const n of leaders.values()) assert.ok(n > 60 && n < 140, `first-slot share ${n}/400 is not roughly even`);
});

test("order groups by track and never reads vote data", () => {
  const entry = (id: string, track: PublicShowcaseEntry["track"]): PublicShowcaseEntry => ({
    id, slug: id, track, finalistName: "x", projectTitle: "x", projectSummary: "x", projectUrl: null, videoEmbedUrl: null, videoOpenUrl: null, thumbnailUrl: null,
  });
  const ordered = orderForViewer([entry(ID_C, "GRC"), entry(ID_A, "SOC_ANALYSIS"), entry(ID_B, "ETHICAL_HACKING")], "seed");
  assert.deepEqual(ordered.map((e) => e.track), ["SOC_ANALYSIS", "ETHICAL_HACKING", "GRC"]);
});

test("the public entry shape has no count, rank, percentage or popularity field", () => {
  const forbidden = /vote|count|percent|rank|total|turnout|lead|trend|popular|score/i;
  for (const key of PUBLIC_ENTRY_KEYS) assert.doesNotMatch(key, forbidden, key);
  assert.deepEqual([...PUBLIC_ENTRY_KEYS].sort(), [
    "finalistName", "id", "projectSummary", "projectTitle", "projectUrl", "slug", "thumbnailUrl", "track", "videoEmbedUrl", "videoOpenUrl",
  ]);
});

test("ballot shape follows the one-per-track rule", () => {
  assert.equal(ballotShapeError({ SOC_ANALYSIS: ID_A, ETHICAL_HACKING: ID_B, GRC: ID_C }), null);
  assert.match(ballotShapeError({ SOC_ANALYSIS: ID_A, ETHICAL_HACKING: ID_B }) ?? "", /GRC/);
  assert.match(ballotShapeError({ SOC_ANALYSIS: ID_A, ETHICAL_HACKING: ID_B, GRC: ID_C, RED_TEAM: ID_A }) ?? "", /unknown track/);
  assert.match(ballotShapeError({ SOC_ANALYSIS: [ID_A, ID_B], ETHICAL_HACKING: ID_B, GRC: ID_C }) ?? "", /invalid project/);
  assert.match(ballotShapeError({ SOC_ANALYSIS: "1; drop", ETHICAL_HACKING: ID_B, GRC: ID_C }) ?? "", /invalid project/);
  assert.ok(ballotShapeError(null));
  assert.ok(ballotShapeError([ID_A]));
});
