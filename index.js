import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createBareServer } from "@nebula-services/bare-server-node";
import chalk from "chalk";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mime from "mime";
import fetch from "node-fetch";
import config from "./config.js";

console.log(chalk.yellow("🚀 Starting optimized NebulaWeb server..."));

const __dirname = process.cwd();
const app = express();

// 🚀 Create HTTP server with Express attached (faster)
const server = http.createServer(app);

// 🚀 Optimized Bare server (FASTEST SETTINGS)
const bareServer = createBareServer("/ca/", {
  logLevel: "error",
  turbo: true,
  http2: true,
  maxConnections: 5000,
  keepAliveTimeout: 65000,
  requestTimeout: 60000
});

const PORT = process.env.PORT || 8080;

// 🚀 Keep-alive optimization (Railway-friendly)
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// -------------------------------
// 🔐 LOGIN SYSTEM (EVERY TIME)
// -------------------------------

// Parse cookies + form data
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Login middleware (ONLY for non-Bare routes)
app.use((req, res, next) => {
  if (req.path.startsWith("/ca/")) return next(); // 🚀 Skip login for proxy traffic
  if (req.path === "/login" || req.path === "/do-login") return next();

  const loggedIn = req.cookies.loggedin === "true";
  if (!loggedIn) return res.redirect("/login");

  next();
});

// Login page
app.get("/login", (req, res) => {
  res.send(`
    <html>
      <body style="font-family:sans-serif; background:#111; color:white; display:flex; justify-content:center; align-items:center; height:100vh;">
        <form method="POST" action="/do-login">
          <h2>Enter Password</h2>
          <input name="pw" type="password" style="padding:10px; font-size:18px;" />
          <button style="padding:10px 20px; font-size:18px;">Login</button>
        </form>
      </body>
    </html>
  `);
});

// Login handler
app.post("/do-login", (req, res) => {
  const pw = req.body.pw;
  const valid = Object.values(config.users).includes(pw);

  if (!valid) return res.send("Incorrect password.");

  res.setHeader("Set-Cookie", "loggedin=true; Path=/; HttpOnly; SameSite=Lax");
  res.redirect("/");
});

// Logout route
app.get("/logout", (req, res) => {
  res.setHeader("Set-Cookie", "loggedin=; Path=/; Max-Age=0");
  res.redirect("/login");
});

// -------------------------------
// ⚡ SUPER-OPTIMIZED ASSET FETCHER
// -------------------------------

const cache = new Map();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

app.get("/e/*", async (req, res, next) => {
  try {
    if (cache.has(req.path)) {
      const { data, contentType, timestamp } = cache.get(req.path);
      if (Date.now() - timestamp < CACHE_TTL) {
        res.setHeader("Cache-Control", "public, max-age=2592000");
        res.writeHead(200, { "Content-Type": contentType });
        return res.end(data);
      }
      cache.delete(req.path);
    }

    const baseUrls = {
      "/e/1/": "https://raw.githubusercontent.com/qrs/x/fixy/",
      "/e/2/": "https://raw.githubusercontent.com/3v1/V5-Assets/main/",
      "/e/3/": "https://raw.githubusercontent.com/3v1/V5-Retro/master/",
    };

    let reqTarget;
    for (const [prefix, baseUrl] of Object.entries(baseUrls)) {
      if (req.path.startsWith(prefix)) {
        reqTarget = baseUrl + req.path.slice(prefix.length);
        break;
      }
    }

    if (!reqTarget) return next();

    const asset = await fetch(reqTarget);
    if (!asset.ok) return next();

    const data = Buffer.from(await asset.arrayBuffer());
    const ext = path.extname(reqTarget);
    const contentType = ext === ".unityweb" ? "application/octet-stream" : mime.getType(ext);

    cache.set(req.path, { data, contentType, timestamp: Date.now() });

    res.setHeader("Cache-Control", "public, max-age=2592000");
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(500).send("Error fetching the asset");
  }
});

// -------------------------------
// ⚡ STATIC FILES (FAST)
// -------------------------------

app.use(express.static(path.join(__dirname, "static"), {
  maxAge: "30d",
  etag: false
}));

app.use("/ca", cors({ origin: true }));

// -------------------------------
// ⚡ ROUTES
// -------------------------------

const routes = [
  { path: "/b", file: "apps.html" },
  { path: "/a", file: "games.html" },
  { path: "/play.html", file: "games.html" },
  { path: "/c", file: "settings.html" },
  { path: "/d", file: "tabs.html" },
  { path: "/", file: "index.html" },
];

routes.forEach(route => {
  app.get(route.path, (_req, res) => {
    res.sendFile(path.join(__dirname, "static", route.file));
  });
});

// -------------------------------
// ⚡ 404 + ERROR HANDLERS
// -------------------------------

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "static", "404.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, "static", "404.html"));
});

// -------------------------------
// 🚀 BARE-FIRST ROUTING (FASTEST POSSIBLE)
// -------------------------------

server.on("request", (req, res) => {
  if (bareServer.shouldRoute(req)) {
    return bareServer.routeRequest(req, res);
  }
  app(req, res);
});

server.on("upgrade", (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    return bareServer.routeUpgrade(req, socket, head);
  }
  socket.end();
});

// -------------------------------
// 🚀 START SERVER
// -------------------------------

server.listen(PORT, () => {
  console.log(chalk.green(`🌍 NebulaWeb running at http://localhost:${PORT}`));
});
