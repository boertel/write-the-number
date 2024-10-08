import { useRef, useEffect } from "react";
import cn from "classnames";
import {
  ClientLoaderFunctionArgs,
  useLoaderData,
  Form,
  redirect,
} from "@remix-run/react";
import { Eye, EyeClosed, SoundHigh, SoundOff } from "iconoir-react";

import { useSpeechSynthesis } from "../useSpeechSynthesis";

import { LANGUAGES, toSentence } from "../toSentence";

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

type StorageItem = {
  number: number;
  answer: string;
  guess: string;
  time: number;
};

export async function clientLoader({ request }: ClientLoaderFunctionArgs) {
  const url = new URL(request.url);
  const qs = url.searchParams;

  const number = qs.get("number") as number | null;
  const limit = parseInt(qs.get("limit") || "100", 10);
  if (number === null) {
    qs.set("number", rand(limit).toString());
    return redirect(`/?${qs.toString()}`);
  }

  const verbs = qs.getAll("verb");

  const language = (qs.get("language") || "spanish") as "french" | "spanish";
  const guess = qs.get("guess") || undefined;
  let status: "pending" | "correct" | "wrong" = "pending";
  let answer = "";
  let storage: Array<StorageItem> = JSON.parse(
    window.localStorage.getItem("db") || "[]",
  );
  if (guess) {
    answer = getSentenceIn(language, number);
    status = answer === guess ? "correct" : "wrong";
    storage = [
      ...storage,
      { answer, guess, number, time: new Date().getTime() },
    ];
    window.localStorage.setItem("db", JSON.stringify(storage));
  }

  return {
    language,
    storage,
    listen: verbs.includes("listen"),
    read: verbs.length === 0 ? true : verbs.includes("read"),
    guess,
    status,
    answer,
    number,
    next: getNext(limit, number),
    label: LANGUAGES[language].label,
    locale: LANGUAGES[language].locale,
    builtBy: LANGUAGES[language].builtBy,
  };
}

function getSentenceIn(language: "french" | "spanish", number: number): string {
  return toSentence(LANGUAGES[language], number);
}

function rand(limit: number): number {
  return getRandomInt(1, limit);
}

function getNext(limit: number, current: number): number {
  let next = rand(limit);
  while (next === current) {
    next = rand(limit);
  }
  return next;
}

function findGroupOfTen(num: number): number {
  return Math.floor(num / 10) * 10;
}

