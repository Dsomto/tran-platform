// Browser-side flag derivation — mirrors src/lib/flag.ts but uses WebCrypto
// so widgets can render the intern's per-task flag without a round-trip.

async function hmacHex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  const bytes = new Uint8Array(sig);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function computeFlagBrowser(flagSalt: string, internId: string): Promise<string> {
  const mac = await hmacHex(flagSalt, internId);
  return `TRAN{${mac.slice(0, 16)}}`;
}

export async function deriveSecretBrowser(
  salt: string,
  internId: string,
  len = 16
): Promise<string> {
  const mac = await hmacHex(salt, internId);
  return mac.slice(0, len);
}
