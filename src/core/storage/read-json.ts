import { readFile } from "node:fs/promises";
import { ZodType } from "zod";

export async function readJsonFile<T>(filePath: string, schema: ZodType<T>): Promise<T> {
  const rawContent = await readFile(filePath, "utf8");
  const parsedContent: unknown = JSON.parse(rawContent);
  return schema.parse(parsedContent);
}
