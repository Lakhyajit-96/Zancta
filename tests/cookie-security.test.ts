import { describe, it, expect } from "vitest";
import { oauthIntentCookieName, oauthIntentCookieOptions } from "@/lib/oauth-intent";

describe("authentication cookie options", () => {
  it("OAuth intent cookie is HttpOnly, host-only, path /, SameSite=Lax, and has no Domain", () => {
    const opts = oauthIntentCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
    expect(opts.maxAge).toBe(10 * 60);
    expect("domain" in opts).toBe(false);
    const name = oauthIntentCookieName();
    expect(name === "__Host-zancta.oauth-intent" || name === "zancta.oauth-intent").toBe(true);
  });
});
