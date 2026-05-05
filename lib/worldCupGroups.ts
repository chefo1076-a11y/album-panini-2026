export type WorldCupGroupId =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

export type TeamCode =
  | "MEX"
  | "RSA"
  | "KOR"
  | "CZE"
  | "CAN"
  | "BIH"
  | "QAT"
  | "SUI"
  | "BRA"
  | "MAR"
  | "HAI"
  | "SCO"
  | "USA"
  | "PAR"
  | "AUS"
  | "TUR"
  | "GER"
  | "CUW"
  | "CIV"
  | "ECU"
  | "NED"
  | "JPN"
  | "SWE"
  | "TUN"
  | "BEL"
  | "EGY"
  | "IRN"
  | "NZL"
  | "ESP"
  | "CPV"
  | "KSA"
  | "URU"
  | "FRA"
  | "SEN"
  | "IRQ"
  | "NOR"
  | "ARG"
  | "ALG"
  | "AUT"
  | "JOR"
  | "POR"
  | "COD"
  | "UZB"
  | "COL"
  | "ENG"
  | "CRO"
  | "GHA"
  | "PAN";

export type WorldCupTeam = {
  name: string;
  code: TeamCode;
  flag: string;
};

export type WorldCupGroup = {
  id: WorldCupGroupId;
  name: string;
  teams: WorldCupTeam[];
};

export type StickerAssignment = {
  group: WorldCupGroup;
  team: WorldCupTeam;
};

export const WORLD_CUP_GROUPS: WorldCupGroup[] = [
  {
    id: "A",
    name: "Grupo A",
    teams: [
      { name: "Mexico", code: "MEX", flag: "🇲🇽" },
      { name: "South Africa", code: "RSA", flag: "🇿🇦" },
      { name: "Korea Republic", code: "KOR", flag: "🇰🇷" },
      { name: "Czechia", code: "CZE", flag: "🇨🇿" }
    ]
  },
  {
    id: "B",
    name: "Grupo B",
    teams: [
      { name: "Canada", code: "CAN", flag: "🇨🇦" },
      { name: "Bosnia and Herzegovina", code: "BIH", flag: "🇧🇦" },
      { name: "Qatar", code: "QAT", flag: "🇶🇦" },
      { name: "Switzerland", code: "SUI", flag: "🇨🇭" }
    ]
  },
  {
    id: "C",
    name: "Grupo C",
    teams: [
      { name: "Brazil", code: "BRA", flag: "🇧🇷" },
      { name: "Morocco", code: "MAR", flag: "🇲🇦" },
      { name: "Haiti", code: "HAI", flag: "🇭🇹" },
      { name: "Scotland", code: "SCO", flag: "🏴" }
    ]
  },
  {
    id: "D",
    name: "Grupo D",
    teams: [
      { name: "United States", code: "USA", flag: "🇺🇸" },
      { name: "Paraguay", code: "PAR", flag: "🇵🇾" },
      { name: "Australia", code: "AUS", flag: "🇦🇺" },
      { name: "Turkiye", code: "TUR", flag: "🇹🇷" }
    ]
  },
  {
    id: "E",
    name: "Grupo E",
    teams: [
      { name: "Germany", code: "GER", flag: "🇩🇪" },
      { name: "Curacao", code: "CUW", flag: "🇨🇼" },
      { name: "Cote d'Ivoire", code: "CIV", flag: "🇨🇮" },
      { name: "Ecuador", code: "ECU", flag: "🇪🇨" }
    ]
  },
  {
    id: "F",
    name: "Grupo F",
    teams: [
      { name: "Netherlands", code: "NED", flag: "🇳🇱" },
      { name: "Japan", code: "JPN", flag: "🇯🇵" },
      { name: "Sweden", code: "SWE", flag: "🇸🇪" },
      { name: "Tunisia", code: "TUN", flag: "🇹🇳" }
    ]
  },
  {
    id: "G",
    name: "Grupo G",
    teams: [
      { name: "Belgium", code: "BEL", flag: "🇧🇪" },
      { name: "Egypt", code: "EGY", flag: "🇪🇬" },
      { name: "IR Iran", code: "IRN", flag: "🇮🇷" },
      { name: "New Zealand", code: "NZL", flag: "🇳🇿" }
    ]
  },
  {
    id: "H",
    name: "Grupo H",
    teams: [
      { name: "Spain", code: "ESP", flag: "🇪🇸" },
      { name: "Cabo Verde", code: "CPV", flag: "🇨🇻" },
      { name: "Saudi Arabia", code: "KSA", flag: "🇸🇦" },
      { name: "Uruguay", code: "URU", flag: "🇺🇾" }
    ]
  },
  {
    id: "I",
    name: "Grupo I",
    teams: [
      { name: "France", code: "FRA", flag: "🇫🇷" },
      { name: "Senegal", code: "SEN", flag: "🇸🇳" },
      { name: "Iraq", code: "IRQ", flag: "🇮🇶" },
      { name: "Norway", code: "NOR", flag: "🇳🇴" }
    ]
  },
  {
    id: "J",
    name: "Grupo J",
    teams: [
      { name: "Argentina", code: "ARG", flag: "🇦🇷" },
      { name: "Algeria", code: "ALG", flag: "🇩🇿" },
      { name: "Austria", code: "AUT", flag: "🇦🇹" },
      { name: "Jordan", code: "JOR", flag: "🇯🇴" }
    ]
  },
  {
    id: "K",
    name: "Grupo K",
    teams: [
      { name: "Portugal", code: "POR", flag: "🇵🇹" },
      { name: "DR Congo", code: "COD", flag: "🇨🇩" },
      { name: "Uzbekistan", code: "UZB", flag: "🇺🇿" },
      { name: "Colombia", code: "COL", flag: "🇨🇴" }
    ]
  },
  {
    id: "L",
    name: "Grupo L",
    teams: [
      { name: "England", code: "ENG", flag: "🏴" },
      { name: "Croatia", code: "CRO", flag: "🇭🇷" },
      { name: "Ghana", code: "GHA", flag: "🇬🇭" },
      { name: "Panama", code: "PAN", flag: "🇵🇦" }
    ]
  }
];

export const WORLD_CUP_TEAMS = WORLD_CUP_GROUPS.flatMap((group) =>
  group.teams.map((team) => ({ ...team, groupId: group.id, groupName: group.name }))
);

// Legacy helper kept only for compatibility with older experiments. The current
// app uses lib/checklist.ts as the single source of truth for official codes.
// This should be replaced by the official checklist mapping when it exists.
export function getStickerAssignment(stickerNumber: number): StickerAssignment {
  const teamIndex = getProvisionalTeamIndex(stickerNumber);
  const groupIndex = Math.floor(teamIndex / 4);
  const teamIndexInGroup = teamIndex % 4;
  const group = WORLD_CUP_GROUPS[groupIndex];

  return {
    group,
    team: group.teams[teamIndexInGroup]
  };
}

function getProvisionalTeamIndex(stickerNumber: number) {
  let cursor = 1;

  for (let teamIndex = 0; teamIndex < WORLD_CUP_TEAMS.length; teamIndex += 1) {
    const stickersForTeam = teamIndex < 20 ? 21 : 20;
    const lastSticker = cursor + stickersForTeam - 1;

    if (stickerNumber >= cursor && stickerNumber <= lastSticker) {
      return teamIndex;
    }

    cursor = lastSticker + 1;
  }

  return WORLD_CUP_TEAMS.length - 1;
}
