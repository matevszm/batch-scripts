import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });

  const tempFilePath = `${filePath}.tmp`;
  const content = `${JSON.stringify(value, null, 2)}\n`;

  await writeFile(tempFilePath, content, "utf8");
  await rename(tempFilePath, filePath);
}
