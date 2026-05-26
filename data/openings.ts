import { MoveDetail } from "@/app/OpeningPractice";
import { getEcoCategory } from "@/util/chessUtils";



export type Opening = {
    eco: string;
    name: string;
    category: string;
    tags: string[];
    type: "defense" | "opening";
    commentary: string;
    description: string;
    mastery: number;
    icon: string;
    color: string;
    difficulty: string;
    side?: "white" | "black";
    moves: string[];
    uci: string[];
    moveDetails: MoveDetail[];
};


export const openings: Opening[] = [
    {
        eco: "D02",
        category: getEcoCategory("D02"),
        tags: ["Solid",
            "Positional",
            "Strategic",
            "Quiet",],
        name: "The London System",
        type: "opening",
        commentary:
            "The London System is a flexible and reliable opening that allows White to build a strong position without taking unnecessary risks.",
        description:
            "The London System focuses on rapid development, center control, and a safe kingside setup.",
        mastery: 65,
        icon: "chess-pawn",
        color: "#FFD95A",
        difficulty: "Beginner",
        side: "white",

        moves: ["d4", "d5", "Nf3", "Nf6", "Bf4"],

        uci: [
            "d2d4",
            "d7d5",
            "g1f3",
            "g8f6",
            "c1f4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White immediately fights for central control.",
            },
            {
                order: "1...",
                move: "d5",
                side: "black",
                piece: "♟",
                text: "Black responds symmetrically and contests the center.",
            },
            {
                order: "2.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White develops the knight and prepares kingside castling.",
            },
            {
                order: "2...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops naturally while attacking the center.",
            },
            {
                order: "3.",
                move: "Bf4",
                side: "white",
                piece: "♗",
                text: "The signature London move. White develops the bishop outside the pawn chain.",
            },
        ],
    },
    {
        eco: "B20",
        category: getEcoCategory("B20"),
        tags: ["Aggressive",
            "Tactical",
            "Sharp",
            "Dynamic",],
        name: "Sicilian Defense",
        type: "defense",
        commentary:
            "One of the most aggressive and popular defenses against e4.",
        description:
            "The Sicilian Defense creates asymmetrical positions and strong counterattacking opportunities.",

        mastery: 20,
        icon: "chess-knight",
        color: "#FF8A65",
        difficulty: "Intermediate",
        side: "black",
        moves: ["e4", "c5"],

        uci: ["e2e4", "c7c5"],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White takes immediate control of the center.",
            },
            {
                order: "1...",
                move: "c5",
                side: "black",
                piece: "♟",
                text: "Black challenges the center asymmetrically and seeks active counterplay.",
            },
        ],
    },

    {
        eco: "C50",
        category: getEcoCategory("C50"),
        tags: ["Strategic",
            "Positional",
            "Tactical",
            "Solid",],
        name: "Italian Game",
        type: "opening",
        commentary:
            "A classical opening focused on quick development and attacking chances.",
        description:
            "The Italian Game develops pieces naturally and targets the vulnerable f7 square.",

        mastery: 45,
        icon: "chess-bishop",
        color: "#81C784",
        difficulty: "Beginner",
        side: "white",

        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],

        uci: [
            "e2e4",
            "e7e5",
            "g1f3",
            "b8c6",
            "f1c4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White claims central space and opens attacking lines.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black mirrors White and contests the center.",
            },
            {
                order: "2.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White attacks the e5 pawn and develops a knight.",
            },
            {
                order: "2...",
                move: "Nc6",
                side: "black",
                piece: "♞",
                text: "Black protects the pawn and develops naturally.",
            },
            {
                order: "3.",
                move: "Bc4",
                side: "white",
                piece: "♗",
                text: "The bishop eyes the weak f7 square and prepares kingside pressure.",
            },
        ],
    },

    {
        eco: "C60",
        category: getEcoCategory("C60"),
        tags: [],
        name: "Ruy Lopez",
        type: "opening",
        commentary:
            "One of the most respected and deeply studied openings in chess.",
        description:
            "The Ruy Lopez increases pressure on Black’s center and knight structure.",

        mastery: 30,
        icon: "chess-bishop",
        color: "#BA68C8",
        difficulty: "Intermediate",
        side: "white",

        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],

        uci: [
            "e2e4",
            "e7e5",
            "g1f3",
            "b8c6",
            "f1b5",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White controls the center and opens lines for development.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black fights for equal central control.",
            },
            {
                order: "2.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White attacks the e5 pawn and develops naturally.",
            },
            {
                order: "2...",
                move: "Nc6",
                side: "black",
                piece: "♞",
                text: "Black protects the pawn and develops a knight.",
            },
            {
                order: "3.",
                move: "Bb5",
                side: "white",
                piece: "♗",
                text: "White pins the knight and increases pressure on the center.",
            },
        ],
    },

    {
        eco: "C44",
        category: getEcoCategory("C44"),
        tags: [],
        name: "Scotch Game",
        type: "opening",
        commentary:
            "A direct opening where White challenges the center early.",
        description:
            "The Scotch Game creates open positions and active piece play.",

        mastery: 15,
        icon: "chess-pawn",
        color: "#4FC3F7",
        difficulty: "Beginner",
        side: "white",

        moves: ["e4", "e5", "Nf3", "Nc6", "d4"],

        uci: [
            "e2e4",
            "e7e5",
            "g1f3",
            "b8c6",
            "d2d4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White claims the center immediately.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black responds symmetrically and contests the center.",
            },
            {
                order: "2.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White develops while attacking the e5 pawn.",
            },
            {
                order: "2...",
                move: "Nc6",
                side: "black",
                piece: "♞",
                text: "Black protects the pawn and develops a knight.",
            },
            {
                order: "3.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White strikes the center aggressively and opens the position.",
            },
        ],
    },

    {
        eco: "B01",
        category: getEcoCategory("B01"),
        tags: [],
        name: "Scandinavian Defense",
        type: "defense",
        commentary:
            "A straightforward defense that immediately challenges White’s center.",
        description:
            "The Scandinavian Defense creates early queen activity and active development.",

        mastery: 10,
        icon: "chess-queen",
        color: "#EF5350",
        difficulty: "Beginner",
        side: "black",

        moves: ["e4", "d5"],

        uci: ["e2e4", "d7d5"],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White establishes central control and opens lines.",
            },
            {
                order: "1...",
                move: "d5",
                side: "black",
                piece: "♟",
                text: "Black immediately challenges White’s central pawn.",
            },
        ],
    },

    {
        eco: "C00",
        category: getEcoCategory("C00"),
        tags: [],
        name: "French Defense",
        type: "defense",
        commentary:
            "A solid defense known for resilient pawn structures.",
        description:
            "The French Defense prepares a strong central pawn chain and counterattacking play.",

        mastery: 18,
        icon: "shield",
        color: "#5C6BC0",
        difficulty: "Intermediate",
        side: "black",

        moves: ["e4", "e6"],

        uci: ["e2e4", "e7e6"],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White grabs space in the center.",
            },
            {
                order: "1...",
                move: "e6",
                side: "black",
                piece: "♟",
                text: "Black prepares d5 and a solid pawn structure.",
            },
        ],
    },
    {
        eco: "B12",
        category: getEcoCategory("B12"),
        tags: [],
        name: "Caro-Kann Advance Variation",
        type: "defense",
        commentary:
            "White grabs space early against the Caro-Kann structure.",
        description:
            "The Advance Variation creates strong central space and long-term attacking chances.",
        mastery: 8,
        icon: "chess-pawn",
        color: "#FFB74D",
        difficulty: "Intermediate",
        side: "white",

        moves: ["e4", "c6", "d4", "d5", "e5"],

        uci: [
            "e2e4",
            "c7c6",
            "d2d4",
            "d7d5",
            "e4e5",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately controls the center.",
            },
            {
                order: "1...",
                move: "c6",
                side: "black",
                piece: "♟",
                text: "Black prepares the d5 pawn break.",
            },
            {
                order: "2.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White strengthens central control.",
            },
            {
                order: "2...",
                move: "d5",
                side: "black",
                piece: "♟",
                text: "Black challenges White’s center directly.",
            },
            {
                order: "3.",
                move: "e5",
                side: "white",
                piece: "♙",
                text: "White gains space and pushes the knight away from f6 ideas.",
            },
        ],
    },
    {
        eco: "B90",
        category: getEcoCategory("B90"),
        tags: [],
        name: "Sicilian Defense: Najdorf Variation",
        type: "defense",
        commentary:
            "One of the sharpest and most respected openings in chess.",
        description:
            "The Najdorf creates dynamic counterplay and rich tactical positions.",
        mastery: 9,
        icon: "fire",
        color: "#FF7043",
        difficulty: "Advanced",
        side: "black",

        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],

        uci: [
            "e2e4",
            "c7c5",
            "g1f3",
            "d7d6",
            "d2d4",
            "c5d4",
            "f3d4",
            "g8f6",
            "b1c3",
            "a7a6",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White claims central space and opens attacking lines.",
            },
            {
                order: "1...",
                move: "c5",
                side: "black",
                piece: "♟",
                text: "Black challenges the center asymmetrically.",
            },
            {
                order: "2.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White develops and prepares d4.",
            },
            {
                order: "2...",
                move: "d6",
                side: "black",
                piece: "♟",
                text: "Black supports the center and prepares knight development.",
            },
            {
                order: "3.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White opens the center immediately.",
            },
            {
                order: "3...",
                move: "cxd4",
                side: "black",
                piece: "♟",
                text: "Black exchanges central pawns to create active play.",
            },
            {
                order: "4.",
                move: "Nxd4",
                side: "white",
                piece: "♘",
                text: "White recaptures and centralizes the knight.",
            },
            {
                order: "4...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black attacks the e4 pawn and develops naturally.",
            },
            {
                order: "5.",
                move: "Nc3",
                side: "white",
                piece: "♘",
                text: "White protects e4 and strengthens center control.",
            },
            {
                order: "5...",
                move: "a6",
                side: "black",
                piece: "♟",
                text: "The signature Najdorf move preventing Nb5 and preparing queenside expansion.",
            },
        ],
    },
    {
        eco: "B06",
        category: getEcoCategory("B06"),
        tags: [],
        name: "Modern Defense",
        type: "defense",
        commentary:
            "A flexible hypermodern defense where Black attacks the center from distance.",
        description:
            "The Modern Defense delays central occupation and prepares a kingside fianchetto.",
        mastery: 6,
        icon: "target",
        color: "#78909C",
        difficulty: "Intermediate",
        side: "black",

        moves: ["e4", "g6"],

        uci: [
            "e2e4",
            "g7g6",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White takes immediate central space.",
            },
            {
                order: "1...",
                move: "g6",
                side: "black",
                piece: "♟",
                text: "Black prepares a kingside bishop fianchetto and flexible development.",
            },
        ],
    },
    {
        eco: "C40",
        category: getEcoCategory("C40"),
        tags: [],
        name: "King's Knight Opening",
        type: "opening",
        commentary:
            "A classical opening focused on rapid development and center control.",
        description:
            "The King's Knight Opening develops naturally and prepares kingside safety.",
        mastery: 14,
        icon: "chess-knight",
        color: "#7986CB",
        difficulty: "Beginner",
        side: "white",

        moves: ["e4", "e5", "Nf3"],

        uci: [
            "e2e4",
            "e7e5",
            "g1f3",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately controls the center.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black contests central control directly.",
            },
            {
                order: "2.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White develops naturally and attacks the e5 pawn.",
            },
        ],
    },
    {
        eco: "B07",
        category: getEcoCategory("B07"),
        tags: [],
        name: "Pirc Defense",
        type: "defense",
        commentary:
            "A flexible defense that allows White central space before counterattacking.",
        description:
            "The Pirc Defense creates dynamic and tactical middlegame positions.",
        mastery: 7,
        icon: "shield",
        color: "#9575CD",
        difficulty: "Intermediate",
        side: "black",

        moves: ["e4", "d6", "d4", "Nf6"],

        uci: [
            "e2e4",
            "d7d6",
            "d2d4",
            "g8f6",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately controls central squares.",
            },
            {
                order: "1...",
                move: "d6",
                side: "black",
                piece: "♟",
                text: "Black prepares a flexible defensive structure.",
            },
            {
                order: "2.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White strengthens central control and gains space.",
            },
            {
                order: "2...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops naturally and attacks the e4 pawn.",
            },
        ],
    },
    {
        eco: "E60",
        category: getEcoCategory("E60"),
        tags: [],
        name: "King's Indian Defense",
        type: "defense",
        commentary:
            "A famous hypermodern defense with strong kingside attacking ideas.",
        description:
            "Black allows White central space before launching counterplay.",
        mastery: 16,
        icon: "chess-knight",
        color: "#8D6E63",
        difficulty: "Advanced",
        side: "black",

        moves: ["d4", "Nf6", "c4", "g6"],

        uci: [
            "d2d4",
            "g8f6",
            "c2c4",
            "g7g6",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White claims central space and prepares development.",
            },
            {
                order: "1...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops flexibly and contests central squares.",
            },
            {
                order: "2.",
                move: "c4",
                side: "white",
                piece: "♙",
                text: "White strengthens central influence.",
            },
            {
                order: "2...",
                move: "g6",
                side: "black",
                piece: "♟",
                text: "Black prepares the powerful kingside bishop fianchetto.",
            },
        ],
    },
    {
        eco: "D10",
        category: getEcoCategory("D10"),
        tags: [],
        name: "Slav Defense",
        type: "defense",
        commentary:
            "A solid and reliable defense against the Queen's Gambit.",
        description:
            "The Slav Defense supports the center while keeping the bishop active.",
        mastery: 10,
        icon: "castle",
        color: "#64B5F6",
        difficulty: "Intermediate",
        side: "black",

        moves: ["d4", "d5", "c4", "c6"],

        uci: [
            "d2d4",
            "d7d5",
            "c2c4",
            "c7c6",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White immediately controls the center.",
            },
            {
                order: "1...",
                move: "d5",
                side: "black",
                piece: "♟",
                text: "Black contests the center directly.",
            },
            {
                order: "2.",
                move: "c4",
                side: "white",
                piece: "♙",
                text: "White pressures Black’s central pawn structure.",
            },
            {
                order: "2...",
                move: "c6",
                side: "black",
                piece: "♟",
                text: "Black reinforces the d5 pawn while keeping the bishop flexible.",
            },
        ],
    },
    {
        eco: "A80",
        category: getEcoCategory("A80"),
        tags: [],
        name: "Dutch Defense",
        type: "defense",
        commentary:
            "An aggressive defense focused on kingside attacking chances.",
        description:
            "The Dutch Defense fights for the e4 square and creates asymmetrical positions.",
        mastery: 8,
        icon: "fire",
        color: "#EF5350",
        difficulty: "Intermediate",
        side: "black",

        moves: ["d4", "f5"],

        uci: [
            "d2d4",
            "f7f5",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White takes central space immediately.",
            },
            {
                order: "1...",
                move: "f5",
                side: "black",
                piece: "♟",
                text: "Black aggressively fights for kingside control and the e4 square.",
            },
        ],
    },
    {
        eco: "C30",
        category: getEcoCategory("C30"),
        tags: [],
        name: "King's Gambit",
        type: "opening",
        commentary:
            "A legendary attacking opening where White sacrifices a pawn for initiative.",
        description:
            "The King's Gambit creates open tactical battles and rapid development.",
        mastery: 11,
        icon: "sword",
        color: "#EC407A",
        difficulty: "Advanced",
        side: "white",

        moves: ["e4", "e5", "f4"],

        uci: [
            "e2e4",
            "e7e5",
            "f2f4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately controls the center.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black mirrors central control.",
            },
            {
                order: "2.",
                move: "f4",
                side: "white",
                piece: "♙",
                text: "White offers a pawn to accelerate development and attack quickly.",
            },
        ],
    },
    {
        eco: "A04",
        category: getEcoCategory("A04"),
        tags: [],
        name: "Reti Opening",
        type: "opening",
        commentary:
            "A flexible opening emphasizing piece activity over immediate pawn occupation.",
        description:
            "The Reti Opening allows transpositions into many strategic systems.",
        mastery: 9,
        icon: "chess-knight",
        color: "#4DB6AC",
        difficulty: "Intermediate",
        side: "white",

        moves: ["Nf3"],

        uci: [
            "g1f3",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White develops flexibly while controlling key central squares.",
            },
        ],
    },
    {
        eco: "A00",
        category: getEcoCategory("A00"),
        tags: [],
        name: "Polish Opening",
        type: "opening",
        commentary:
            "An unusual flank opening that immediately expands on the queenside.",
        description:
            "The Polish Opening creates uncommon positions and surprise attacking ideas.",
        mastery: 2,
        icon: "flag",
        color: "#FFD54F",
        difficulty: "Intermediate",
        side: "white",

        moves: ["b4"],

        uci: [
            "b2b4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "b4",
                side: "white",
                piece: "♙",
                text: "White immediately expands on the queenside and prepares bishop development.",
            },
        ],
    },
    {
        eco: "C55",
        category: getEcoCategory("C55"),
        tags: [],
        name: "Two Knights Defense",
        type: "defense",
        commentary:
            "An active defense against the Italian Game.",
        description:
            "The Two Knights Defense develops rapidly and creates tactical opportunities.",
        mastery: 9,
        icon: "bolt",
        color: "#FF8A65",
        difficulty: "Intermediate",
        side: "black",

        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"],

        uci: [
            "e2e4",
            "e7e5",
            "g1f3",
            "b8c6",
            "f1c4",
            "g8f6",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately occupies the center.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black mirrors White’s central control.",
            },
            {
                order: "2.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White develops and attacks the e5 pawn.",
            },
            {
                order: "2...",
                move: "Nc6",
                side: "black",
                piece: "♞",
                text: "Black protects the pawn and develops naturally.",
            },
            {
                order: "3.",
                move: "Bc4",
                side: "white",
                piece: "♗",
                text: "White targets the vulnerable f7 square.",
            },
            {
                order: "3...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops rapidly and counterattacks the e4 pawn.",
            },
        ],
    },
    {
        eco: "C24",
        category: getEcoCategory("C24"),
        tags: [],
        name: "Vienna Game",
        type: "opening",
        commentary:
            "A flexible opening that blends positional and tactical ideas.",
        description:
            "The Vienna Game develops naturally while keeping attacking options open.",
        mastery: 7,
        icon: "chess-pawn",
        color: "#4FC3F7",
        difficulty: "Beginner",
        side: "white",

        moves: ["e4", "e5", "Nc3"],

        uci: [
            "e2e4",
            "e7e5",
            "b1c3",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White claims central space and opens attacking lines.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black contests the center directly.",
            },
            {
                order: "2.",
                move: "Nc3",
                side: "white",
                piece: "♘",
                text: "White develops flexibly while supporting future central expansion.",
            },
        ],
    },
    {
        eco: "C41",
        category: getEcoCategory("C41"),
        tags: [],
        name: "Philidor Defense",
        type: "defense",
        commentary:
            "A solid but somewhat passive defense against e4.",
        description:
            "The Philidor Defense focuses on stability and careful development.",
        mastery: 5,
        icon: "shield",
        color: "#90A4AE",
        difficulty: "Beginner",
        side: "black",

        moves: ["e4", "e5", "Nf3", "d6"],

        uci: [
            "e2e4",
            "e7e5",
            "g1f3",
            "d7d6",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately controls central squares.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black contests the center symmetrically.",
            },
            {
                order: "2.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White attacks the e5 pawn and develops naturally.",
            },
            {
                order: "2...",
                move: "d6",
                side: "black",
                piece: "♟",
                text: "Black supports the e5 pawn with a solid structure.",
            },
        ],
    },
    {
        eco: "A45",
        category: getEcoCategory("A45"),
        tags: [],
        name: "Queen's Pawn Game",
        type: "opening",
        commentary:
            "A flexible d4 opening that can transpose into many systems.",
        description:
            "The Queen’s Pawn Game builds central control and flexible development.",
        mastery: 10,
        icon: "chess-pawn",
        color: "#AED581",
        difficulty: "Beginner",
        side: "white",

        moves: ["d4", "Nf6"],

        uci: [
            "d2d4",
            "g8f6",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White controls the center and opens development lines.",
            },
            {
                order: "1...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops flexibly and contests central squares.",
            },
        ],
    },
    {
        eco: "E11",
        category: getEcoCategory("E11"),
        tags: [],
        name: "Bogo-Indian Defense",
        type: "defense",
        commentary:
            "A solid hypermodern defense emphasizing flexible development.",
        description:
            "The Bogo-Indian Defense creates strong positional structures and active piece play.",
        mastery: 4,
        icon: "chess-bishop",
        color: "#7E57C2",
        difficulty: "Advanced",
        side: "black",

        moves: ["d4", "Nf6", "c4", "e6", "Nf3", "Bb4+"],

        uci: [
            "d2d4",
            "g8f6",
            "c2c4",
            "e7e6",
            "g1f3",
            "f8b4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White occupies central space immediately.",
            },
            {
                order: "1...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops flexibly and controls e4.",
            },
            {
                order: "2.",
                move: "c4",
                side: "white",
                piece: "♙",
                text: "White strengthens central influence.",
            },
            {
                order: "2...",
                move: "e6",
                side: "black",
                piece: "♟",
                text: "Black prepares dark-square bishop development.",
            },
            {
                order: "3.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White develops naturally and prepares castling.",
            },
            {
                order: "3...",
                move: "Bb4+",
                side: "black",
                piece: "♝",
                text: "Black gives check and pressures White’s knight structure.",
            },
        ],
    },
    {
        eco: "A02",
        category: getEcoCategory("A02"),
        tags: [],
        name: "Bird Opening",
        type: "opening",
        commentary:
            "An aggressive flank opening focused on kingside initiative.",
        description:
            "The Bird Opening creates flexible attacking opportunities and unusual structures.",
        mastery: 5,
        icon: "feather",
        color: "#26C6DA",
        difficulty: "Intermediate",
        side: "white",

        moves: ["f4"],

        uci: [
            "f2f4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "f4",
                side: "white",
                piece: "♙",
                text: "White fights for e5 control and kingside attacking chances.",
            },
        ],
    },
    {
        eco: "A06",
        category: getEcoCategory("A06"),
        tags: [],
        name: "Benoni Defense",
        type: "defense",
        commentary:
            "An aggressive defense leading to asymmetrical pawn structures.",
        description:
            "The Benoni Defense creates dynamic counterplay and tactical middlegames.",
        mastery: 6,
        icon: "fire",
        color: "#E57373",
        difficulty: "Advanced",
        side: "black",

        moves: ["d4", "Nf6", "c4", "c5"],

        uci: [
            "d2d4",
            "g8f6",
            "c2c4",
            "c7c5",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White immediately controls central squares.",
            },
            {
                order: "1...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops flexibly and contests the center.",
            },
            {
                order: "2.",
                move: "c4",
                side: "white",
                piece: "♙",
                text: "White strengthens central influence and gains space.",
            },
            {
                order: "2...",
                move: "c5",
                side: "black",
                piece: "♟",
                text: "Black challenges the center and creates asymmetrical play.",
            },
        ],
    },
    {
        eco: "B23",
        category: getEcoCategory("B23"),
        tags: [],
        name: "Sicilian Defense: Closed Variation",
        type: "defense",
        commentary:
            "A quieter approach against the Sicilian that emphasizes gradual kingside attacking plans.",
        description:
            "Instead of immediately opening the center, White develops carefully and often prepares a kingside pawn storm. The Closed Sicilian creates strategic positions with long-term attacking chances and flexible maneuvering.",

        mastery: 8,
        icon: "lock",
        color: "#5C6BC0",
        difficulty: "Intermediate",
        side: "white",

        moves: ["e4", "c5", "Nc3"],

        uci: [
            "e2e4",
            "c7c5",
            "b1c3",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately claims central space and opens attacking lines.",
            },
            {
                order: "1...",
                move: "c5",
                side: "black",
                piece: "♟",
                text: "Black challenges the center asymmetrically and seeks counterplay.",
            },
            {
                order: "2.",
                move: "Nc3",
                side: "white",
                piece: "♘",
                text: "White develops flexibly and avoids immediate central exchanges.",
            },
        ],
    },
    {
        eco: "C88",
        category: getEcoCategory("C88"),
        tags: [],
        name: "Ruy Lopez: Closed Defense",
        type: "defense",
        commentary:
            "A deeply strategic variation of the Ruy Lopez focused on maneuvering and long-term planning.",
        description:
            "The Closed Defense leads to rich positional battles where both sides slowly improve their pieces before launching attacks. It is one of the most respected structures in classical chess.",

        mastery: 6,
        icon: "castle",
        color: "#8D6E63",
        difficulty: "Advanced",
        side: "black",

        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"],

        uci: [
            "e2e4",
            "e7e5",
            "g1f3",
            "b8c6",
            "f1b5",
            "a7a6",
            "b5a4",
            "g8f6",
            "e1g1",
            "f8e7",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately fights for central control.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black mirrors White and contests the center.",
            },
            {
                order: "2.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White attacks the e5 pawn while developing naturally.",
            },
            {
                order: "2...",
                move: "Nc6",
                side: "black",
                piece: "♞",
                text: "Black protects the pawn and develops toward the center.",
            },
            {
                order: "3.",
                move: "Bb5",
                side: "white",
                piece: "♗",
                text: "White pins the knight and increases central pressure.",
            },
            {
                order: "3...",
                move: "a6",
                side: "black",
                piece: "♟",
                text: "Black questions the bishop and gains queenside space.",
            },
            {
                order: "4.",
                move: "Ba4",
                side: "white",
                piece: "♗",
                text: "The bishop retreats while maintaining pressure on the knight.",
            },
            {
                order: "4...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops and attacks the e4 pawn.",
            },
            {
                order: "5.",
                move: "O-O",
                side: "white",
                piece: "♔",
                text: "White castles kingside and secures king safety.",
            },
            {
                order: "5...",
                move: "Be7",
                side: "black",
                piece: "♝",
                text: "Black prepares castling and completes solid development.",
            },
        ],
    },
    {
        eco: "D00",
        category: getEcoCategory("D00"),
        tags: [],
        name: "Blackmar-Diemer Gambit",
        type: "opening",
        commentary:
            "An aggressive gambit where White sacrifices a pawn for rapid development and attacking chances.",
        description:
            "The Blackmar-Diemer Gambit creates open lines and fast piece activity. White aims to overwhelm Black with initiative before the extra pawn becomes important.",

        mastery: 5,
        icon: "sword",
        color: "#EC407A",
        difficulty: "Advanced",
        side: "white",

        moves: ["d4", "d5", "e4", "dxe4", "Nc3"],

        uci: [
            "d2d4",
            "d7d5",
            "e2e4",
            "d5e4",
            "b1c3",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White establishes central control immediately.",
            },
            {
                order: "1...",
                move: "d5",
                side: "black",
                piece: "♟",
                text: "Black contests the center directly.",
            },
            {
                order: "2.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White offers a pawn to accelerate development and open attacking lines.",
            },
            {
                order: "2...",
                move: "dxe4",
                side: "black",
                piece: "♟",
                text: "Black accepts the gambit pawn and gains material.",
            },
            {
                order: "3.",
                move: "Nc3",
                side: "white",
                piece: "♘",
                text: "White develops rapidly and pressures the advanced pawn.",
            },
        ],
    },
    {
        eco: "A07",
        category: getEcoCategory("A07"),
        tags: [],
        name: "King's Indian Attack",
        type: "opening",
        commentary:
            "A universal attacking setup that can be played against many defenses.",
        description:
            "The King's Indian Attack focuses on flexible development, kingside safety, and eventual attacking chances. White often builds slowly before launching a coordinated kingside assault.",

        mastery: 12,
        icon: "shield-half-full",
        color: "#26A69A",
        difficulty: "Intermediate",
        side: "white",

        moves: ["Nf3", "d5", "g3", "Nf6", "Bg2"],

        uci: [
            "g1f3",
            "d7d5",
            "g2g3",
            "g8f6",
            "f1g2",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White develops flexibly while controlling central squares.",
            },
            {
                order: "1...",
                move: "d5",
                side: "black",
                piece: "♟",
                text: "Black immediately claims central space.",
            },
            {
                order: "2.",
                move: "g3",
                side: "white",
                piece: "♙",
                text: "White prepares a kingside bishop fianchetto.",
            },
            {
                order: "2...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops naturally and controls e4.",
            },
            {
                order: "3.",
                move: "Bg2",
                side: "white",
                piece: "♗",
                text: "The bishop becomes very powerful along the long diagonal.",
            },
        ],
    },
    {
        eco: "A51",
        category: getEcoCategory("A51"),
        tags: [],
        name: "Budapest Gambit",
        type: "defense",
        commentary:
            "A surprising gambit where Black sacrifices a pawn for active piece play.",
        description:
            "The Budapest Gambit creates immediate tactical complications and rapid development. Black aims to gain initiative and disrupt White’s center before White consolidates.",

        mastery: 4,
        icon: "bolt",
        color: "#FF7043",
        difficulty: "Intermediate",
        side: "black",

        moves: ["d4", "Nf6", "c4", "e5"],

        uci: [
            "d2d4",
            "g8f6",
            "c2c4",
            "e7e5",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White occupies the center and prepares development.",
            },
            {
                order: "1...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops flexibly and contests central control.",
            },
            {
                order: "2.",
                move: "c4",
                side: "white",
                piece: "♙",
                text: "White strengthens the center and gains queenside space.",
            },
            {
                order: "2...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black offers a pawn to create immediate activity and tactical pressure.",
            },
        ],
    },
    {
        eco: "B21",
        category: getEcoCategory("B21"),
        tags: [],
        name: "Smith-Morra Gambit",
        type: "opening",
        commentary:
            "An aggressive anti-Sicilian gambit where White sacrifices a pawn for rapid development.",
        description:
            "The Smith-Morra Gambit creates open lines, fast piece activity, and attacking opportunities against the Sicilian Defense. White aims to punish slow development and generate early initiative.",

        mastery: 6,
        icon: "sword",
        color: "#EF5350",
        difficulty: "Advanced",
        side: "white",

        moves: ["e4", "c5", "d4", "cxd4", "c3"],

        uci: [
            "e2e4",
            "c7c5",
            "d2d4",
            "c5d4",
            "c2c3",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White claims the center and opens attacking lines.",
            },
            {
                order: "1...",
                move: "c5",
                side: "black",
                piece: "♟",
                text: "Black creates asymmetrical counterplay with the Sicilian Defense.",
            },
            {
                order: "2.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White immediately challenges the center and seeks open lines.",
            },
            {
                order: "2...",
                move: "cxd4",
                side: "black",
                piece: "♟",
                text: "Black captures and accepts the central exchange.",
            },
            {
                order: "3.",
                move: "c3",
                side: "white",
                piece: "♙",
                text: "White offers a pawn to accelerate development and gain initiative.",
            },
        ],
    },
    {
        eco: "B27",
        category: getEcoCategory("B27"),
        tags: [],
        name: "Sicilian Defense: Hyperaccelerated Dragon",
        type: "defense",
        commentary:
            "A fast and flexible Dragon setup with immediate kingside fianchetto plans.",
        description:
            "The Hyperaccelerated Dragon allows Black to quickly develop the bishop on the long diagonal while avoiding some traditional Sicilian structures. It often leads to tactical and dynamic positions.",

        mastery: 5,
        icon: "chess-knight",
        color: "#7E57C2",
        difficulty: "Advanced",
        side: "black",

        moves: ["e4", "c5", "Nf3", "g6"],

        uci: [
            "e2e4",
            "c7c5",
            "g1f3",
            "g7g6",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately occupies the center.",
            },
            {
                order: "1...",
                move: "c5",
                side: "black",
                piece: "♟",
                text: "Black challenges the center asymmetrically.",
            },
            {
                order: "2.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White develops naturally and prepares d4.",
            },
            {
                order: "2...",
                move: "g6",
                side: "black",
                piece: "♟",
                text: "Black prepares a rapid bishop fianchetto and dynamic counterplay.",
            },
        ],
    },
    {
        eco: "D08",
        category: getEcoCategory("D08"),
        tags: [],
        name: "Albin Countergambit",
        type: "defense",
        commentary:
            "A sharp counterattacking response to the Queen's Gambit.",
        description:
            "Instead of defending passively, Black immediately strikes back in the center with an aggressive pawn sacrifice. The Albin Countergambit creates tactical complications and surprise attacking chances.",

        mastery: 4,
        icon: "bolt",
        color: "#FF7043",
        difficulty: "Advanced",
        side: "black",

        moves: ["d4", "d5", "c4", "e5"],

        uci: [
            "d2d4",
            "d7d5",
            "c2c4",
            "e7e5",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White establishes central control and opens development lines.",
            },
            {
                order: "1...",
                move: "d5",
                side: "black",
                piece: "♟",
                text: "Black contests the center directly.",
            },
            {
                order: "2.",
                move: "c4",
                side: "white",
                piece: "♙",
                text: "White pressures Black’s central pawn structure.",
            },
            {
                order: "2...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black counterattacks aggressively and sacrifices a pawn for activity.",
            },
        ],
    },
    {
        eco: "A40",
        category: getEcoCategory("A40"),
        tags: [],
        name: "Englund Gambit",
        type: "defense",
        commentary:
            "A tricky and aggressive gambit against d4.",
        description:
            "The Englund Gambit sacrifices a pawn early to create tactical traps and rapid development. While objectively risky, it can be dangerous against unprepared opponents.",

        mastery: 3,
        icon: "fire",
        color: "#E57373",
        difficulty: "Intermediate",
        side: "black",

        moves: ["d4", "e5"],

        uci: [
            "d2d4",
            "e7e5",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White immediately controls central space.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black offers a pawn to create quick attacking chances and tactical pressure.",
            },
        ],
    },
    {
        eco: "C47",
        category: getEcoCategory("C47"),
        tags: [],
        name: "Four Knights Game",
        type: "opening",
        commentary:
            "A classical opening focused on harmony and balanced development.",
        description:
            "The Four Knights Game develops pieces naturally and leads to solid strategic positions. It is popular among beginners because of its straightforward principles and safe structures.",

        mastery: 16,
        icon: "chess-knight",
        color: "#64B5F6",
        difficulty: "Beginner",
        side: "white",

        moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"],

        uci: [
            "e2e4",
            "e7e5",
            "g1f3",
            "b8c6",
            "b1c3",
            "g8f6",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White claims central space and opens attacking lines.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black mirrors White and contests the center.",
            },
            {
                order: "2.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White develops naturally while attacking the e5 pawn.",
            },
            {
                order: "2...",
                move: "Nc6",
                side: "black",
                piece: "♞",
                text: "Black protects the pawn and develops toward the center.",
            },
            {
                order: "3.",
                move: "Nc3",
                side: "white",
                piece: "♘",
                text: "White develops another knight and reinforces central control.",
            },
            {
                order: "3...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black completes symmetrical development and attacks the e4 pawn.",
            },
        ],
    },
    {
        eco: "A48",
        category: getEcoCategory("A48"),
        tags: [],
        name: "East Indian Defense",
        type: "defense",
        commentary:
            "A flexible defense with transpositional possibilities into Indian systems.",
        description:
            "The East Indian Defense focuses on careful development and flexible pawn structures. Black keeps options open while preparing kingside development and central counterplay.",

        mastery: 3,
        icon: "shield",
        color: "#90A4AE",
        difficulty: "Intermediate",
        side: "black",

        moves: ["d4", "Nf6", "Nf3", "g6"],

        uci: [
            "d2d4",
            "g8f6",
            "g1f3",
            "g7g6",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White establishes central control immediately.",
            },
            {
                order: "1...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops flexibly and contests central squares.",
            },
            {
                order: "2.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White develops naturally and prepares kingside safety.",
            },
            {
                order: "2...",
                move: "g6",
                side: "black",
                piece: "♟",
                text: "Black prepares a kingside bishop fianchetto and flexible structure.",
            },
        ],
    },
    {
        eco: "C20",
        category: getEcoCategory("C20"),
        tags: [],
        name: "Center Game",
        type: "opening",
        commentary:
            "A direct and aggressive opening where White immediately opens the center.",
        description:
            "The Center Game prioritizes rapid development and early tactical opportunities. White quickly challenges Black's central pawn structure and aims to create active piece play before Black fully develops.",

        mastery: 9,
        icon: "chess-pawn",
        color: "#FF7043",
        difficulty: "Beginner",
        side: "white",

        moves: ["e4", "e5", "d4"],

        uci: [
            "e2e4",
            "e7e5",
            "d2d4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately occupies the center and opens attacking lines.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black mirrors White’s central control.",
            },
            {
                order: "2.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White challenges the center immediately and seeks open play.",
            },
        ],
    },
    {
        eco: "C21",
        category: getEcoCategory("C21"),
        tags: [],
        name: "Danish Gambit",
        type: "opening",
        commentary:
            "A sharp gambit where White sacrifices pawns for rapid development and attacking pressure.",
        description:
            "The Danish Gambit creates open diagonals and fast-moving attacks. White aims to overwhelm Black with active bishops and rapid piece coordination before Black can consolidate the extra material.",

        mastery: 7,
        icon: "chess-bishop",
        color: "#EC407A",
        difficulty: "Advanced",
        side: "white",

        moves: ["e4", "e5", "d4", "exd4", "c3"],

        uci: [
            "e2e4",
            "e7e5",
            "d2d4",
            "e5d4",
            "c2c3",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White claims central space and opens lines for development.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black contests the center directly.",
            },
            {
                order: "2.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White immediately challenges the center and opens the game.",
            },
            {
                order: "2...",
                move: "exd4",
                side: "black",
                piece: "♟",
                text: "Black accepts the central pawn exchange.",
            },
            {
                order: "3.",
                move: "c3",
                side: "white",
                piece: "♙",
                text: "White offers another pawn to accelerate development and activate the bishops.",
            },
        ],
    },
    {
        eco: "B02",
        category: getEcoCategory("B02"),
        tags: [],
        name: "Alekhine Defense",
        type: "defense",
        commentary:
            "A provocative defense where Black invites White to overextend the center.",
        description:
            "The Alekhine Defense encourages White to advance central pawns aggressively while Black prepares to undermine and attack that center later. It often leads to unbalanced and strategic positions.",

        mastery: 6,
        icon: "chess-knight",
        color: "#7E57C2",
        difficulty: "Intermediate",
        side: "black",

        moves: ["e4", "Nf6"],

        uci: [
            "e2e4",
            "g8f6",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately controls important central squares.",
            },
            {
                order: "1...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black attacks the e4 pawn and invites White to advance the center.",
            },
        ],
    },
    {
        eco: "A52",
        category: getEcoCategory("A52"),
        tags: [],
        name: "Budapest Gambit: Adler Variation",
        type: "defense",
        commentary:
            "A tactical variation of the Budapest Gambit with active piece play.",
        description:
            "The Adler Variation creates immediate pressure on White’s center and development. Black seeks rapid activity and tactical opportunities instead of slow positional play.",

        mastery: 4,
        icon: "chess-queen",
        color: "#FFCA28",
        difficulty: "Intermediate",
        side: "black",

        moves: ["d4", "Nf6", "c4", "e5", "dxe5", "Ng4"],

        uci: [
            "d2d4",
            "g8f6",
            "c2c4",
            "e7e5",
            "d4e5",
            "f6g4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White establishes strong central control.",
            },
            {
                order: "1...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops flexibly and contests the center.",
            },
            {
                order: "2.",
                move: "c4",
                side: "white",
                piece: "♙",
                text: "White strengthens central influence and gains queenside space.",
            },
            {
                order: "2...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black sacrifices a pawn for quick activity and central pressure.",
            },
            {
                order: "3.",
                move: "dxe5",
                side: "white",
                piece: "♙",
                text: "White accepts the gambit pawn.",
            },
            {
                order: "3...",
                move: "Ng4",
                side: "black",
                piece: "♞",
                text: "Black attacks the advanced pawn and creates tactical threats.",
            },
        ],
    },
    {
        eco: "A09",
        category: getEcoCategory("A09"),
        tags: [],
        name: "Reti Gambit",
        type: "opening",
        commentary:
            "An aggressive approach within the Reti Opening focused on rapid activity.",
        description:
            "The Reti Gambit combines flexible development with early central pressure. White seeks dynamic play and active piece coordination while avoiding traditional opening theory.",

        mastery: 3,
        icon: "chess-rook",
        color: "#26C6DA",
        difficulty: "Intermediate",
        side: "white",

        moves: ["Nf3", "d5", "c4"],

        uci: [
            "g1f3",
            "d7d5",
            "c2c4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White develops flexibly while controlling central squares.",
            },
            {
                order: "1...",
                move: "d5",
                side: "black",
                piece: "♟",
                text: "Black immediately claims central space.",
            },
            {
                order: "2.",
                move: "c4",
                side: "white",
                piece: "♙",
                text: "White challenges Black’s center and creates queenside pressure.",
            },
        ],
    },
    {
        eco: "A10",
        category: getEcoCategory("A10"),
        tags: [],
        name: "Anglo-Indian Defense",
        type: "defense",
        commentary:
            "A flexible opening system with rich transpositional possibilities.",
        description:
            "The Anglo-Indian Defense creates strategic positions focused on flexible development and long-term positional play. Both sides often maneuver carefully before committing to central pawn breaks.",

        mastery: 5,
        icon: "chess-king",
        color: "#66BB6A",
        difficulty: "Intermediate",
        side: "black",

        moves: ["c4", "Nf6"],

        uci: [
            "c2c4",
            "g8f6",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "c4",
                side: "white",
                piece: "♙",
                text: "White controls the d5 square and prepares flexible development.",
            },
            {
                order: "1...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops naturally and contests key central squares.",
            },
        ],
    },
    {
        eco: "B13",
        category: getEcoCategory("B13"),
        tags: [],
        name: "Caro-Kann Defense",
        type: "defense",
        commentary:
            "A durable and respected defense known for its solid pawn structure.",
        description:
            "The Caro-Kann Defense focuses on long-term stability and careful development. Black creates a resilient position while avoiding many of the weaknesses found in other open defenses.",

        mastery: 17,
        icon: "chess-rook",
        color: "#42A5F5",
        difficulty: "Beginner",
        side: "black",

        moves: ["e4", "c6", "d4", "d5"],

        uci: [
            "e2e4",
            "c7c6",
            "d2d4",
            "d7d5",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately occupies central space.",
            },
            {
                order: "1...",
                move: "c6",
                side: "black",
                piece: "♟",
                text: "Black prepares the important d5 pawn break.",
            },
            {
                order: "2.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White strengthens central control and gains space.",
            },
            {
                order: "2...",
                move: "d5",
                side: "black",
                piece: "♟",
                text: "Black directly challenges White’s center with a solid structure.",
            },
        ],
    },
    {
        eco: "C10",
        category: getEcoCategory("C10"),
        tags: [],
        name: "French Defense: Rubinstein Variation",
        type: "defense",
        commentary:
            "A flexible and reliable variation of the French Defense.",
        description:
            "The Rubinstein Variation simplifies the center early and focuses on smooth development. Black aims for a balanced position with solid pawn structures and strategic counterplay.",

        mastery: 6,
        icon: "chess-bishop",
        color: "#AB47BC",
        difficulty: "Intermediate",
        side: "black",

        moves: ["e4", "e6", "d4", "d5", "Nc3", "dxe4"],

        uci: [
            "e2e4",
            "e7e6",
            "d2d4",
            "d7d5",
            "b1c3",
            "d5e4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White claims central space and opens lines for development.",
            },
            {
                order: "1...",
                move: "e6",
                side: "black",
                piece: "♟",
                text: "Black prepares a strong central pawn structure.",
            },
            {
                order: "2.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White expands central control and gains space.",
            },
            {
                order: "2...",
                move: "d5",
                side: "black",
                piece: "♟",
                text: "Black immediately challenges the center.",
            },
            {
                order: "3.",
                move: "Nc3",
                side: "white",
                piece: "♘",
                text: "White develops naturally while supporting the center.",
            },
            {
                order: "3...",
                move: "dxe4",
                side: "black",
                piece: "♟",
                text: "Black simplifies the center and aims for flexible development.",
            },
        ],
    },
    {
        eco: "E20",
        category: getEcoCategory("E20"),
        tags: [],
        name: "Nimzo-Indian Defense",
        type: "defense",
        commentary:
            "One of the most respected positional defenses against d4.",
        description:
            "The Nimzo-Indian Defense combines rapid development with pressure on White’s center and pawn structure. Black often aims for strategic imbalances and long-term positional advantages.",

        mastery: 11,
        icon: "chess-queen",
        color: "#7E57C2",
        difficulty: "Advanced",
        side: "black",

        moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"],

        uci: [
            "d2d4",
            "g8f6",
            "c2c4",
            "e7e6",
            "b1c3",
            "f8b4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White establishes strong central control.",
            },
            {
                order: "1...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops flexibly and contests key central squares.",
            },
            {
                order: "2.",
                move: "c4",
                side: "white",
                piece: "♙",
                text: "White strengthens the center and gains queenside space.",
            },
            {
                order: "2...",
                move: "e6",
                side: "black",
                piece: "♟",
                text: "Black prepares dark-square bishop development.",
            },
            {
                order: "3.",
                move: "Nc3",
                side: "white",
                piece: "♘",
                text: "White develops naturally and reinforces the center.",
            },
            {
                order: "3...",
                move: "Bb4",
                side: "black",
                piece: "♝",
                text: "Black pins the knight and pressures White’s center.",
            },
        ],
    },
    {
        eco: "A56",
        category: getEcoCategory("A56"),
        tags: [],
        name: "Benko Gambit",
        type: "defense",
        commentary:
            "A dynamic queenside gambit that creates long-term pressure.",
        description:
            "The Benko Gambit sacrifices a pawn in exchange for open files and powerful queenside activity. Black often gains strong rook pressure and active piece play throughout the middlegame.",

        mastery: 5,
        icon: "chess-rook",
        color: "#FF7043",
        difficulty: "Advanced",
        side: "black",

        moves: ["d4", "Nf6", "c4", "c5", "d5", "b5"],

        uci: [
            "d2d4",
            "g8f6",
            "c2c4",
            "c7c5",
            "d4d5",
            "b7b5",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White occupies the center and prepares development.",
            },
            {
                order: "1...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops flexibly and contests central squares.",
            },
            {
                order: "2.",
                move: "c4",
                side: "white",
                piece: "♙",
                text: "White strengthens the center and gains space.",
            },
            {
                order: "2...",
                move: "c5",
                side: "black",
                piece: "♟",
                text: "Black immediately challenges White’s central structure.",
            },
            {
                order: "3.",
                move: "d5",
                side: "white",
                piece: "♙",
                text: "White advances and gains additional space.",
            },
            {
                order: "3...",
                move: "b5",
                side: "black",
                piece: "♟",
                text: "Black sacrifices a pawn to open queenside lines and activate the rooks.",
            },
        ],
    },
    {
        eco: "C57",
        category: getEcoCategory("C57"),
        tags: [],
        name: "Italian Game: Fried Liver Attack",
        type: "opening",
        commentary:
            "A famous attacking line where White targets the vulnerable f7 square aggressively.",
        description:
            "The Fried Liver Attack creates sharp tactical battles very early in the game. White sacrifices material to expose Black’s king and launch dangerous attacks before Black can fully develop.",

        mastery: 13,
        icon: "chess-knight",
        color: "#EC407A",
        difficulty: "Advanced",
        side: "white",

        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5"],

        uci: [
            "e2e4",
            "e7e5",
            "g1f3",
            "b8c6",
            "f1c4",
            "g8f6",
            "f3g5",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately claims central space.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black contests the center directly.",
            },
            {
                order: "2.",
                move: "Nf3",
                side: "white",
                piece: "♘",
                text: "White develops naturally while attacking the e5 pawn.",
            },
            {
                order: "2...",
                move: "Nc6",
                side: "black",
                piece: "♞",
                text: "Black protects the pawn and develops toward the center.",
            },
            {
                order: "3.",
                move: "Bc4",
                side: "white",
                piece: "♗",
                text: "White targets the vulnerable f7 square.",
            },
            {
                order: "3...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops while attacking the e4 pawn.",
            },
            {
                order: "4.",
                move: "Ng5",
                side: "white",
                piece: "♘",
                text: "White aggressively attacks f7 and prepares tactical threats against the king.",
            },
        ],
    },
    {
        eco: "B08",
        category: getEcoCategory("B08"),
        tags: [],
        name: "Pirc Defense: Austrian Attack",
        type: "defense",
        commentary:
            "An aggressive setup against the Pirc Defense featuring strong central control and kingside attacking chances.",
        description:
            "The Austrian Attack gives White a large pawn center and aggressive attacking opportunities. White often aims for rapid kingside expansion while Black looks to undermine the center with counterplay.",

        mastery: 8,
        icon: "chess-pawn",
        color: "#FF7043",
        difficulty: "Advanced",
        side: "white",

        moves: ["e4", "d6", "d4", "Nf6", "Nc3", "g6", "f4"],

        uci: [
            "e2e4",
            "d7d6",
            "d2d4",
            "g8f6",
            "b1c3",
            "g7g6",
            "f2f4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately occupies central space.",
            },
            {
                order: "1...",
                move: "d6",
                side: "black",
                piece: "♟",
                text: "Black prepares a flexible defensive structure.",
            },
            {
                order: "2.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White builds a strong pawn center.",
            },
            {
                order: "2...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops naturally and pressures the e4 pawn.",
            },
            {
                order: "3.",
                move: "Nc3",
                side: "white",
                piece: "♘",
                text: "White reinforces the center and supports future attacks.",
            },
            {
                order: "3...",
                move: "g6",
                side: "black",
                piece: "♟",
                text: "Black prepares a kingside bishop fianchetto.",
            },
            {
                order: "4.",
                move: "f4",
                side: "white",
                piece: "♙",
                text: "White aggressively expands on the kingside and strengthens the center.",
            },
        ],
    },
    {
        eco: "E97",
        category: getEcoCategory("E97"),
        tags: [],
        name: "King's Indian Defense: Classical Variation",
        type: "defense",
        commentary:
            "A sharp and strategic variation of the King's Indian Defense.",
        description:
            "The Classical Variation creates complex middlegame positions where Black attacks on the kingside while White seeks queenside and central expansion. Timing and piece coordination are critical for both sides.",

        mastery: 9,
        icon: "chess-king",
        color: "#AB47BC",
        difficulty: "Advanced",
        side: "black",

        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4"],

        uci: [
            "d2d4",
            "g8f6",
            "c2c4",
            "g7g6",
            "b1c3",
            "f8g7",
            "e2e4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White establishes strong central control.",
            },
            {
                order: "1...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops flexibly and contests key central squares.",
            },
            {
                order: "2.",
                move: "c4",
                side: "white",
                piece: "♙",
                text: "White strengthens central influence and gains queenside space.",
            },
            {
                order: "2...",
                move: "g6",
                side: "black",
                piece: "♟",
                text: "Black prepares a kingside bishop fianchetto.",
            },
            {
                order: "3.",
                move: "Nc3",
                side: "white",
                piece: "♘",
                text: "White develops naturally while reinforcing the center.",
            },
            {
                order: "3...",
                move: "Bg7",
                side: "black",
                piece: "♝",
                text: "Black activates the bishop on the long diagonal.",
            },
            {
                order: "4.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White creates a powerful pawn center and gains additional space.",
            },
        ],
    },
    {
        eco: "D37",
        category: getEcoCategory("D37"),
        tags: [],
        name: "Queen's Gambit Declined: Orthodox Defense",
        type: "defense",
        commentary:
            "A classical and reliable response to the Queen's Gambit.",
        description:
            "The Orthodox Defense focuses on solid development and central stability. Black carefully coordinates pieces while preparing to challenge White’s center at the right moment.",

        mastery: 14,
        icon: "chess-queen",
        color: "#42A5F5",
        difficulty: "Intermediate",
        side: "black",

        moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6"],

        uci: [
            "d2d4",
            "d7d5",
            "c2c4",
            "e7e6",
            "b1c3",
            "g8f6",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White immediately occupies central space.",
            },
            {
                order: "1...",
                move: "d5",
                side: "black",
                piece: "♟",
                text: "Black contests the center directly.",
            },
            {
                order: "2.",
                move: "c4",
                side: "white",
                piece: "♙",
                text: "White pressures Black’s central pawn structure.",
            },
            {
                order: "2...",
                move: "e6",
                side: "black",
                piece: "♟",
                text: "Black reinforces the center and prepares development.",
            },
            {
                order: "3.",
                move: "Nc3",
                side: "white",
                piece: "♘",
                text: "White develops naturally and strengthens central control.",
            },
            {
                order: "3...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops actively while attacking central squares.",
            },
        ],
    },
    {
        eco: "B03",
        category: getEcoCategory("B03"),
        tags: [],
        name: "Alekhine Defense: Four Pawns Attack",
        type: "defense",
        commentary:
            "A highly aggressive response to the Alekhine Defense.",
        description:
            "The Four Pawns Attack gives White massive central space and attacking potential. Black aims to provoke overextension and later undermine the advanced pawn structure with tactical counterplay.",

        mastery: 5,
        icon: "chess-knight",
        color: "#EC407A",
        difficulty: "Advanced",
        side: "white",

        moves: ["e4", "Nf6", "e5", "Nd5", "d4", "d6", "c4"],

        uci: [
            "e2e4",
            "g8f6",
            "e4e5",
            "f6d5",
            "d2d4",
            "d7d6",
            "c2c4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately controls central space.",
            },
            {
                order: "1...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black attacks the e4 pawn and invites central expansion.",
            },
            {
                order: "2.",
                move: "e5",
                side: "white",
                piece: "♙",
                text: "White gains space and attacks the knight.",
            },
            {
                order: "2...",
                move: "Nd5",
                side: "black",
                piece: "♞",
                text: "Black retreats while provoking further pawn advances.",
            },
            {
                order: "3.",
                move: "d4",
                side: "white",
                piece: "♙",
                text: "White builds a large and aggressive pawn center.",
            },
            {
                order: "3...",
                move: "d6",
                side: "black",
                piece: "♟",
                text: "Black prepares to challenge White’s advanced center.",
            },
            {
                order: "4.",
                move: "c4",
                side: "white",
                piece: "♙",
                text: "White expands even further and gains massive central space.",
            },
        ],
    },
    {
        eco: "C25",
        category: getEcoCategory("C25"),
        tags: [],
        name: "Vienna Gambit",
        type: "opening",
        commentary:
            "An aggressive gambit within the Vienna Game focused on rapid kingside attacks.",
        description:
            "The Vienna Gambit sacrifices central stability in exchange for fast development and attacking chances. White often aims for early tactical pressure against Black’s king and center.",

        mastery: 7,
        icon: "chess-bishop",
        color: "#26C6DA",
        difficulty: "Intermediate",
        side: "white",

        moves: ["e4", "e5", "Nc3", "Nf6", "f4"],

        uci: [
            "e2e4",
            "e7e5",
            "b1c3",
            "g8f6",
            "f2f4",
        ],

        moveDetails: [
            {
                order: "1.",
                move: "e4",
                side: "white",
                piece: "♙",
                text: "White immediately occupies central space.",
            },
            {
                order: "1...",
                move: "e5",
                side: "black",
                piece: "♟",
                text: "Black contests the center directly.",
            },
            {
                order: "2.",
                move: "Nc3",
                side: "white",
                piece: "♘",
                text: "White develops flexibly while supporting central control.",
            },
            {
                order: "2...",
                move: "Nf6",
                side: "black",
                piece: "♞",
                text: "Black develops naturally and attacks the e4 pawn.",
            },
            {
                order: "3.",
                move: "f4",
                side: "white",
                piece: "♙",
                text: "White aggressively attacks the center and prepares kingside initiative.",
            },
        ],
    },

];
