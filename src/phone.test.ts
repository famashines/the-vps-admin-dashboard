import assert from "node:assert/strict";
import { test } from "node:test";
import { toE164 } from "./phone.ts";

test("Pakistani mobile numbers become E.164", () => {
  for (const input of ["0300 1234567", "0300-1234567", "03001234567", "+92 300 1234567", "92 300 1234567", "0092 300 1234567", "(0300) 123-4567"]) {
    assert.equal(toE164(input), "+923001234567", input);
  }
});

test("other input stays as typed without spaces, so the server can refuse it", () => {
  assert.equal(toE164("+44 20 7946 0958"), "+442079460958");
  assert.equal(toE164("1234"), "1234");
  assert.equal(toE164("0300 123"), "0300123");
});
