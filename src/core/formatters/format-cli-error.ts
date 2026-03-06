import { ansi } from "./ansi.js";

export function formatCliError(error: unknown): string {
  if (error instanceof Error) {
    return [
      `${ansi.red("💥 Command failed")}`,
      `${ansi.gray("└─")} ${error.message}`,
    ].join("\n");
  }

  return [
    `${ansi.red("💥 Command failed")}`,
    `${ansi.gray("└─")} Unknown error`,
  ].join("\n");
}
