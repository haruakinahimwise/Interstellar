// index.js
window.addEventListener("load", () => {
  navigator.serviceWorker.register("../sw.js?v=2025-04-15", {
    scope: "/a/",
  });
});

const form = document.getElementById("fv");
const input = document.getElementById("input");

if (form && input) {
  form.addEventListener("submit", e => {
    e.preventDefault();
    openGoogleCloak(input.value);
  });
}

function openGoogleCloak(value) {
  let url = value.trim();
  const engine = localStorage.getItem("engine") || "https://duckduckgo.com/?q=";

  if (!isUrl(url)) {
    url = engine + url;
  } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  const encoded = __uv$config.encodeUrl(url);

  // ⭐ Open a blank page
  const win = window.open("about:blank", "_blank");

  // ⭐ Inject Google cloak + service worker + iframe loader
  win.document.write(`
    <html>
      <head>
        <title>Google</title>
        <link rel="icon" href="https://www.google.com/favicon.ico">
        <style>
          body {
            margin: 0;
            background: #fff;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
          .logo {
            font-size: 80px;
            font-weight: bold;
            color: #4285F4;
            letter-spacing: -5px;
          }
          .logo span:nth-child(2) { color: #EA4335; }
          .logo span:nth-child(3) { color: #FBBC05; }
          .logo span:nth-child(4) { color: #4285F4; }
          .logo span:nth-child(5) { color: #34A853; }
          .logo span:nth-child(6) { color: #EA4335; }
          .loading {
            margin-top: 20px;
            font-size: 16px;
            color: #555;
          }
          iframe {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            border: none;
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="logo">
          <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
        </div>
        <div class="loading">Loading…</div>

        <iframe id="proxy-frame"></iframe>

        <script>
          // ⭐ Register service worker INSIDE the blank page
          navigator.serviceWorker.register("../sw.js?v=2025-04-15", { scope: "/a/" })
            .then(() => {
              const frame = document.getElementById("proxy-frame");
              frame.src = "/a/${encoded}";
              frame.onload = () => {
                document.body.innerHTML = "";
                frame.style.display = "block";
              };
            });
        </script>
      </body>
    </html>
  `);

  win.document.close();
}

function isUrl(val = "") {
  return /^http(s?):\/\//.test(val) || (val.includes(".") && val[0] !== " ");
}
