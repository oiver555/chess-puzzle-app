export function getLevelName(level: number) {
  const names = ["", "ROOKIE", "CASUAL", "SKILLED", "ADVANCED", "MASTER", "EXPERT"];
  return names[level];
}

export function getEcoCategory(eco: string) {
  const letter = eco.charAt(0).toUpperCase();

  switch (letter) {
    case "A":
      return "Flank / Irregular";
    case "B":
      return "Semi-Open Games";
    case "C":
      return "Open Games";
    case "D":
      return "Closed Games";
    case "E":
      return "Indian Defenses";
    default:
      return "Unknown";
  }
}