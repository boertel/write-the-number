import { useMemo, useRef, useEffect, useState } from "react";
import cn from "classnames";
import { useLocation, useNavigate } from "@remix-run/react";
import { Eye, EyeClosed, SoundHigh, SoundOff } from "iconoir-react";

import { useStorage } from "../useStorage";
import { useSpeechSynthesis } from "../useSpeechSynthesis";

import { LANGUAGES, toSentence } from "../toSentence";

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

  const { speak, hasSpeech } = useSpeechSynthesis(
    language === "spanish"
      ? {
          lang: LANGUAGES.spanish.locale,
          name: "Juan",
        }
      : { lang: LANGUAGES.french.locale, name: "Thomas" },
  );

  function rand() {
    return `${getRandomInt(1, parseInt(limit, 10))}`;
  }

  const submitCount = useRef<number>(0);
  const [status, setStatus] = useState<"pending" | "correct" | "wrong">(
    "pending",
  );

  const defaultNumbers = query.getAll("number");
  const firstNumber = defaultNumbers.pop();
  const [number, setNumber] = useState(firstNumber || rand());
  useEffect(() => {
    if (firstNumber && verbs.read) {
      setNumber(firstNumber);
    }
  }, [firstNumber, verbs]);

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
          if (defaultNumbers.length) {
            query.delete("number");
            defaultNumbers.forEach((n) => query.append("number", n));
          } else {
            query.set("number", rand());
          }
        }
        navigate(`${location.pathname}?${query.toString()}`);
        submitCount.current = 0;
        setStatus("pending");
        evt.target.value = "";
      }
    }
  };

  const onKeyDown = (evt) => {
    if (evt.key === "p" && evt.ctrlKey) {
      speak(number);
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
              className="text-6xl font-bold flex my-2 font-mono text-black"
            >
              {verbs.read || submitCount.current === 1 ? (
                <>
                  {new Intl.NumberFormat(LANGUAGES[language].locale).format(
                    number,
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
              name="guess"
              onKeyPress={onKeyPress}
              onKeyDown={onKeyDown}
              autoFocus={false}
            />
            <EnterKey
              className={cn(
                submitCount.current > 0 ? "opacity-20" : "opacity-0",
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
                <EyeClosed />
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
                <Eye />
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
                    isCorrect ? "bg-lime-600" : "bg-red-600",
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
