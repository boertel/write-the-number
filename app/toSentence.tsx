export interface Language {
  builtBy: string;
  label: string;
  locale: string;
  words: Record<
    number,
    string | ((args: { divider?: number; remainder?: number }) => string)
  >;
  joinWith: (args: {
    quotient?: number;
    divider?: number;
    remainder?: number;
  }) => string;
}

export const LANGUAGES: Record<string, Language> = {
  spanish: {
    builtBy: "Construido por",
    label: "Escribe el numero",
    locale: "es-MX",
    words: {
      1: "uno",
      2: "dos",
      3: "tres",
      4: "cuatro",
      5: "cinco",
      6: "seis",
      7: "siete",
      8: "ocho",
      9: "nueve",
      10: "diez",
      11: "once",
      12: "doce",
      13: "trece",
      14: "catorce",
      15: "quince",
      16: "dieciséis",
      17: "diecisiete",
      18: "dieciocho",
      19: "diecinueve",
      20: "veinte",
      21: "veintiuno",
      22: "veintidós",
      23: "veintitrés",
      24: "veinticuatro",
      25: "veinticinco",
      26: "veintiséis",
      27: "veintisiete",
      28: "veintiocho",
      29: "veintinueve",
      30: "treinta",
      40: "cuarenta",
      50: "cincuenta",
      60: "sesenta",
      70: "setenta",
      80: "ochenta",
      90: "noventa",
      100: ({ divider }) => (!!divider ? "cien" : "ciento"),
      200: "doscientos",
      300: "trescientos",
      400: "cuatrocientos",
      500: "quinientos",
      600: "seiscientos",
      700: "setecientos",
      800: "ochocientos",
      900: "novecientos",
      1000: "mil",
      2000: "dos mil",
      3000: "tres mil",
      4000: "cuatro mil",
      5000: "cinco mil",
      6000: "seis mil",
      7000: "siete mil",
      8000: "ocho mil",
      9000: "nueve mil",
    },
    joinWith: ({ divider }) => (divider === 10 ? " y " : " "),
  },
  french: {
    builtBy: "Construit par",
    label: "Écris le nombre",
    locale: "fr-FR",
    words: {
      1: "un",
      2: "deux",
      3: "trois",
      4: "quatre",
      5: "cinq",
      6: "six",
      7: "sept",
      8: "huit",
      9: "neuf",
      10: "dix",
      11: "onze",
      12: "douze",
      13: "treize",
      14: "quatorze",
      15: "quinze",
      16: "seize",
      17: "dix-sept",
      18: "dix-huit",
      19: "dix-neuf",
      20: "vingt",
      21: "vingt et un",
      30: "trente",
      31: "trente et un",
      40: "quarante",
      41: "quarante et un",
      50: "cinquante",
      51: "cinquante et un",
      60: "soixante",
      61: "soixante et un",
      70: "soixante-dix",
      71: "soixante-et-onze",
      72: "soixante-douze",
      73: "soixante-treize",
      74: "soixante-quatorze",
      75: "soixante-quinze",
      76: "soixante-seize",
      77: "soixante-dix-sept",
      78: "soixante-dix-huit",
      79: "soixante-dix-neuf",
      80: "quatre-vingt",
      90: "quatre-vingt-dix",
      91: "quatre-vingt-dix",
      92: "quatre-vingt-douze",
      93: "quatre-vingt-treize",
      94: "quatre-vingt-quatorze",
      95: "quatre-vingt-quinze",
      96: "quatre-vingt-seize",
      97: "quatre-vingt-dix-sept",
      98: "quatre-vingt-dix-huit",
      99: "quatre-vingt-dix-neuf",
      100: "cent",
      200: "deux-cent",
      300: "trois-cent",
      400: "quatre-cent",
      500: "cinq-cent",
      600: "six-cent",
      700: "sept-cent",
      800: "huit-cent",
      900: "neuf-cent",
      1000: "mille",
    },
    joinWith: () => "-",
  },
};

export function getWord(
  value: number,
  language: Language,
  divider?: number,
): string {
  const { words, joinWith } = language;
  const found = words[value];
  if (found) {
    if (typeof found === "function") {
      return found({ divider });
    } else {
      return found;
    }
  } else if (divider && divider > 1) {
    const quotient = ~~(value / divider);
    const remainder = value % divider;
    let q;
    if (quotient > 1 && divider >= 1000) {
      // thousands behave differently 12_000 => "12 thousand"
      q = [getWord(quotient, language), getWord(divider, language)].join(
        joinWith({ quotient, divider, remainder }),
      );
    } else {
      q = getWord(quotient * divider, language);
    }
    const r = getWord(remainder, language, divider / 10);
    const _joinWith = joinWith({ remainder, divider });
    return [q, r].filter((v) => v).join(_joinWith);
  }
  return "";
}

export function toSentence(language: Language, value: number): string {
  return getWord(value, language, 1000);
}
