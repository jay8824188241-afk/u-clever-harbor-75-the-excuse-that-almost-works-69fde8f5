// The Excuse That Almost Works — make.fun bounty entry generator.
// Deterministic: writes a fixed, original excuse to
// $MAKEFUN_OUTPUT_DIR/entry.txt, then reads it back and self-checks it.
// Node 22+ stdlib only. No network, no randomness, no timestamps.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENTRY = [
  "My alarm did go off — at 6 a.m., exactly as set.",
  "The problem was my phone was still on silent from yesterday's meeting, so I slept straight through it.",
  "I even have the alarm history to prove it — which is somehow worse than having no excuse at all.",
].join("\n") + "\n";

const MAX_LINE_CHARS = 280;
const MAX_LINES = 5;

function fail(message: string): never {
  console.error(`self-check failed: ${message}`);
  process.exit(1);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR;
if (!outDir) fail("MAKEFUN_OUTPUT_DIR is not set");

mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.txt");
writeFileSync(outPath, ENTRY, "utf8");

// Read back and self-check.
const written = readFileSync(outPath, "utf8");
if (written.length === 0) fail("entry is empty");
if (written !== ENTRY) fail("written entry is not byte-identical to expected content");
// Byte-length check: the entry contains non-ASCII characters (em dashes),
// so char length alone is not enough — verify the exact UTF-8 byte length.
const expectedBytes = Buffer.byteLength(ENTRY, "utf8");
const writtenBytes = Buffer.byteLength(written, "utf8");
if (writtenBytes !== expectedBytes) {
  fail(`byte length mismatch: expected ${expectedBytes}, got ${writtenBytes}`);
}
if (writtenBytes === 0) fail("entry is zero bytes");
const lines = written.replace(/\n$/, "").split("\n");
if (lines.length === 0 || lines.length > MAX_LINES) {
  fail(`expected 1-${MAX_LINES} lines, got ${lines.length}`);
}
for (const line of lines) {
  if (line.length > MAX_LINE_CHARS) {
    fail(`line exceeds ${MAX_LINE_CHARS} chars (${line.length}): ${line}`);
  }
  if (line.trim().length === 0) fail("entry contains a blank line");
}

console.log(`wrote ${outPath} (${lines.length} lines, ${written.length} chars)`);
