import { useMemo, useRef, useEffect, useState } from "react";
import cn from "classnames";
import { useLocation, useNavigate } from "react-router-dom";
import { EyeEmpty, EyeOff, SoundHigh, SoundOff } from "iconoir-react";

import { useStorage } from "../useStorage";
import { useSpeechSynthesis } from "../useSpeechSynthesis";

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

export default function Index() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);

  const limit = query.get("limit") || "1000";
  const language = query.get("language") || "spanish";
  const _verbs = query.getAll("verb");
  const hasListen = _verbs.includes("listen");
  const hasRead = _verbs.length === 0 ? true : _verbs.includes("read");
  const verbs: {
    listen: boolean;
    read: boolean;
  } = useMemo(() => {
    return {
      listen: hasListen,
      read: hasRead,
    };
  }, [hasListen, hasRead]);

  const defaultNumber = query.get("number");

  const { speak, hasSpeech } = useSpeechSynthesis(
    language === "spanish"
      ? {
          lang: LANGUAGES.spanish.locale,
          name: "Juan",
        }
      : { lang: LANGUAGES.french.locale, name: "Thomas" }
  );

  function rand() {
    return `${getRandomInt(1, parseInt(limit, 10))}`;
  }

  const submitCount = useRef<number>(0);
  const [status, setStatus] = useState<"pending" | "correct" | "wrong">(
    "pending"
  );
  const [number, setNumber] = useState(defaultNumber || rand());
  useEffect(() => {
    if (defaultNumber && verbs.read) {
      setNumber(defaultNumber);
    }
  }, [defaultNumber, verbs]);

  useEffect(() => {
    if (verbs.listen && hasSpeech) {
      speak(number);
    }
  }, [number, verbs, hasSpeech]);

  const [storage, setStorage] = useStorage([]);

  function getSentenceIn(number: string) {
    return toSentence(LANGUAGES[language], parseInt(number, 10));
  }

  const onKeyPress = (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      if (submitCount.current === 0) {
        const answer = getSentenceIn(number);
        const guess = evt.target.value.toLowerCase().trim();
        setStatus(answer === guess ? "correct" : "wrong");
        setStorage([...storage, { answer, guess, time: new Date().getTime() }]);
        submitCount.current += 1;
      } else {
        if (!verbs.read) {
          setNumber(rand());
        } else {
          query.set("number", rand());
        }
        navigate(`${location.pathname}?${query.toString()}`);
        submitCount.current = 0;
        setStatus("pending");
        evt.target.value = "";
      }
    }
  };

  const textarea = useRef<HTMLTextAreaElement>();
  useEffect(() => {
    if (textarea.current) {
      textarea.current.focus();
    }
  }, []);

  return (
    <div
      className={cn("bg-gray-200 h-screen pt-8", {
        "bg-lime-400": status === "correct",
        "bg-red-500": status === "wrong",
        "bg-gray-200": status === "pending",
      })}
    >
      <div className="max-w-prose h-full w-full mx-auto px-2 pt-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="mb-4">
            <h1 className="text-lg text-opacity-40 text-black mx-[3px]">
              {LANGUAGES[language].label}
            </h1>
            <label
              htmlFor="guess"
              className="text-6xl font-bold flex my-2 font-mono"
            >
              {verbs.read || submitCount.current === 1 ? (
                <>
                  {new Intl.NumberFormat(LANGUAGES[language].locale).format(
                    number
                  )}
                </>
              ) : (
                "??"
              )}
            </label>
            <select
              className="text-opacity-40 text-black bg-white bg-opacity-0 text-lg"
              onChange={(evt) => {
                query.set("language", evt.target.value);
                navigate(`${location.pathname}?${query.toString()}`);
              }}
              value={language}
            >
              <option value="spanish">en Español</option>
              <option value="french">en Français</option>
            </select>
          </div>
          <div className="relative">
            <textarea
              autoCapitalize="off"
              autoCorrect="false"
              spellCheck="false"
              autoComplete="off"
              rows={1}
              readOnly={submitCount.current > 0}
              className={cn(
                "resize-none focus:outline-none w-full border-2 border-opacity-60 rounded-md bg-white bg-opacity-20 text-xl focus:ring-2 px-4 py-4",
                {
                  "border-blue-400 ring-blue-400": status === "pending",
                  "border-lime-600 ring-lime-600": status === "correct",
                  "border-red-400 ring-red-800 line-through":
                    status === "wrong",
                }
              )}
              ref={textarea}
              id="guess"
              name="guess"
              onKeyPress={onKeyPress}
              autoFocus={false}
            />
            <EnterKey
              className={cn(
                submitCount.current > 0 ? "opacity-20" : "opacity-0"
              )}
            />
          </div>
          {status === "wrong" ? (
            <p className="px-4 mt-2 text-xl">
              <em>{getSentenceIn(number)}</em>
            </p>
          ) : null}
          <div className=" mx-[3px] mt-8 text-opacity-40 text-black transition-opacity hover:text-opacity-80 flex gap-4">
            {hasSpeech ? (
              !verbs.listen ? (
                <button
                  onClick={() => {
                    query.delete("verb");
                    if (verbs.read) {
                      query.append("verb", "read");
                    }
                    query.append("verb", "listen");
                    navigate(`${location.pathname}?${query.toString()}`);
                    textarea.current?.focus();
                  }}
                >
                  <SoundOff />
                </button>
              ) : (
                <button
                  onClick={() => {
                    query.delete("verb");
                    if (verbs.read) {
                      query.append("verb", "read");
                    } else {
                      query.delete("number");
                    }
                    navigate(`${location.pathname}?${query.toString()}`);
                    textarea.current?.focus();
                  }}
                >
                  <SoundHigh />
                </button>
              )
            ) : null}
            {!verbs.read ? (
              <button
                onClick={() => {
                  query.delete("verb");
                  if (verbs.listen) {
                    query.append("verb", "listen");
                  }
                  query.append("verb", "read");
                  navigate(`${location.pathname}?${query.toString()}`);
                  textarea.current?.focus();
                }}
              >
                <EyeOff />
              </button>
            ) : (
              <button
                onClick={() => {
                  query.delete("verb");
                  query.append("verb", "listen");
                  query.delete("number");
                  navigate(`${location.pathname}?${query.toString()}`);
                  textarea.current?.focus();
                }}
              >
                <EyeEmpty />
              </button>
            )}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-2">
            {LANGUAGES[language].builtBy}{" "}
            <a
              href="https://ben.oertel.fr"
              target="_blank"
              className="underline hover:font-semibold"
            >
              Benjamin Oertel
            </a>
          </div>
          <div
            className="grid gap-[1px]"
            style={{ gridTemplateColumns: `repeat(${storage.length}, 1fr)` }}
          >
            {storage.map((result, index: number) => {
              const isCorrect = result.answer === result.guess;
              return (
                <div
                  key={index}
                  title={
                    isCorrect
                      ? result.answer
                      : `${result.answer} <> ${result.guess}`
                  }
                  className={cn(
                    "h-[6px] cursor-pointer",
                    isCorrect ? "bg-lime-600" : "bg-red-600"
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function EnterKey({ className }: { className: string }) {
  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 right-0 flex h-full items-center px-2 text-black font-mono text-xs pointer-events-none",
        className
      )}
    >
      Press
      <div className="border px-[3px] border-black rounded-[3px] mx-[1ch]">
        Return
      </div>{" "}
      to continue
    </div>
  );
}

interface Language {
  builtBy: string;
  label: string;
  locale: string;
  words: Record<
    number,
    string | ((args: { divider?: number; remainder?: number }) => string)
  >;
  joinWith: (args: { divider?: number; remainder?: number }) => string;
}

const LANGUAGES: Record<string, Language> = {
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
      22: "veintidos",
      23: "veintitres",
      24: "veinticuatro",
      25: "veinticinco",
      26: "veintiseis",
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

function getWord(value: number, language: Language, divider?: number): string {
  const { words, joinWith } = language;
  const found = words[value];
  if (found) {
    if (typeof found === "function") {
      return found({ divider });
    } else {
      return found;
    }
  } else if (divider) {
    if (divider > 1) {
      const quotient = ~~(value / divider);
      const remainder = value % divider;
      const q = getWord(quotient * divider, language);
      const r = getWord(remainder, language, divider / 10);
      const _joinWith = joinWith({ remainder, divider });
      return [q, r].filter((v) => v).join(_joinWith);
    }
  }
  return "";
}

function toSentence(language: Language, value: number): string {
  return getWord(value, language, 100000);
}
