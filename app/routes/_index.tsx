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

export async function clientLoader({ request }: ClientLoaderFunctionArgs) {
  const url = new URL(request.url);
  const qs = url.searchParams;

  const number = qs.get("number") as number | null;
  const limit = parseInt(qs.get("limit") || "10", 100);
  if (number === null) {
    qs.set("number", rand(limit).toString());
    return redirect(`/?${qs.toString()}`);
  }

  const verbs = qs.getAll("verb");

  const language = (qs.get("language") || "spanish") as "french" | "spanish";
  const guess = qs.get("guess") || undefined;
  let status: "pending" | "correct" | "wrong" = "pending";
  let answer = "";
  let storage: Array<{ answer: string; guess: string; time: number }> =
    JSON.parse(window.localStorage.getItem("db") || "[]");
  if (guess) {
    answer = getSentenceIn(language, number);
    status = answer === guess ? "correct" : "wrong";
    storage = [...storage, { answer, guess, time: new Date().getTime() }];
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
  useEffect(() => {
    if (textarea.current) {
      textarea.current.focus();
    }
  }, []);

  return (
    <Form
      onSubmit={() => {
        if (isReviewing && textarea.current) {
          textarea.current.value = "";
        }
      }}
      className={cn("bg-gray-200 h-screen pt-8", {
        "bg-lime-400": status === "correct",
        "bg-red-400": status === "wrong",
        "bg-gray-200": status === "pending",
      })}
      ref={form}
    >
      <div className="max-w-prose h-full w-full mx-auto px-2 pt-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="mb-4">
            <h1 className="text-lg text-opacity-40 text-black mx-[3px]">
              {label}
            </h1>
            <input
              type="hidden"
              name="number"
              defaultValue={isReviewing ? next : number}
            />
            <label
              htmlFor="guess"
              className="text-6xl font-bold flex my-2 font-mono text-black"
            >
              {read || isReviewing ? (
                <>{new Intl.NumberFormat(locale).format(number)}</>
              ) : (
                "??"
              )}
            </label>
            <select
              className="text-opacity-40 text-black bg-white bg-opacity-0 text-lg"
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
                "resize-none focus:outline-none w-full border-2 border-opacity-60 rounded-md bg-white bg-opacity-20 text-xl focus:ring-2 px-4 py-4 text-black",
                {
                  "border-blue-400 ring-blue-400": status === "pending",
                  "border-lime-600 ring-lime-600": status === "correct",
                  "border-red-400 ring-red-800 line-through":
                    status === "wrong",
                },
              )}
              ref={textarea}
              id="guess"
              name={isReviewing ? undefined : "guess"}
              defaultValue={guess}
              onKeyPress={onKeyPress}
              onKeyDown={onKeyDown}
              autoFocus={false}
            />
            <EnterKey
              className={cn(isReviewing ? "opacity-20" : "opacity-0")}
            />
          </div>
          {status === "wrong" ? (
            <p className="px-4 mt-2 text-xl">
              <em>{answer}</em>
            </p>
          ) : null}
          <div className=" mx-[3px] mt-8 text-opacity-40 text-black transition-opacity hover:text-opacity-80 flex gap-4">
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
          <div className="text-gray-400 text-xs mb-2">
            {builtBy}{" "}
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
                    isCorrect ? "bg-lime-600" : "bg-red-600",
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>
    </Form>
  );
}

function EnterKey({ className }: { className: string }) {
  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 right-0 flex h-full items-center px-2 text-black font-mono text-xs pointer-events-none",
        className,
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