export default function Index() {
  const {
    language,
    listen,
    read,
    number,
    status,
    label,
    locale,
    builtBy,
    answer,
    guess,
    next,
    storage,
  } = useLoaderData<typeof clientLoader>();

  const { speak, hasSpeech } = useSpeechSynthesis(
    language === "spanish"
      ? {
          lang: LANGUAGES.spanish.locale,
        }
      : { lang: LANGUAGES.french.locale, name: "Thomas" },
  );

  useEffect(() => {
    if (listen && hasSpeech && number) {
      speak(number.toString());
    }
  }, [number, listen, hasSpeech]);

  const onKeyPress = (evt: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (evt.key === "Enter") {
      form.current?.requestSubmit();
      evt.preventDefault();
    }
  };

  const onKeyDown = (evt: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (evt.ctrlKey && evt.key === "p") {
      speak(number.toString());
    }
  };
  const form = useRef<HTMLFormElement | null>(null);
  const isReviewing = !!answer && !!number;

  const textarea = useRef<HTMLTextAreaElement | null>(null);

  const mistakes = storage
    .filter((result) => result.answer !== result.guess)
    .reduce<Record<number, StorageItem[]>>((acc, item) => {
      const ten = findGroupOfTen(item.number);
      acc[ten] ??= [];
      acc[ten].push(item);
      return acc;
    }, {});

  return (
    <Form
      onSubmit={() => {
        if (isReviewing && textarea.current) {
          textarea.current.value = "";
        }
      }}
      className={cn(
        "text-black dark:text-white h-screen pt-8 transition-colors",
        {
          "bg-lime-400 dark:bg-lime-900": status === "correct",
          "bg-red-400 dark:bg-red-900": status === "wrong",
          "bg-gray-200 dark:bg-neutral-950": status === "pending",
        },
      )}
      ref={form}
    >
      <div className="max-w-prose h-full w-full mx-auto px-2 pt-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="mb-4">
            <h1 className="text-lg text-black/40 dark:text-white/40 mx-1">
              {label}
            </h1>
            <input
              type="hidden"
              name="number"
              defaultValue={isReviewing ? next : number}
            />
            <label
              htmlFor="guess"
              className="text-6xl font-bold flex my-2 font-mono"
            >
              {read || isReviewing ? (
                <>{new Intl.NumberFormat(locale).format(number)}</>
              ) : (
                "??"
              )}
            </label>
            <select
              className="text-black/40 dark:text-white/40 bg-transparent bg-opacity-0 text-lg"
              name="language"
              onChange={() => {
                form.current?.requestSubmit();
              }}
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
              readOnly={isReviewing}
              className={cn(
                "resize-none w-full border-2 border-blue-600/60 rounded-md bg-white bg-opacity-10 text-xl transition-all",
                "focus:outline-none ring-blue-600/60 focus:ring-4 px-4 py-4",
                {
                  "border-blue-600/60 ring-blue-400": status === "pending",
                  "border-lime-600/60 ring-lime-600/60": status === "correct",
                  "border-red-600/60 ring-red-600/60 line-through":
                    status === "wrong",
                },
              )}
              ref={textarea}
              id="guess"
              name={isReviewing ? undefined : "guess"}
              key={number}
              defaultValue={guess}
              onKeyPress={onKeyPress}
              onKeyDown={onKeyDown}
              autoFocus={true}
            />
            <EnterKey
              className={cn(isReviewing ? "opacity-40" : "opacity-0")}
            />
          </div>
          <p className="px-4 mt-2 text-xl">
            {status === "wrong" ? <em>{answer}</em> : <>&nbsp;</>}
          </p>
          <div className="mx-1 mt-8 text-black/40 dark:text-white/40 transition-opacity hover:text-opacity-80 flex gap-4">
            {hasSpeech ? (
              <div>
                <label className="">
                  <input
                    aria-label="Listen"
                    aria-hidden="true"
                    className="peer hidden"
                    type="checkbox"
                    name="verb"
                    value="listen"
                    defaultChecked={listen}
                    onChange={() => form.current?.requestSubmit()}
                  />
                  <SoundOff className="block peer-[:checked]:hidden" />
                  <SoundHigh className="hidden peer-[:checked]:block" />
                </label>
              </div>
            ) : null}
            {listen ? (
              <div>
                <label className="">
                  <input
                    aria-label="Read"
                    className="peer hidden"
                    aria-hidden="true"
                    type="checkbox"
                    name="verb"
                    value="read"
                    defaultChecked={read}
                    onChange={() => form.current?.requestSubmit()}
                  />
                  <EyeClosed className="block peer-[:checked]:hidden" />
                  <Eye className="hidden peer-[:checked]:block" />
                </label>
              </div>
            ) : null}
          </div>
        </div>
        <div>
          <div className="text-black/40 dark:text-white/40 text-xs mb-2">
            {builtBy}{" "}
            <a
              href="https://ben.oertel.fr"
              target="_blank"
              className="underline hover:font-semibold"
            >
              Benjamin Oertel
            </a>
          </div>
          <details>
            <summary
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
                      isCorrect ? "bg-lime-600" : "bg-red-600",
                    )}
                  />
                );
              })}
            </summary>
            <ul className="py-2">
              <li>Main mistakes were:</li>
              {Object.keys(mistakes)
                .sort((a, z) => mistakes[z].length - mistakes[a].length)
                .map((ten) => {
                  return (
                    <li key={ten}>
                      {ten}:{" "}
                      {mistakes[ten].map(({ number }) => (
                        <span className={number}>{number}, </span>
                      ))}
                    </li>
                  );
                })}
            </ul>
          </details>
        </div>
      </div>
    </Form>
  );
}

function EnterKey({ className }: { className: string }) {
  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 right-0 flex h-full items-center px-2",
        "text-black dark:text-white font-mono text-xs pointer-events-none",
        className,
      )}
    >
      Press
      <div className="border px-[3px] border-black dark:border-white rounded-[3px] mx-[1ch]">
        Return
      </div>{" "}
      to continue
    </div>
  );
}
