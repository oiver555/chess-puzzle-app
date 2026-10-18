import { soundsEnabled } from "@/util/settings";

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
export const playSound = async (player: any, isCurrent: () => boolean = () => true): Promise<void> => {
  try {
    if (!soundsEnabled() || !isCurrent()) return;
    await player.seekTo(0);
    if (soundsEnabled() && isCurrent()) await player.play();
  } catch (error) {
    console.log("Could not play audio:", error);
  }
};
