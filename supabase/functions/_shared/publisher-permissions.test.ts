import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { robotsRules, isPathAllowed, tdmReservedByPolicy, tdmReservedByResponse, looksPaywalled } from "./publisher-permissions.ts";

Deno.test("robots: Disallow for * blocks the article path", () => {
  const rules = robotsRules("User-agent: *\nDisallow: /news/\n");
  assertEquals(isPathAllowed(rules, "/news/story-1"), false);
  assertEquals(isPathAllowed(rules, "/markets/story-1"), true);
});
Deno.test("robots: longest match wins and Allow overrides", () => {
  const rules = robotsRules("User-agent: *\nDisallow: /\nAllow: /public/\n");
  assertEquals(isPathAllowed(rules, "/public/a"), true);
  assertEquals(isPathAllowed(rules, "/private/a"), false);
});
Deno.test("robots: a group for our agent replaces the * group", () => {
  const rules = robotsRules("User-agent: *\nAllow: /\n\nUser-agent: PortAI\nDisallow: /\n");
  assertEquals(isPathAllowed(rules, "/anything"), false);
});
Deno.test("tdmrep.json reservation = 1 blocks matching paths", () => {
  assertEquals(tdmReservedByPolicy([{ location: "/*", "tdm-reservation": 1 }], "/a/b"), true);
  assertEquals(tdmReservedByPolicy([{ location: "/*", "tdm-reservation": 0 }], "/a/b"), false);
});
Deno.test("tdm-reservation header and meta tag are honoured", () => {
  assertEquals(tdmReservedByResponse(new Headers({ "tdm-reservation": "1" }), ""), true);
  assertEquals(tdmReservedByResponse(new Headers(), '<meta name="tdm-reservation" content="1">'), true);
  assertEquals(tdmReservedByResponse(new Headers(), "<title>x</title>"), false);
});
Deno.test("paywall: isAccessibleForFree false or truncated text", () => {
  assertEquals(looksPaywalled('{"isAccessibleForFree": false}', "x".repeat(3000)), true);
  assertEquals(looksPaywalled("<html></html>", "short"), true);
  assertEquals(looksPaywalled("<html></html>", "x".repeat(3000)), false);
});
