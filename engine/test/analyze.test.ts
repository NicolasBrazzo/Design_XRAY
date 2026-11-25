import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeUrl, AnalyzeError } from "../src/index.ts";

// Only the checks that happen before the browser opens: no network needed.

test("an invalid URL rejects with code INVALID_URL", async () => {
  await assert.rejects(analyzeUrl("not a url"), (error) => {
    assert.ok(error instanceof AnalyzeError);
    assert.equal(error.code, "INVALID_URL");
    return true;
  });
});

test("a protocol other than http/https rejects with code INVALID_URL", async () => {
  await assert.rejects(analyzeUrl("file:///etc/passwd"), (error) => {
    assert.ok(error instanceof AnalyzeError);
    assert.equal(error.code, "INVALID_URL");
    return true;
  });
});

test("an already aborted signal rejects with code ABORTED without opening the browser", async () => {
  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    analyzeUrl("https://example.com", { signal: controller.signal }),
    (error) => {
      assert.ok(error instanceof AnalyzeError);
      assert.equal(error.code, "ABORTED");
      return true;
    },
  );
});
