import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { todos, regionPattern } from "./todos.mjs";

const root = resolve(import.meta.dirname, "../..");
const step = Number(process.argv[2]);
if (!Number.isInteger(step) || step < 1 || step > 14)
  throw new Error("Usage: node workshop-guide/scripts/checkpoint.mjs <1..14> [--apply]");
const apply = process.argv.includes("--apply");
const backup = resolve(root, ".workshop-backups", new Date().toISOString().replaceAll(":", "-"));
const affected = new Set(todos.filter((todo) => todo.number <= step).map((todo) => todo.file));
for (const file of affected) {
  const target = resolve(root, "starter", file);
  let content = await readFile(target, "utf8");
  const answerSource = await readFile(resolve(root, "solution", file), "utf8");
  for (const todo of todos.filter((item) => item.file === file && item.number <= step)) {
    const pattern = regionPattern(todo.number);
    const answer = answerSource.match(pattern)?.[2];
    if (answer === undefined || !pattern.test(content))
      throw new Error(`Cannot locate TODO ${todo.number}; no files changed for ${file}.`);
    content = content.replace(pattern, (_, start, _previous, end) => start + answer + end);
  }
  if (apply) {
    const backupFile = resolve(backup, file);
    await mkdir(dirname(backupFile), { recursive: true });
    await copyFile(target, backupFile);
    await writeFile(target, content);
  }
  console.info(`${apply ? "Recovered" : "Would recover"}: starter/${file}`);
}
console.info(
  apply
    ? `Checkpoint ${step} applied. Previous files saved in ${backup}.`
    : "Preview only. Add --apply to recover; edited files will be backed up first.",
);
