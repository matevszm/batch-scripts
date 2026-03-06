const supportsColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

function wrap(code: string, value: string): string {
  return supportsColor ? `\u001b[${code}m${value}\u001b[0m` : value;
}

function wrap256(code: number, value: string): string {
  return supportsColor ? `\u001b[38;5;${code}m${value}\u001b[0m` : value;
}

export const ansi = {
  bold: (value: string): string => wrap("1", value),
  dim: (value: string): string => wrap("2", value),
  red: (value: string): string => wrap("31", value),
  green: (value: string): string => wrap("32", value),
  yellow: (value: string): string => wrap("33", value),
  blue: (value: string): string => wrap("34", value),
  cyan: (value: string): string => wrap("36", value),
  gray: (value: string): string => wrap("90", value),
  slate: (value: string): string => wrap256(110, value),
  mist: (value: string): string => wrap256(152, value),
  ice: (value: string): string => wrap256(117, value),
};
