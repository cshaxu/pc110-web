"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [loadError, setLoadError] = useState<string>();

  useEffect(() => {
    void import("../emulator/harness/app").catch(error => {
      setLoadError(error instanceof Error ? error.message : String(error));
    });
  }, []);

  return (
    <main className="application">
      <header>
        <h1>PC110 Web</h1>
        <p>Choose a disk image, then start the browser-local emulator.</p>
      </header>
      <section className="controls" aria-label="PC110 media">
        <label>Personaware disk image <input id="disk" type="file" required /><span id="disk-state" className="file-state">No file selected</span></label>
        <button id="start" type="button" disabled>Start PC110</button>
        <button id="restart" type="button" disabled>Restart</button>
      </section>
      <p id="status" role="status">Loading PC110 player…</p>
      {loadError ? <p id="load-error" role="alert">Player initialization failed: {loadError}</p> : null}
      <section id="display-shell" className="display-shell" aria-label="PC110 display">
        <div className="display-toolbar"><span>Click the display before using keyboard or pointer input.</span><button id="fullscreen" type="button">Full screen</button></div>
        <div className="display-viewport"><canvas id="display" width="720" height="400" tabIndex={0}>PC110 display canvas</canvas></div>
      </section>
    </main>
  );
}
