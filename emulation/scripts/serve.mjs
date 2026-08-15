import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, normalize, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const artifactRoot = resolve(process.env.PC110_WEB_ARTIFACT_DIR ?? resolve(root, "artifacts"));
const localMediaRoot = resolve(
  process.env.PC110_WEB_LOCAL_MEDIA_ROOT ?? "O:/assets/PC110Atlas-Personal-Media"
);
const port = Number.parseInt(process.env.PORT ?? "5173", 10);
const mime = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".wasm", "application/wasm"]
]);

function resolvePublicFile(requestPath) {
  const localMediaPrefix = "/_pc110-local-media/";
  const artifactPrefix = "/artifacts/";
  if (requestPath.startsWith(localMediaPrefix)) {
    const relativePath = decodeURIComponent(requestPath.slice(localMediaPrefix.length));
    return resolve(localMediaRoot, normalize(relativePath));
  }
  if (requestPath.startsWith(artifactPrefix)) {
    const relativePath = decodeURIComponent(requestPath.slice(artifactPrefix.length));
    return resolve(artifactRoot, normalize(relativePath));
  }

  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  return resolve(root, normalize(relativePath));
}

function isWithin(rootPath, candidate) {
  const pathFromRoot = relative(rootPath, candidate);
  return pathFromRoot !== "" && !pathFromRoot.startsWith("..") && !pathFromRoot.includes(":");
}

createServer((request, response) => {
  const requestPath = new URL(request.url ?? "/", "http://localhost").pathname;
  const servesLocalMedia = requestPath.startsWith("/_pc110-local-media/");
  const servesArtifacts = requestPath.startsWith("/artifacts/");
  const file = resolvePublicFile(requestPath);
  const allowedRoot = servesLocalMedia ? localMediaRoot : servesArtifacts ? artifactRoot : root;
  if (!isWithin(allowedRoot, file) || !existsSync(file) || statSync(file).isDirectory()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": mime.get(extname(file)) ?? "application/octet-stream",
    "Cache-Control": "no-store",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin"
  });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`PC110 Web serving at http://127.0.0.1:${port}/`);
  console.log(
    existsSync(localMediaRoot)
      ? `Local verification media available from ${localMediaRoot}`
      : `Local verification media unavailable: ${localMediaRoot}`
  );
  console.log(`WASM artifacts served from ${artifactRoot}`);
});
