import { useEffect, useState } from "react";

function saveResult({ guess, answer }) {
  const db = getResults();
  db.results = db.results || [];
  db.results.push({
    guess,
    answer,
    time: new Date().getTime(),
  });
}

function getState(defaultValue) {
  let db = window.localStorage.getItem("db");
  if (!db) {
    db = JSON.stringify(defaultValue);
  }
  return JSON.parse(db);
}

export function useStorage(defaultValue) {
  const [state, setState] = useState(defaultValue);

  useEffect(() => {
    setState(getState(defaultValue));
  }, []);

  return [
    state,
    (s) => {
      setState(() => {
        localStorage.setItem("db", JSON.stringify(s));
        return s;
      });
    },
  ];
}
