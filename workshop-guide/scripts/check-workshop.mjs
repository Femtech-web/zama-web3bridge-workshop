import { readdir, readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { todos, regionPattern } from "./todos.mjs";

const root = resolve(import.meta.dirname, "../..");
const ignored = new Set([
  "node_modules",
  "artifacts",
  "cache",
  "types",
  "fhevmTemp",
  ".next",
  "deployments",
  ".workshop-backups",
]);
async function sourceFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      ignored.has(entry.name) ||
      (entry.name.startsWith(".env") && entry.name !== ".env.example") ||
      ["deployment.json", "tsconfig.tsbuildinfo"].includes(entry.name)
    )
      continue;
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await sourceFiles(absolute)));
    else result.push(absolute);
  }
  return result;
}
const solutionFiles = await sourceFiles(resolve(root, "solution"));
const starterFiles = await sourceFiles(resolve(root, "starter"));
const paths = (files, project) =>
  files
    .map((file) => relative(resolve(root, project), file))
    .sort()
    .join("\n");
if (paths(solutionFiles, "solution") !== paths(starterFiles, "starter"))
  throw new Error("Starter and solution source trees differ.");
for (const todo of todos) {
  const starter = await readFile(resolve(root, "starter", todo.file), "utf8");
  const solution = await readFile(resolve(root, "solution", todo.file), "utf8");
  const block = starter.match(regionPattern(todo.number))?.[2];
  if (!block?.includes(`TODO ${todo.number}:`) || !block.includes(todo.docs))
    throw new Error(`Starter TODO ${todo.number} or its documentation link is missing.`);
  if (!solution.match(regionPattern(todo.number))?.[2] || /TODO \d+:/.test(solution))
    throw new Error(`Solution TODO ${todo.number} is incomplete.`);
}
const guide = await readFile(resolve(root, "workshop-guide/LIVE_WORKSHOP.md"), "utf8");
let previousPosition = -1;
for (const todo of todos) {
  const position = guide.indexOf(`## Step ${todo.number} —`);
  if (position <= previousPosition)
    throw new Error(`Live guide is out of order at TODO ${todo.number}.`);
  previousPosition = position;
}
for (const file of solutionFiles.filter((file) => /\.(ts|tsx|sol|mjs)$/.test(file))) {
  const content = await readFile(file, "utf8");
  if (
    /frontend\/(lib|hooks|components)/.test(file) &&
    /console\.(log|debug|info|error)/.test(content)
  )
    throw new Error(`Application logging found: ${file}`);
  if (file.includes("frontend/") && /from ["']ethers["']/.test(content))
    throw new Error(`Unexpected ethers frontend import: ${file}`);
  if (/(?:PRIVATE_KEY|privateKey)\s*[:=]\s*["']0x[0-9a-fA-F]{64}/.test(content))
    throw new Error(`Possible committed private key: ${file}`);
}
const payroll = await readFile(resolve(root, "solution/contracts/ConfidentialPayroll.sol"), "utf8");
if (/makePubliclyDecryptable|requestDecryption/.test(payroll))
  throw new Error("Salary contract contains a public decryption path.");
console.info(
  `PASS: matching source trees; ${todos.length} documented TODOs; complete solution; ordered guide; source confidentiality checks.`,
);
