import { useRef, useEffect, useState } from "react";
import cn from "classnames";
import { useLocation, useNavigate } from "react-router-dom";

import { useStorage } from "../useStorage";

function getRandomInt(min, max) {
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

  function rand() {
    return getRandomInt(1, parseInt(limit, 10));
  }

  const submitCount = useRef<number>(0);
  const [status, setStatus] = useState<"pending" | "correct" | "wrong">(
    "pending"
  );
  const [number, setNumber] = useState(rand());

  const [storage, setStorage] = useStorage([]);

  function getSentenceIn(number) {
    return toSentence(LANGUAGES[language], number);
  }

  const onKeyPress = (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      if (submitCount.current === 0) {
        const answer = getSentenceIn(number);
        const guess = evt.target.value;
        setStatus(answer === guess ? "correct" : "wrong");
        setStorage([...storage, { answer, guess, time: new Date().getTime() }]);
        submitCount.current += 1;
      } else {
        setNumber(rand());
        submitCount.current = 0;
        setStatus("pending");
        evt.target.value = "";
      }
    }
  };

  const textarea = useRef();
  useEffect(() => {
    textarea.current.focus();
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
            <h1 className="text-lg text-opacity-40 text-black">
              {LANGUAGES[language].label}
            </h1>
            <label htmlFor="guess" className="text-6xl font-bold flex my-2">
              {number}
            </label>
            <select
              className=" text-opacity-40 text-black bg-white bg-opacity-0"
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
              autoCorrect="false"
              spellCheck={false}
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
        </div>
        <div
          className="grid gap-[1px] md:gap-1"
          style={{ gridTemplateColumns: `repeat(${storage.length}, 1fr)` }}
        >
          {storage.map((result, index) => {
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
  );
}

function EnterKey({ className }) {
  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 right-0 flex h-full items-center px-2 text-black font-mono text-xs",
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

const LANGUAGES = {
  spanish: {
    label: "Escribe el numero",
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
      14: "catorze",
      15: "quince",
      16: "dieciséis",
      17: "diecisiete",
      18: "dieciocho",
      19: "diecinueve",
      20: "viente",
      21: "vientiuno",
      22: "vientidos",
      23: "vientitres",
      24: "vienticuatro",
      25: "vienticinco",
      26: "vientiseis",
      27: "vientisiete",
      28: "vientiocho",
      29: "vientinueve",
      30: "trenta",
      40: "cuarenta",
      50: "cincuenta",
      60: "sesenta",
      70: "setenta",
      80: "ochenta",
      90: "noventa",
      100: "ciento",
      200: "doscientos",
      300: "trescientos",
      400: "cuatrocientos",
      500: "quinientos",
      600: "seisientos",
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
    joinWith: " y ",
  },
  french: {
    label: "Écris le nombre",
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
      100: "cent",
      200: "deux-cents",
      300: "trois-cents",
      400: "quatre-cents",
      500: "cinq-cents",
      600: "six-cents",
      700: "sept-cents",
      800: "huit-cents",
      900: "neuf-cents",
      1000: "mille",
    },
    joinWith: "-",
  },
};

function getWord(value: number, language, divider?: number): string {
  const { words, joinWith } = language;
  const found = words[value];
  if (found) {
    return found;
  } else {
    if (divider > 1) {
      const quotient = ~~(value / divider);
      const remainder = value % divider;
      const q = getWord(quotient * divider, language);
      const r = getWord(remainder, language, divider / 10);
      const _joinWith = divider === 10 ? joinWith : " ";
      return [q, r].filter((v) => v).join(_joinWith);
    }
  }
}

function toSentence(language, value: number): string {
  return getWord(value, language, 1000);
}
