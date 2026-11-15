// Deploys the OpenNext bundle to the "meka-studio" Cloudflare Worker via the
// REST API, replicating wrangler's upload protocol directly so the deploy does
// not depend on wrangler's bundled proxy stack.
//
// Run with (the env vars must be set before node starts):
//   $env:NODE_USE_ENV_PROXY="1"; $env:NODE_USE_SYSTEM_CA="1";
//   $env:NODE_EXTRA_CA_CERTS="proxy-ca.pem";
//   $env:HTTPS_PROXY="http://127.0.0.1:4955"; $env:HTTP_PROXY="http://127.0.0.1:4955";
//   node scripts\deploy-rest.cjs [--dry-run]
process.env.NODE_USE_ENV_PROXY = process.env.NODE_USE_ENV_PROXY || "1";
process.env.NODE_USE_SYSTEM_CA = process.env.NODE_USE_SYSTEM_CA || "1";

const fs = require("fs");
const path = require("path");

const ACCOUNT_ID = "97777503afb12f1b023e3d1f711a2428";
const SCRIPT_NAME = "meka-studio";
const WORKERS_DEV_HOST = `${SCRIPT_NAME}.yicdvp.workers.dev`;
const TOKEN = fs.readFileSync(".cloudflare-token", "utf8").trim();
const BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}`;

const ASSETS_DIR = path.resolve(".open-next/assets");
// The uploadable esbuild bundle produced by
// `wrangler deploy --dry-run --outdir=.wrangler-dry`. Its main module imports
// the additional module files below by exact name (see extractWorkerParts).
const WORKER_DIR = path.resolve(".wrangler-dry");
const MAIN_MODULE = "worker.js";

// Mirrors wrangler.jsonc
const COMPAT_DATE = "2025-10-15";
const COMPAT_FLAGS = ["nodejs_compat", "global_fetch_strictly_public"];
const VARS = {
  ADMIN_EMAILS: "methupadevinda@gmail.com",
  SUPABASE_BUCKET: "media",
  MAX_UPLOAD_MB: "50",
  DATABASE_POOL_MAX: "2",
  NEXTJS_ENV: "production",
};
const SERVICE_BINDINGS = [{ name: "WORKER_SELF_REFERENCE", service: SCRIPT_NAME }];
const ASSETS_BINDING = { name: "ASSETS" };
const SECRETS_WANTED = ["DATABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SETUP_TOKEN"];

function die(msg) {
  console.error("FATAL:", msg);
  process.exit(1);
}
function log(msg) {
  console.log(msg);
}

async function api(method, urlPath, { body, headers = {}, bearer } = {}) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { Authorization: `Bearer ${bearer ?? TOKEN}`, ...headers },
    body,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    die(`${method} ${urlPath}: HTTP ${res.status}, non-JSON response: ${text.slice(0, 200)}`);
  }
  if (!json.success) {
    const e = (json.errors && json.errors[0]) || {};
    die(
      `${method} ${urlPath}: HTTP ${res.status} [code ${e.code}] ${e.message}` +
        (e.error_chain ? " | " + JSON.stringify(e.error_chain).slice(0, 300) : "")
    );
  }
  return json.result;
}

function jwtPayload(jwt) {
  try {
    return JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString("utf8"));
  } catch {
    return {};
  }
}

function readEnvSecrets() {
  const found = {};
  for (const lineRaw of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const line = lineRaw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!SECRETS_WANTED.includes(key)) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"') && val.length > 1) ||
      (val.startsWith("'") && val.endsWith("'") && val.length > 1)
    ) {
      val = val.slice(1, -1);
    }
    found[key] = val;
  }
  const missing = SECRETS_WANTED.filter((k) => !(k in found) || found[k] === "");
  if (missing.length) die(`.env is missing required secret(s): ${missing.join(", ")}`);
  return SECRETS_WANTED.map((name) => ({ name, text: found[name], type: "secret_text" }));
}

// Mirrors wrangler's buildAssetManifest + hashFile:
//   hash = blake3(base64(file content) + extensionWithoutDot).hex[0..32)
//   key  = "/" + path with forward slashes
const MIME = {
  js: "text/javascript", mjs: "text/javascript", cjs: "text/javascript",
  css: "text/css", html: "text/html", htm: "text/html",
  json: "application/json", map: "application/json", txt: "text/plain",
  svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", avif: "image/avif", ico: "image/x-icon",
  woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf",
  eot: "application/vnd.ms-fontobject", wasm: "application/wasm",
  webmanifest: "application/manifest+json", xml: "application/xml",
  pdf: "application/pdf", mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg",
  ogg: "audio/ogg", wav: "audio/wav", csv: "text/csv",
};
function contentTypeFor(absPath) {
  const ext = path.extname(absPath).slice(1).toLowerCase();
  let ct = MIME[ext] ?? null;
  if (ct && ct.startsWith("text/") && !ct.includes("charset")) ct += "; charset=utf-8";
  return ct;
}

function buildManifest(dir) {
  const blake3 = require("blake3-wasm");
  const manifest = {};
  const files = [];
  (function walk(rel) {
    for (const dirent of fs.readdirSync(rel ? path.join(dir, rel) : dir, { withFileTypes: true })) {
      const relPath = rel ? `${rel}/${dirent.name}` : dirent.name;
      if (dirent.isDirectory()) walk(relPath);
      else if (dirent.isFile()) {
        // wrangler ignores its own metafiles
        if (relPath === ".assetsignore" || relPath === "_redirects" || relPath === "_headers") continue;
        files.push(relPath);
      }
    }
  })("");
  for (const rel of files) {
    const abs = path.join(dir, rel);
    const content = fs.readFileSync(abs);
    const ext = path.extname(abs).slice(1); // no leading dot
    const hash = blake3.hash(content.toString("base64") + ext).toString("hex").slice(0, 32);
    manifest["/" + rel] = { hash, size: content.length };
  }
  return manifest;
}

// Additional module parts bundled alongside the main module (wasm, fonts...).
// esbuild emits their imports as "./<name>", so the form part name is <name>.
const PART_TYPES = {
  wasm: "application/wasm", // CompiledWasm
  bin: "application/octet-stream", // Data
  txt: "text/plain",
  css: "text/css",
  html: "text/html",
  json: "application/json",
  mjs: "application/javascript+module",
  js: "application/javascript+module",
};
function extractWorkerParts(bundlePath) {
  const src = fs.readFileSync(bundlePath, "utf8");
  const parts = new Map();
  for (const m of src.matchAll(/["']\.\/([^"'\s]+?\.[A-Za-z0-9]+)["']/g)) {
    const name = m[1];
    if (!fs.existsSync(path.join(WORKER_DIR, name))) continue;
    const type = PART_TYPES[name.split(".").pop().toLowerCase()];
    if (!type) die(`unknown additional module extension for part: ${name}`);
    parts.set(name, type);
  }
  if (parts.size === 0) die("no additional module parts found in the bundle");
  return [...parts.entries()].map(([name, type]) => ({ name, type }));
}

(async () => {
  const t0 = Date.now();
  const manifest = buildManifest(ASSETS_DIR);
  const manifestPaths = Object.keys(manifest);
  const totalBytes = manifestPaths.reduce((a, p) => a + manifest[p].size, 0);
  log(`manifest: ${manifestPaths.length} assets, ${totalBytes} bytes total`);
  if (process.argv.includes("--dry-run")) {
    log("(dry-run) sample entries:");
    for (const p of manifestPaths.slice(0, 5)) log(`  ${p} -> ${manifest[p].hash} (${manifest[p].size}b)`);
    return;
  }
  const byHash = new Map(manifestPaths.map((p) => [manifest[p].hash, p]));

  // 1) asset upload session
  log("1/5 requesting asset upload session...");
  const session = await api("POST", `/workers/scripts/${SCRIPT_NAME}/assets-upload-session`, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ manifest }),
  });
  const sessionJwt = session.jwt;
  if (!sessionJwt) die("no jwt in assets-upload-session response");
  const buckets = session.buckets || [];
  const toUpload = buckets.flat();
  log(`   ${toUpload.length} of ${manifestPaths.length} asset(s) need uploading (in ${buckets.length} bucket(s))`);

  // 2) upload the requested files; the last response's jwt is the completion token
  let completionJwt = sessionJwt;
  if (toUpload.length) {
    const claims = jwtPayload(sessionJwt);
    const single = claims.wrangler_single_asset_uploads === true;
    log(`   upload mode: ${single ? "single-asset" : "bulk"}`);
    if (single) {
      for (const hash of toUpload) {
        const rel = byHash.get(hash);
        if (!rel) die(`server requested unknown hash ${hash}`);
        const abs = path.join(ASSETS_DIR, rel);
        const ct = contentTypeFor(abs) ?? "application/null";
        const res = await fetch(`${BASE}/workers/assets/upload/${hash}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${sessionJwt}`, "Content-Type": ct },
          body: fs.readFileSync(abs),
        });
        const j = await res.json().catch(() => null);
        if (!j || !j.success) die(`asset upload ${rel}: HTTP ${res.status} ${JSON.stringify(j).slice(0, 200)}`);
        const jw = (j.result && j.result.jwt) || j.jwt;
        if (jw) completionJwt = jw;
        log(`   + ${rel}`);
      }
    } else {
      let done = 0;
      for (let i = 0; i < buckets.length; i++) {
        const bucket = buckets[i];
        const form = new FormData();
        for (const hash of bucket) {
          const rel = byHash.get(hash);
          if (!rel) die(`server requested unknown hash ${hash}`);
          const abs = path.join(ASSETS_DIR, rel);
          // "application/null" tells the API to store no Content-Type
          const ct = contentTypeFor(abs) ?? "application/null";
          form.set(hash, new File([fs.readFileSync(abs).toString("base64")], hash, { type: ct }));
        }
        const res = await fetch(`${BASE}/workers/assets/upload?base64=true`, {
          method: "POST",
          headers: { Authorization: `Bearer ${sessionJwt}` },
          body: form,
        });
        const j = await res.json().catch(() => null);
        if (!j || !j.success) {
          die(`bucket ${i + 1}/${buckets.length}: HTTP ${res.status} ${JSON.stringify(j).slice(0, 300)}`);
        }
        const jw = (j.result && j.result.jwt) || j.jwt;
        if (jw) completionJwt = jw;
        done += bucket.length;
        log(`   bucket ${i + 1}/${buckets.length}: ${bucket.length} file(s) uploaded (${done}/${toUpload.length})`);
      }
    }
  }

  // 3) upload the worker script (multipart: metadata + worker.js)
  log("2/5 uploading worker script...");
  const metadata = {
    main_module: "worker.js",
    bindings: [
      ...Object.entries(VARS).map(([name, text]) => ({ name, type: "plain_text", text })),
      ...SERVICE_BINDINGS.map(({ name, service }) => ({ name, type: "service", service })),
      { ...ASSETS_BINDING, type: "assets" },
    ],
    compatibility_date: COMPAT_DATE,
    compatibility_flags: COMPAT_FLAGS,
    keep_bindings: ["secret_text", "secret_key"],
    assets: { jwt: completionJwt, config: {} },
    observability: { enabled: true },
  };
  const scriptForm = new FormData();
  scriptForm.set("metadata", JSON.stringify(metadata));
  scriptForm.set(
    MAIN_MODULE,
    new File([fs.readFileSync(path.join(WORKER_DIR, MAIN_MODULE))], MAIN_MODULE, {
      type: "application/javascript+module",
    })
  );
  for (const part of extractWorkerParts(path.join(WORKER_DIR, MAIN_MODULE))) {
    const abs = path.join(WORKER_DIR, part.name);
    scriptForm.set(part.name, new File([fs.readFileSync(abs)], part.name, { type: part.type }));
    log(`   + module ${part.name} (${part.type}, ${fs.statSync(abs).size}b)`);
  }
  const deployRes = await api("PUT", `/workers/scripts/${SCRIPT_NAME}?excludeScript=true&bindings_inherit=strict`, {
    body: scriptForm,
  });
  log(`   deployed: version=${deployRes.id ?? "?"} etag=${deployRes.etag ?? "?"}`);

  // 4) secrets (single-object PUT per secret)
  log("3/5 setting secrets...");
  for (const s of readEnvSecrets()) {
    await api("PUT", `/workers/scripts/${SCRIPT_NAME}/secrets`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    log(`   secret ${s.name}: set`);
  }

  // 5) enable the workers.dev subdomain
  log("4/5 enabling workers.dev subdomain...");
  const sub = await api("POST", `/workers/scripts/${SCRIPT_NAME}/subdomain`, {
    headers: {
      "Content-Type": "application/json",
      "Cloudflare-Workers-Script-Api-Date": "2025-08-01",
    },
    body: JSON.stringify({ enabled: true, previews_enabled: false }),
  });
  log(`   subdomain: ${JSON.stringify(sub)}`);

  log("5/5 verifying live URLs...");
  for (const url of [`https://${WORKERS_DEV_HOST}/`, `https://${WORKERS_DEV_HOST}/api/health`]) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "curl/8.0" }, redirect: "manual" });
      const body = await r.text();
      log(`   ${url} -> HTTP ${r.status} ${body.slice(0, 120).replace(/\s+/g, " ")}`);
    } catch (e) {
      log(`   ${url} -> ERR ${(e.cause && e.cause.message) || e.message}`);
    }
  }
  log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
})().catch((e) => die((e && e.stack) || String(e)));
