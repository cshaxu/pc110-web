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
      <header className="masthead">
        <h1>PC110 Web</h1>
        <section className="controls" aria-label="PC110 player controls">
          <label className="file-button" title="Choose a disk image to override the default"><span aria-hidden="true">📂</span><input id="disk" type="file" /><span className="sr-only">Choose disk image override</span></label>
          <button id="start" type="button" title="Play or resume" aria-label="Play or resume">▶️</button>
          <button id="pause" type="button" title="Pause (not yet available)" aria-label="Pause" disabled>⏸️</button>
          <button id="restart" type="button" title="Reset" aria-label="Reset" disabled>🔄</button>
          <span id="disk-state" className="file-state">Default: Personaware-realbios.img</span>
        </section>
      </header>
      {loadError ? <p id="load-error" role="alert">Player initialization failed: {loadError}</p> : null}
      <p className="capture-guidance">Click the display to capture keyboard and pointer input. Press <kbd>Right Shift</kbd> to release capture.</p>
      <section className="player-workspace" aria-label="PC110 player workspace">
        <section id="display-shell" className="display-shell" aria-label="PC110 display">
          <button id="fullscreen" className="fullscreen-button" type="button" title="Enter full screen" aria-label="Enter full screen">⛶</button>
          <div className="display-viewport"><canvas id="display" width="720" height="400" tabIndex={0}>PC110 display canvas</canvas></div>
        </section>
        <aside className="runtime-output" aria-label="PC110 runtime output">
          <header>Runtime output</header>
          <pre id="status" role="status" aria-live="polite">Loading PC110 player…</pre>
        </aside>
      </section>
    </main>
  );
}
