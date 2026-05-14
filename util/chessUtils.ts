export function getLevelName(level: number) {
  const names = ["", "ROOKIE", "CASUAL", "SKILLED", "ADVANCED", "MASTER", "EXPERT"];
  return names[level];
}