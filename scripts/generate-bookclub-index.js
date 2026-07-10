// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

const directory = path.join(__dirname, "../src/data/bookclub");
const indexPath = path.join(directory, "index.ts");

const files = fs
  .readdirSync(directory)
  .filter((file) => /^[0-9]{4}\.ts$/.test(file) && file !== "index.ts")
  .sort((a, b) => Number(a.slice(0, 4)) - Number(b.slice(0, 4)));

const imports = files
  .map((file) => `import bookclub${file.slice(0, 4)} from "./${file.replace(/\.ts$/, "")}";`)
  .join("\n");

const exportedArray = `export const bookclubCalendars = [\n${files
  .map((file) => `  bookclub${file.slice(0, 4)},`)
  .join("\n")}\n] as const;`;

const content = `import type { BookClubCalendarDefinition } from "@/lib/bookclub";

${imports}

${exportedArray}

export type { BookClubCalendarDefinition } from "@/lib/bookclub";
`;

fs.writeFileSync(indexPath, content, "utf8");
console.log(`Generated ${path.relative(process.cwd(), indexPath)} with ${files.length} calendar(s).`);
