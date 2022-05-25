import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import type { LinksFunction } from "@remix-run/node"; // or "@remix-run/cloudflare"

import styles from "./tailwind.css";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Write the number",
  viewport: "width=device-width,initial-scale=1",
  "mobile-web-app-capable": "yes",
  "apple-touch-fullscreen": "yes",
  "apple-mobile-web-app-capable": "yes",
  "apple-mobile-web-app-status-bar-style": "black",
  "apple-mobile-web-app-title": "Write the number",
});

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Favicon emoji="🔢" />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

function faviconTemplate(string, icon) {
  return `<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22 style=%22${
    process.env.NODE_ENV !== "production" ? "filter: hue-rotate(120deg);" : ""
  }%22><text y=%221em%22 font-size=%2280%22>${icon}</text></svg>`.trim();
}

const Favicon = ({ emoji }) => {
  const svg = faviconTemplate`${emoji}`;
  const href = `data:image/svg+xml,${svg}`;
  return <link rel="icon" href={href} />;
};
