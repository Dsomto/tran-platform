import assert from "node:assert/strict";
import test from "node:test";
import net from "node:net";

// These tests drive a real SMTP conversation against a local stub server so
// the failure classification is checked against what nodemailer actually
// throws, not against a hand-written fake error. Getting this wrong marks a
// deliverable address as permanently FAILED over a transient throttle, or
// keeps reconnecting into a provider block — both have happened.

type Mode = "ok" | "permanent" | "rate-limit" | "block";

async function withStubSmtp<T>(
  run: (setMode: (m: Mode) => void) => Promise<T>
): Promise<T> {
  let mode: Mode = "ok";

  const server = net.createServer((sock) => {
    // A provider block looks like this: the socket opens, then closes before
    // the 220 greeting ever arrives.
    if (mode === "block") { sock.destroy(); return; }

    sock.write("220 stub ESMTP\r\n");
    sock.on("data", (buf) => {
      for (const line of buf.toString().split("\r\n").filter(Boolean)) {
        if (/^(EHLO|HELO)/i.test(line)) sock.write("250-stub\r\n250 OK\r\n");
        else if (/^MAIL FROM/i.test(line)) sock.write("250 OK\r\n");
        else if (/^RCPT TO/i.test(line)) {
          if (mode === "permanent") sock.write("550 5.1.1 No such user\r\n");
          else if (mode === "rate-limit") sock.write("421 4.7.0 Too many requests\r\n");
          else sock.write("250 OK\r\n");
        }
        else if (/^DATA/i.test(line)) sock.write("354 go ahead\r\n");
        else if (line === ".") sock.write("250 Queued\r\n");
        else if (/^QUIT/i.test(line)) { sock.write("221 Bye\r\n"); sock.end(); }
      }
    });
    sock.on("error", () => { /* client-side aborts are expected here */ });
  });

  await new Promise<void>((r) => server.listen(0, r));
  const { port } = server.address() as net.AddressInfo;

  const saved = { ...process.env };
  process.env.SMTP_HOST = "127.0.0.1";
  process.env.SMTP_PORT = String(port);
  process.env.SMTP_USER = "stub";
  process.env.SMTP_PASS = "stub";

  try {
    return await run((m) => { mode = m; });
  } finally {
    Object.assign(process.env, saved);
    await new Promise<void>((r) => server.close(() => r()));
  }
}

function rows(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    toEmail: `intern${i}@example.test`, subject: "Result", body: "<p>hi</p>",
  }));
}

test("a good batch marks every row sent", async () => {
  await withStubSmtp(async (setMode) => {
    const { pacedSend } = await import("./smtp-send");
    setMode("ok");
    const marks: string[] = [];
    const res = await pacedSend(rows(3), async (_i, o) => { marks.push(o.kind); }, { intervalMs: 10 });
    assert.deepEqual(marks, ["sent", "sent", "sent"]);
    assert.equal(res.sent, 3);
  });
});

test("a 5xx rejection is permanent — fail the row now", async () => {
  await withStubSmtp(async (setMode) => {
    const { pacedSend } = await import("./smtp-send");
    setMode("permanent");
    const marks: string[] = [];
    const res = await pacedSend(rows(2), async (_i, o) => { marks.push(o.kind); }, { intervalMs: 10 });
    assert.deepEqual(marks, ["permanent", "permanent"]);
    assert.equal(res.permanent, 2);
  });
});

test("a 4xx throttle is transient — the row keeps its retries", async () => {
  await withStubSmtp(async (setMode) => {
    const { pacedSend } = await import("./smtp-send");
    setMode("rate-limit");
    const marks: string[] = [];
    const res = await pacedSend(rows(2), async (_i, o) => { marks.push(o.kind); }, { intervalMs: 10 });
    assert.deepEqual(marks, ["transient", "transient"]);
    assert.equal(res.transient, 2);
  });
});

test("a provider block aborts the run instead of reconnecting", async () => {
  await withStubSmtp(async (setMode) => {
    const { pacedSend } = await import("./smtp-send");
    setMode("block");
    const marks: string[] = [];
    const res = await pacedSend(rows(5), async (_i, o) => { marks.push(o.kind); }, { intervalMs: 10 });
    // Exactly one row is reported blocked; the rest are never attempted.
    assert.deepEqual(marks, ["blocked"]);
    assert.equal(res.skipped.length, 5);
    assert.ok(res.blockedReason, "the block must be reported to the caller");
    assert.equal(res.sent, 0);
  });
});

test("sends are paced, not burst", async () => {
  await withStubSmtp(async (setMode) => {
    const { pacedSend } = await import("./smtp-send");
    setMode("ok");
    const started = Date.now();
    await pacedSend(rows(3), async () => {}, { intervalMs: 300 });
    // Three messages means two gaps between them.
    assert.ok(Date.now() - started >= 600, "expected at least two pacing gaps");
  });
});

test("the time budget stops the run cleanly and reports what was left", async () => {
  await withStubSmtp(async (setMode) => {
    const { pacedSend } = await import("./smtp-send");
    setMode("ok");
    const res = await pacedSend(rows(10), async () => {}, {
      intervalMs: 300,
      deadline: Date.now() + 30_500,
    });
    assert.equal(res.timedOut, true);
    assert.ok(res.skipped.length > 0, "unsent rows must be handed back to the caller");
  });
});
