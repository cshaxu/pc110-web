// This code implements the `-sMODULARIZE` settings by taking the generated
// JS program code (INNER_JS_CODE) and wrapping it in a factory function.

// When targeting node and ES6 we use `await import ..` in the generated code
// so the outer function needs to be marked as async.
async function Module(moduleArg = {}) {
  var Module = moduleArg;
// include: shell.js
// include: minimum_runtime_check.js
(function() {
  // "30.0.0" -> 300000
  function humanReadableVersionToPacked(str) {
    str = str.split('-')[0]; // Remove any trailing part from e.g. "12.53.3-alpha"
    var vers = str.split('.').slice(0, 3);
    while(vers.length < 3) vers.push('00');
    vers = vers.map((n, i, arr) => n.padStart(2, '0'));
    return vers.join('');
  }
  // 300000 -> "30.0.0"
  var packedVersionToHumanReadable = n => [n / 10000 | 0, (n / 100 | 0) % 100, n % 100].join('.');

  var TARGET_NOT_SUPPORTED = 2147483647;

  // Note: We use a typeof check here instead of optional chaining using
  // globalThis because older browsers might not have globalThis defined.

  // We skip the node version checking when running on Bun/Deno since the node
  // version they report doesn't seem to be useful.
  if (typeof process !== 'undefined' && !process.versions?.bun && typeof Deno == "undefined") {
    var currentNodeVersion = process.versions?.node ? humanReadableVersionToPacked(process.versions.node) : TARGET_NOT_SUPPORTED;
    if (currentNodeVersion < TARGET_NOT_SUPPORTED) {
      throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');
    }
    if (currentNodeVersion < 2147483647) {
      throw new Error(`This emscripten-generated code requires node v${ packedVersionToHumanReadable(2147483647) } (detected v${packedVersionToHumanReadable(currentNodeVersion)})`);
    }
  }

  var userAgent = typeof navigator !== 'undefined' && navigator.userAgent;
  if (!userAgent) {
    return;
  }

  var currentSafariVersion = userAgent.includes("Safari/") && !userAgent.includes("Chrome/") && userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/) ? humanReadableVersionToPacked(userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentSafariVersion < TARGET_NOT_SUPPORTED) {
    throw new Error(`This page was compiled without support for Safari browser. Pass -sMIN_SAFARI_VERSION=${currentSafariVersion} or lower to enable support for this browser.`);
  }
  if (currentSafariVersion < 2147483647) {
    throw new Error(`This emscripten-generated code requires Safari v${ packedVersionToHumanReadable(2147483647) } (detected v${currentSafariVersion})`);
  }

  var currentFirefoxVersion = userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentFirefoxVersion < 134) {
    throw new Error(`This emscripten-generated code requires Firefox v134 (detected v${currentFirefoxVersion})`);
  }

  var currentChromeVersion = userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentChromeVersion < 133) {
    throw new Error(`This emscripten-generated code requires Chrome v133 (detected v${currentChromeVersion})`);
  }
})();

// end include: minimum_runtime_check.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = !!globalThis.window;
var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = globalThis.process?.versions?.node && globalThis.process?.type != 'renderer';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() running directly in a worker. (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)

// The way we signal to a worker that it is hosting a pthread is to construct
// it with a specific name.
var ENVIRONMENT_IS_PTHREAD = ENVIRONMENT_IS_WORKER && globalThis.name?.startsWith('em-pthread')

if (ENVIRONMENT_IS_PTHREAD) {
  assert(!globalThis.moduleLoaded, 'module should only be loaded once on each pthread worker');
  globalThis.moduleLoaded = true;
}

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


var programArgs = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

var _scriptName = import.meta.url;

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_SHELL) {

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  try {
    scriptDirectory = new URL('.', _scriptName).href; // includes trailing slash
  } catch {
    // Must be a `blob:` or `data:` URL (e.g. `blob:http://site.com/etc/etc`), we cannot
    // infer anything from them.
  }

  if (!(globalThis.window || globalThis.WorkerGlobalScope)) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  {
// include: web_or_worker_shell_read.js
if (ENVIRONMENT_IS_WORKER) {
    readBinary = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.responseType = 'arraybuffer';
      xhr.send(null);
      return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
    };
  }

  readAsync = async (url) => {
    assert(!isFileURI(url), "readAsync does not work with file:// URLs");
    var response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
      return response.arrayBuffer();
    }
    throw new Error(response.status + ' : ' + response.url);
  };
// end include: web_or_worker_shell_read.js
  }
} else
{
  throw new Error('environment detection error');
}

var out = console.log.bind(console);
var err = console.error.bind(console);

var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var FETCHFS = 'FETCHFS is no longer included by default; build with -lfetchfs.js';
var ICASEFS = 'ICASEFS is no longer included by default; build with -licasefs.js';
var JSFILEFS = 'JSFILEFS is no longer included by default; build with -ljsfilefs.js';
var OPFS = 'OPFS is no longer included by default; build with -lopfs.js';

var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

// perform assertions in shell.js after we set up out() and err(), as otherwise
// if an assertion fails it cannot print the message
assert(
  ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER || ENVIRONMENT_IS_NODE, 'pthreads do not work in this environment yet (need Web Workers, or an alternative to them)');

assert(!ENVIRONMENT_IS_NODE, 'node environment detected but not enabled at build time (add `node` to `-sENVIRONMENT` to enable)');

assert(!ENVIRONMENT_IS_SHELL, 'shell environment detected but not enabled at build time (add `shell` to `-sENVIRONMENT` to enable)');

// end include: shell.js

// include: preamble.js
// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;

if (!globalThis.WebAssembly) {
  err('no native wasm support detected');
}

// Wasm globals

// For sending to workers.
var wasmModule;

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = (filename) => filename.startsWith('file://');

// include: runtime_common.js
// include: runtime_exceptions.js
// Base Emscripten EH error class
class EmscriptenEH {}

class EmscriptenSjLj extends EmscriptenEH {}

// end include: runtime_exceptions.js
// include: runtime_debug.js
var runtimeDebug = true; // Switch to false at runtime to disable logging at the right times

// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(...args) {
  if (!runtimeDebug && typeof runtimeDebug != 'undefined') return;
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...args);
}

// Endianness check
(() => {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) abort('Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)');
})();

function consumedModuleProp(prop) {
  var value = Module[prop];
  var msg = `Attempt to modify \`Module.${prop}\` after it has already been processed.  This can happen, for example, when code is injected via '--post-js' rather than '--pre-js'`;
  if (Array.isArray(value)) {
    value = new Proxy(value, {
      set(target, key, val) {
        abort(msg);
        return false;
      },
      defineProperty(target, key, descriptor) {
        abort(msg);
        return false;
      },
      deleteProperty(target, key) {
        abort(msg);
        return false;
      }
    });
  }
  Object.defineProperty(Module, prop, {
    configurable: true,
    get() { return value; },
    set() {
      abort(msg);
    }
  });
}

function makeInvalidEarlyAccess(name) {
  return () => assert(false, `call to '${name}' via reference taken before Wasm module initialization`);

}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_preloadFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

function missingLibrarySymbol(sym) {

  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (ENVIRONMENT_IS_PTHREAD) {
    return;
  }
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      },
    });
  }
}

/**
 * Override `err`/`out`/`dbg` to report thread / worker information
 */
function initWorkerLogging() {
  function getLogPrefix() {
    var t = 0;
    if (runtimeInitialized && typeof _pthread_self != 'undefined'
    ) {
      t = _pthread_self();
    }
    return `w:${workerID},t:${ptrToString(t)}:`;
  }

  // Prefix all dbg() messages with the calling thread info.
  var origDbg = dbg;
  dbg = (...args) => origDbg(getLogPrefix(), ...args);
}

initWorkerLogging();

// end include: runtime_debug.js
// include: runtime_stack_check.js
const stackCookie1 = 0x02135467;
const stackCookie2 = 0x89BACDFE;

// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)/4)] = stackCookie1;
  HEAPU32[(((max)+(4))/4)] = stackCookie2;
  // Also test the global address 0 for integrity.
  HEAPU32[((0)/4)] = 1668509029;
}

function u32ToHexString(num) {
  return '0x' + (num >>> 0).toString(16).padStart(8, '0');
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var val1 = HEAPU32[((max)/4)];
  var val2 = HEAPU32[(((max)+(4))/4)];
  if (val1 != stackCookie1 || val2 != stackCookie2) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords ${u32ToHexString(stackCookie2)} and ${u32ToHexString(stackCookie1)}, but received ${u32ToHexString(val2)} ${u32ToHexString(val1)}`);
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[((0)/4)] != 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
}
// end include: runtime_stack_check.js
// include: runtime_pthread.js
// Pthread Web Worker handling code.
// This code runs only on pthread web workers and handles pthread setup
// and communication with the main thread via postMessage.

// Unique ID of the current pthread worker (zero on non-pthread-workers
// including the main thread).
var workerID = 0;

var startWorker;

if (ENVIRONMENT_IS_PTHREAD) {
  // Thread-local guard variable for one-time init of the JS state
  var initializedJS = false;

  // Turn unhandled rejected promises into errors so that the main thread will be
  // notified about them.
  self.onunhandledrejection = (e) => { throw e.reason || e; };

  function handleMessage(e) {
    try {
      var msgData = e.data;
      //dbg('msgData: ' + Object.keys(msgData));
      var cmd = msgData.cmd;
      if (cmd == 1) { // Preload command that is called once per worker to parse and load the Emscripten code.
        workerID = msgData.workerID;

        // Until we initialize the runtime, queue up any further incoming messages.
        let messageQueue = [];
        self.onmessage = (e) => messageQueue.push(e);

        // And add a callback for when the runtime is initialized.
        startWorker = () => {
          // Notify the main thread that this thread has loaded.
          postMessage({ cmd: 3 });
          // Process any messages that were queued before the thread was ready.
          for (let msg of messageQueue) {
            handleMessage(msg);
          }
          // Restore the real message handler.
          self.onmessage = handleMessage;
        };

        // Use `const` here to ensure that the variable is scoped only to
        // that iteration, allowing safe reference from a closure.
        for (const handler of msgData.handlers) {
          // If the main module has a handler for a certain event, but no
          // handler exists on the pthread worker, then proxy that handler
          // back to the main thread.
          if (!Module[handler] || Module[handler].proxy) {
            Module[handler] = (...args) => {
              postMessage({ cmd: 9, handler, args: args });
            }
            // Rebind the out / err handlers if needed
            if (handler == 'print') out = Module[handler];
            if (handler == 'printErr') err = Module[handler];
          }
        }

        wasmMemory = msgData.wasmMemory;
        updateMemoryViews();

        wasmModule = msgData.wasmModule;
        createWasm();
        run();
        startWorker();
      } else if (cmd == 2) {
        assert(msgData.pthread_ptr);
        assert(wasmMemory, "CMD_RUN received before CMD_LOAD");
        // Call inside JS module to set up the stack frame for this pthread in JS module scope.
        // This needs to be the first thing that we do, as we cannot call to any C/C++ functions
        // until the thread stack is initialized.
        establishStackSpace(msgData.pthread_ptr);

        // Pass the thread address to wasm to store it for fast access.
        __emscripten_thread_init(msgData.pthread_ptr, /*is_main=*/0, /*is_runtime=*/0, /*can_block=*/1, 0, 0);

        PThread.threadInitTLS();

        // Await mailbox notifications with `Atomics.waitAsync` so we can start
        // using the fast `Atomics.notify` notification path.
        __emscripten_thread_mailbox_await(msgData.pthread_ptr);

        if (!initializedJS) {
          initializedJS = true;
        }

        try {
          invokeEntryPoint(msgData.start_routine, msgData.arg);
        } catch(ex) {
          if (ex != 'unwind') {
            // The pthread "crashed".  Do not call `_emscripten_thread_exit` (which
            // would make this thread joinable).  Instead, re-throw the exception
            // and let the top level handler propagate it back to the main thread.
            throw ex;
          }
        }
      } else if (cmd == 4) {
        if (initializedJS) {
          checkMailbox();
        }
      } else if (cmd) {
        // The received message looks like something that should be handled by this message
        // handler, (since there is a cmd field present), but is not one of the
        // recognized commands:
        err(`worker: received unknown command ${cmd}`);
        err(msgData);
      }
    } catch(ex) {
      err(`worker: onmessage() captured an uncaught exception: ${ex}`);
      if (ex?.stack) err(ex.stack);
      if (runtimeInitialized) __emscripten_thread_crashed();
      throw ex;
    }
  };

  self.onmessage = handleMessage;

} // ENVIRONMENT_IS_PTHREAD
// end include: runtime_pthread.js
// Memory management

var runtimeInitialized = false;



function updateMemoryViews() {
  // When memory growth is disabled this function should be called exactly once.
  assert(!HEAP8, 'updateMemoryViews should only be called once when ALLOW_MEMORY_GROWTH=0');
  var b = wasmMemory.buffer;
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  HEAP32 = new Int32Array(b);
  HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
  HEAP64 = new BigInt64Array(b);
  HEAPU64 = new BigUint64Array(b);
}

// In non-standalone/normal mode, we create the memory here.
// include: runtime_init_memory.js
// Create the wasm memory. (Note: this only applies if IMPORTED_MEMORY is defined)

// check for full engine support (use string 'subarray' to avoid closure compiler confusion)

function initMemory() {

  if ((ENVIRONMENT_IS_PTHREAD)) { return }

  {
    var INITIAL_MEMORY = 536870912;

    assert(INITIAL_MEMORY >= 65536, `INITIAL_MEMORY should be larger than STACK_SIZE, was ${INITIAL_MEMORY}! (STACK_SIZE=65536)`);
    /** @suppress {checkTypes} */
    wasmMemory = new WebAssembly.Memory({
      'initial': BigInt(INITIAL_MEMORY / 65536),
      'maximum': BigInt(INITIAL_MEMORY / 65536),
      'shared': true,
      'address': 'i64',
    });
  }

  updateMemoryViews();
}

// end include: runtime_init_memory.js

// include: memoryprofiler.js
// end include: memoryprofiler.js
// end include: runtime_common.js
assert(globalThis.Int32Array && globalThis.Float64Array && Int32Array.prototype.subarray && Int32Array.prototype.set,
       'JS engine does not provide full typed array support');

function preRun() {
  assert(!ENVIRONMENT_IS_PTHREAD); // PThreads reuse the runtime from the main thread.
  var preRun = Module['preRun'];
  if (preRun) {
    if (typeof preRun == 'function') preRun = [preRun];
    onPreRuns.push(...preRun);
  }
  consumedModuleProp('preRun');
  // Begin ATPRERUNS hooks
  callRuntimeCallbacks(onPreRuns);
  // End ATPRERUNS hooks
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  if (ENVIRONMENT_IS_PTHREAD) return;

  checkStackCookie();

  // Begin ATINITS hooks
  SOCKFS.root = FS.mount(SOCKFS, {}, null);
if (!Module['noFSInit'] && !FS.initialized) FS.init();
TTY.init();
PIPEFS.root = FS.mount(PIPEFS, {}, null);
  // End ATINITS hooks

  wasmExports['__wasm_call_ctors']();

  // Begin ATPOSTCTORS hooks
  FS.ignorePermissions = false;
  // End ATPOSTCTORS hooks

  checkStackCookie();
}

function postRun() {
  checkStackCookie();

  // No ATPOSTRUNS hooks
}

/**
 * @param {string|number=} what
 */
function abort(what) {
  Module['onAbort']?.(what);

  what = `Aborted(${what})`;
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;

  if (what.search(/RuntimeError: [Uu]nreachable/) >= 0) {
    what += '. "unreachable" may be due to ASYNCIFY_STACK_SIZE not being large enough (try increasing it)';
  }

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

function createExportWrapper(name, func, nargs) {
  assert(func);
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return func(...args);
  };
}

var wasmBinaryFile;

function findWasmBinary() {

  if (Module['locateFile']) {
    return locateFile('qemu-system-i386.wasm');
  }

  // Use bundler-friendly `new URL(..., import.meta.url)` pattern; works in browsers too.
  return new URL('qemu-system-i386.wasm', import.meta.url).href;

}

function getBinarySync(file) {
  if (readBinary) {
    return readBinary(file);
  }
  // Throwing a plain string here, even though it not normally advisable since
  // this gets turning into an `abort` in instantiateArrayBuffer.
  throw 'both async and sync fetching of the wasm failed';
}

async function getWasmBinary(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary) {
    // Fetch the binary using readAsync
    try {
      var response = await readAsync(binaryFile);
      return new Uint8Array(response);
    } catch {
      // Fall back to getBinarySync below;
    }
  }

  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);

    // Warn on some common problems.
    if (isFileURI(binaryFile)) {
      err(`warning: Loading from a file URI (${binaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary
     ) {
    try {
      var response = fetch(binaryFile, { credentials: 'same-origin' });
      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
      return instantiationResult;
    } catch (reason) {
      // We expect the most common failure cause to be a bad MIME type for the binary,
      // in which case falling back to ArrayBuffer instantiation should work.
      err(`wasm streaming compile failed: ${reason}`);
      err('falling back to ArrayBuffer instantiation');
      // fall back of instantiateArrayBuffer below
    };
  }
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {
  assignWasmImports();
  // instrumenting imports is used in asyncify in two ways: to add assertions
  // that check for proper import use, and for JSPI we use them to set up
  // the Promise API on the import side.
  // In pthreads builds getWasmImports is called more than once but we only
  // and the instrument the imports once.
  if (!wasmImports.__instrumented) {
    wasmImports.__instrumented = true;
    Asyncify.instrumentWasmImports(wasmImports);
  }
  // prepare imports
  var imports = {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  };
  return imports;
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;

    wasmExports = Asyncify.instrumentWasmExports(wasmExports);

    wasmExports = applySignatureConversions(wasmExports);

    registerTLSInit(wasmExports['_emscripten_tls_init']);

    assignWasmExports(wasmExports);

    // We now have the Wasm module loaded up, keep a reference to the compiled module so we can post it to the workers.
    wasmModule = module;
    return wasmExports;
  }

  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
    return receiveInstance(result['instance'], result['module']);
  }

  var info = getWasmImports();

  if ((ENVIRONMENT_IS_PTHREAD)) {
    // Instantiate from the module that was received via postMessage from
    // the main thread. We can just use sync instantiation in the worker.
    assert(wasmModule, "wasmModule should have been received via postMessage");
    var instance = new WebAssembly.Instance(wasmModule, getWasmImports());
    return receiveInstance(instance, wasmModule);
  }

  wasmBinaryFile ??= findWasmBinary();
  var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
  var exports = receiveInstantiationResult(result);
  return exports;
}

// end include: preamble.js

// Begin JS library code


  class ExitStatus {
      name = 'ExitStatus';
      constructor(status) {
        this.message = `Program terminated with exit(${status})`;
        this.status = status;
      }
    }

  /** @type {!Int32Array} */
  var HEAP32;

  /** @type {!Int8Array} */
  var HEAP8;

  /** @type {!Uint32Array} */
  var HEAPU32;

  
  var terminateWorker = (worker) => {
      worker.terminate();
      // terminate() can be asynchronous, so in theory the worker can continue
      // to run for some amount of time after termination.  However from our POV
      // the worker is now dead and we don't want to hear from it again, so we stub
      // out its message handler here.  This avoids having to check in each of
      // the onmessage handlers if the message was coming from a valid worker.
      worker.onmessage = (e) => {
        var cmd = e.data.cmd;
        err(`received "${cmd}" command from terminated worker: ${worker.workerID}`);
      };
    };
  
  var cleanupThread = (pthread_ptr) => {
      assert(!ENVIRONMENT_IS_PTHREAD, 'cleanupThread() should only be called from the main thread');
      assert(pthread_ptr, 'null pthread_ptr passed to cleanupThread');
      var worker = PThread.pthreads[pthread_ptr];
      assert(worker);
      PThread.returnWorkerToPool(worker);
    };
  
  var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    };
  var onPreRuns = [];
  var addOnPreRun = (cb) => onPreRuns.push(cb);
  
  var dependenciesPromise = null;
  var resolveRunDependencies = async () => dependenciesPromise;
  var runDependencies = 0;
  
  
  var dependenciesPromiseResolve = null;
  
  var runDependencyTracking = {
  };
  
  var runDependencyWatcher = null;
  var removeRunDependency = (id) => {
      runDependencies--;
  
      assert(id, 'removeRunDependency requires an ID');
      assert(runDependencyTracking[id]);
      delete runDependencyTracking[id];
      if (!runDependencies) {
        if (runDependencyWatcher !== null) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
        }
        dependenciesPromiseResolve();
      }
    };
  
  
  
  
  var addRunDependency = (id) => {
      if (!runDependencies) {
        dependenciesPromise = new Promise((resolve) => dependenciesPromiseResolve = resolve);
      }
      runDependencies++;
  
      assert(id, 'addRunDependency requires an ID')
      assert(!runDependencyTracking[id]);
      runDependencyTracking[id] = 1;
      if (!runDependencyWatcher && globalThis.setInterval) {
        // Check for missing dependencies every few seconds
        runDependencyWatcher = setInterval(() => {
          if (ABORT) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
            return;
          }
          var shown = false;
          for (var dep in runDependencyTracking) {
            if (!shown) {
              shown = true;
              err('still waiting on run dependencies:');
            }
            err(`dependency: ${dep}`);
          }
          if (shown) {
            err('(end of list)');
          }
        }, 10000);
      }
    };
  
  
  var spawnThread = (threadParams) => {
      assert(!ENVIRONMENT_IS_PTHREAD, 'spawnThread() should only be called from the main thread');
      assert(threadParams.pthread_ptr, 'spawnThread called with null pthread ptr');
  
      var worker = PThread.getNewWorker();
      if (!worker) {
        // No available workers in the PThread pool.
        return 6;
      }
      assert(!worker.pthread_ptr);
  
      // Add to pthreads map
      PThread.pthreads[threadParams.pthread_ptr] = worker;
  
      worker.pthread_ptr = threadParams.pthread_ptr;
      var msg = {
          cmd: 2,
          start_routine: threadParams.startRoutine,
          arg: threadParams.arg,
          pthread_ptr: threadParams.pthread_ptr,
      };
      // Ask the worker to start executing its pthread entry point function.
      worker.postMessage(msg, threadParams.transferList);
      return 0;
    };
  
  
  
  var runtimeKeepaliveCounter = 0;
  var keepRuntimeAlive = () => runtimeKeepaliveCounter > 0;
  
  var stackSave = () => _emscripten_stack_get_current();
  
  var stackRestore = (val) => __emscripten_stack_restore(val);
  
  var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
  
  
  
  /** @type {!Float64Array} */
  var HEAPF64;
  
  /** not-@type {!BigInt64Array} */
  var HEAP64;
  /** @type{function(number, (number|boolean), ...number)} */
  var proxyToMainThread = (funcIndex, emAsmAddr, proxyMode, ...callArgs) => {
      // EM_ASM proxying is done by passing a pointer to the address of the EM_ASM
      // content as `emAsmAddr`.  JS library proxying is done by passing an index
      // into `proxiedJSCallArgs` as `funcIndex`. If `emAsmAddr` is non-zero then
      // `funcIndex` will be ignored.
      // Additional arguments are passed after the first three are the actual
      // function arguments.
      // The serialization buffer contains the number of call params, and then
      // all the args here.
      //
      // We also pass 'proxyMode' to C separately, since C needs to look at it.
      //
      // Allocate a buffer (on the stack), which will be copied if necessary by
      // the C code.
      //
      // First passed parameter specifies the number of arguments to the function.
      // When BigInt support is enabled, we must handle types in a more complex
      // way, detecting at runtime if a value is a BigInt or not (as we have no
      // type info here). To do that, add a "prefix" before each value that
      // indicates if it is a BigInt, which effectively doubles the number of
      // values we serialize for proxying. TODO: pack this?
      var bufSize = 8 * callArgs.length * 2;
      var sp = stackSave();
      var args = stackAlloc(bufSize);
      var b = ((args)/8);
      for (var arg of callArgs) {
        if (typeof arg == 'bigint') {
          // The prefix is non-zero to indicate a bigint.
          HEAP64[b++] = 1n;
          HEAP64[b++] = arg;
        } else {
          // The prefix is zero to indicate a JS Number.
          HEAP64[b++] = 0n;
          HEAPF64[b++] = arg;
        }
      }
      var rtn = __emscripten_run_js_on_main_thread(funcIndex, emAsmAddr, bufSize, args, proxyMode);
      stackRestore(sp);
      return rtn;
    };
  
  function _proc_exit(code) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(0, 0, 1, code);
  
      EXITSTATUS = code;
      if (!keepRuntimeAlive()) {
        PThread.terminateAllThreads();
        Module['onExit']?.(code);
        ABORT = true;
      }
      quit_(code, new ExitStatus(code));
    
  }
  
  
  
  
  
  
  var runtimeKeepalivePop = () => {
      assert(runtimeKeepaliveCounter > 0);
      runtimeKeepaliveCounter -= 1;
    };
  
  function exitOnMainThread(returnCode) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(1, 0, 0, returnCode);
  
      runtimeKeepalivePop();;
      _exit(returnCode);
    
  }
  
  
  /** @param {boolean|number=} implicit */
  var exitJS = (status, implicit) => {
      EXITSTATUS = status;
  
      checkUnflushedContent();
  
      if (ENVIRONMENT_IS_PTHREAD) {
        // implicit exit can never happen on a pthread
        assert(!implicit);
        // When running in a pthread we propagate the exit back to the main thread
        // where it can decide if the whole process should be shut down or not.
        // The pthread may have decided not to exit its own runtime, for example
        // because it runs a main loop, but that doesn't affect the main thread.
        exitOnMainThread(status);
        throw 'unwind';
      }
  
      // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
      if (keepRuntimeAlive() && !implicit) {
        var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
        err(msg);
      }
  
      _proc_exit(status);
    };
  var _exit = exitJS;
  
  
  
  var waitAsyncPolyfilled = (!Atomics.waitAsync || (globalThis.navigator?.userAgent && Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)||[])[2]) < 91));;
  
  function ptrToString(ptr) {
      assert(typeof ptr === 'number', `ptrToString expects a number, got ${typeof ptr}`);
      // Convert to 64-bit unsigned value.  We need to use BigInt here since
      // Number cannot represent the full 64-bit range.
      if (ptr < 0) ptr = 2n**64n + BigInt(ptr);
      return '0x' + ptr.toString(16).padStart(16, '0');
    }
  
  
  var PThread = {
  unusedWorkers:[],
  tlsInitFunctions:[],
  pthreads:{
  },
  nextWorkerID:1,
  init() {
        if ((!(ENVIRONMENT_IS_PTHREAD))) {
          PThread.initMainThread();
        }
      },
  initMainThread() {
        var pthreadPoolSize = 1;
        // Start loading up the Worker pool, if requested.
        while (pthreadPoolSize--) {
          PThread.allocateUnusedWorker();
        }
        // MINIMAL_RUNTIME takes care of calling loadWasmModuleToAllWorkers
        // in postamble_minimal.js
        addOnPreRun(async () => {
          var pthreadPoolReady = PThread.loadWasmModuleToAllWorkers();
          addRunDependency('loading-workers');
          await pthreadPoolReady;
          removeRunDependency('loading-workers');
        });
      },
  terminateAllThreads:() => {
        assert(!ENVIRONMENT_IS_PTHREAD, 'terminateAllThreads() should only be called from the main thread');
        // Attempt to kill all workers.  Sadly (at least on the web) there is no
        // way to terminate a worker synchronously, or to be notified when a
        // worker is actually terminated.  This means there is some risk that
        // pthreads will continue to be executing after `worker.terminate` has
        // returned.  For this reason, we don't call `returnWorkerToPool` here or
        // free the underlying pthread data structures.
        for (var worker of Object.values(PThread.pthreads)) {
          terminateWorker(worker);
        }
        for (var worker of PThread.unusedWorkers) {
          terminateWorker(worker);
        }
        PThread.unusedWorkers = [];
        PThread.pthreads = {};
      },
  terminateRuntime:() => {
        assert(!ENVIRONMENT_IS_PTHREAD, 'terminateRuntime() should only be called from the main thread');
        PThread.terminateAllThreads();
        var pthread_ptr = _pthread_self();
        ___set_thread_state(0, 0, 0, 1);
        if (!waitAsyncPolyfilled) {
          // Break the waitAsync loop.  Note that checkMailbox will not
          // re-register since the `___set_thread_state` above causes _pthread_self
          // to return 0.
          Atomics.notify(HEAP32, ((pthread_ptr)/4));
        }
      },
  returnWorkerToPool:(worker) => {
        // We don't want to run main thread queued calls here, since we are doing
        // some operations that leave the worker queue in an invalid state until
        // we are completely done (it would be bad if free() ends up calling a
        // queued pthread_create which looks at the global data structures we are
        // modifying). To achieve that, defer the free() until the very end, when
        // we are all done.
        var pthread_ptr = worker.pthread_ptr;
        delete PThread.pthreads[pthread_ptr];
        // Note: worker is intentionally not terminated so the pool can
        // dynamically grow.
        PThread.unusedWorkers.push(worker);
        // Not a running Worker anymore
        // Detach the worker from the pthread object, and return it to the
        // worker pool as an unused worker.
        worker.pthread_ptr = 0;
  
        // Finally, free the underlying (and now-unused) pthread structure in
        // linear memory.
        __emscripten_thread_free_data(pthread_ptr);
      },
  threadInitTLS() {
        // Call thread init functions (these are the _emscripten_tls_init for each
        // module loaded.
        PThread.tlsInitFunctions.forEach((f) => f());
      },
  loadWasmModuleToWorker:(worker) => new Promise((onFinishedLoading) => {
        worker.onmessage = (e) => {
          var d = e.data;
          var cmd = d.cmd;
  
          // If this message is intended to a recipient that is not the main
          // thread, forward it to the target thread. This is currently only
          // used by `CMD_CHECK_MAILBOX`.
          if (d.targetThread && d.targetThread != _pthread_self()) {
            var targetWorker = PThread.pthreads[d.targetThread];
            if (!targetWorker) err(`worker sent message (${cmd}) to pthread (${d.targetThread}) that no longer exists`);
            targetWorker?.postMessage(d);
            return;
          }
  
          if (d === 'setimmediate' || d === '_si') {
            // Worker wants to postMessage() to itself to implement setImmediate()
            // emulation.
            worker.postMessage(d);
            return;
          }
  
          switch (cmd) {
            case 4:
              checkMailbox();
              break;
            case 5:
              spawnThread(d);
              break;
            case 6:
              // cleanupThread needs to be run via callUserCallback since it calls
              // back into user code to free thread data. Without this it's possible
              // the unwind or ExitStatus exception could escape here.
              callUserCallback(() => cleanupThread(d.thread));
              break;
            case 3:
              onFinishedLoading(worker);
              break;
            case 9:
              Module[d.handler](...d.args);
              break;
            default:
              // The received message looks like something that should be handled by this message
              // handler, (since there is a e.data.cmd field present), but is not one of the
              // recognized commands:
              if (cmd) err(`worker sent an unknown command ${cmd}`);
          }
        };
  
        worker.onerror = (e) => {
          var message = 'worker sent an error!';
          if (worker.pthread_ptr) {
            message = `Pthread ${ptrToString(worker.pthread_ptr)} sent an error!`;
          }
          err(`${message} ${e.filename}:${e.lineno}: ${e.message}`);
          throw e;
        };
  
        assert(wasmMemory instanceof WebAssembly.Memory, 'wasmMemory should have been loaded by now');
        assert(wasmModule instanceof WebAssembly.Module, 'wasmModule should have been loaded by now');
  
        // When running on a pthread, none of the incoming parameters on the module
        // object are present. Proxy known handlers back to the main thread if specified.
        var handlers = [];
        var knownHandlers = [
          'onExit',
          'onAbort',
          'print',
          'printErr',
        ];
        for (var handler of knownHandlers) {
          if (Module.propertyIsEnumerable(handler)) {
            handlers.push(handler);
          }
        }
  
        // Ask the new worker to load up the Emscripten-compiled page. This is a heavy operation.
        worker.postMessage({
          cmd: 1,
          handlers: handlers,
          wasmMemory,
          wasmModule,
          workerID: worker.workerID,
        });
      }),
  async loadWasmModuleToAllWorkers() {
        // Instantiation is synchronous in pthreads.
        if (
          ENVIRONMENT_IS_PTHREAD
        ) {
          return;
        }
  
        let pthreadPoolReady = Promise.all(PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker));
        return pthreadPoolReady;
      },
  allocateUnusedWorker() {
        var worker;
        // If we're using module output, use bundler-friendly pattern.
        // We need to generate the URL with import.meta.url as the base URL of the JS file
        // instead of just using new URL(import.meta.url) because bundlers only recognize
        // the first case in their bundling step. The latter ends up producing an invalid
        // URL to import from the server (e.g., for webpack the file:// path).
        // See https://github.com/webpack/webpack/issues/12638
        worker = new Worker(new URL('qemu-system-i386.js', import.meta.url), {
          'type': 'module',
          // This is the way that we signal to the Web Worker that it is hosting
          // a pthread.
          'name': 'em-pthread-' + PThread.nextWorkerID,
  });
        worker.workerID = PThread.nextWorkerID++;
        PThread.unusedWorkers.push(worker);
        return worker;
      },
  getNewWorker() {
        if (PThread.unusedWorkers.length == 0) {
  // PTHREAD_POOL_SIZE_STRICT should show a warning and, if set to level `2`, return from the function.
          var newWorker = PThread.allocateUnusedWorker();
          PThread.loadWasmModuleToWorker(newWorker);
        }
        return PThread.unusedWorkers.pop();
      },
  };



  var dynCalls = {
  };
  var dynCallLegacy = (sig, ptr, args) => {
      sig = sig.replace(/p/g, 'j')
      assert(sig in dynCalls, `bad function pointer type - sig is not in dynCalls: '${sig}'`);
      if (args?.length) {
        // j (64-bit integer) is fine, and is implemented as a BigInt. Without
        // legalization, the number of parameters should match (j is not expanded
        // into two i's).
        assert(args.length === sig.length - 1);
      } else {
        assert(sig.length == 1);
      }
      var f = dynCalls[sig];
      return f(ptr, ...args);
    };
  var dynCall = (sig, ptr, args = [], promising = false) => {
      assert(ptr, `null function pointer in dynCall`);
      assert(!promising, 'async dynCall is not supported in this mode')
      // With MEMORY64 we have an additional step to convert `p` arguments to
      // bigint. This is the runtime equivalent of the wrappers we create for wasm
      // exports in `emscripten.py:create_wasm64_wrappers`.
      for (var i = 1; i < sig.length; ++i) {
        if (sig[i] == 'p') args[i-1] = BigInt(args[i-1]);
      }
      var rtn = dynCallLegacy(sig, ptr, args);
  
      function convert(rtn) {
        return sig[0] == 'p' ? Number(rtn) : rtn;
      }
  
      return convert(rtn);
    };

  
  
  
  /** not-@type {!BigUint64Array} */
  var HEAPU64;
  function establishStackSpace(pthread_ptr) {
      var stackHigh = Number(HEAPU64[(((pthread_ptr)+(80))/8)]);
      var stackSize = Number(HEAPU64[(((pthread_ptr)+(88))/8)]);
      var stackLow = stackHigh - stackSize;
      assert(stackHigh != 0);
      assert(stackLow != 0);
      assert(stackHigh > stackLow, 'stackHigh must be higher then stackLow');
      // Set stack limits used by `emscripten/stack.h` function.  These limits are
      // cached in wasm-side globals to make checks as fast as possible.
      _emscripten_stack_set_limits(stackHigh, stackLow);
  
      // Call inside wasm module to set up the stack frame for this pthread in wasm module scope
      stackRestore(stackHigh);
  
      // Write the stack cookie last, after we have set up the proper bounds and
      // current position of the stack.
      writeStackCookie();
    }

  
  
  
  var invokeEntryPoint = (ptr, arg) => {
      // An old thread on this worker may have been canceled without returning the
      // `runtimeKeepaliveCounter` to zero. Reset it now so the new thread won't
      // be affected.
      runtimeKeepaliveCounter = 0;
  
      // pthread entry points are always of signature 'void *ThreadMain(void *arg)'
      // Native codebases sometimes spawn threads with other thread entry point
      // signatures, such as void ThreadMain(void *arg), void *ThreadMain(), or
      // void ThreadMain().  That is not acceptable per C/C++ specification, but
      // x86 compiler ABI extensions enable that to work. If you find the
      // following line to crash, either change the signature to "proper" void
      // *ThreadMain(void *arg) form, or try linking with the Emscripten linker
      // flag -sEMULATE_FUNCTION_POINTER_CASTS to add in emulation for this x86
      // ABI extension.
  
      var result = ((a1) => dynCall_jj(ptr, BigInt(a1)))(arg);
  
      checkStackCookie();
      function finish(result) {
        // In MINIMAL_RUNTIME the noExitRuntime concept does not apply to
        // pthreads. To exit a pthread with live runtime, use the function
        // emscripten_unwind_to_js_event_loop() in the pthread body.
        if (keepRuntimeAlive()) {
          EXITSTATUS = result;
          return;
        }
        __emscripten_thread_exit(result);
      }
      finish(result);
    };


  var registerTLSInit = (tlsInitFunc) => PThread.tlsInitFunctions.push(tlsInitFunc);

  var runtimeKeepalivePush = () => {
      runtimeKeepaliveCounter += 1;
    };



  var warnOnce = (text) => {
      warnOnce.shown ||= {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
    };

  var wasmMemory;

  var INT53_MAX = 9007199254740992;
  
  var INT53_MIN = -9007199254740992;
  var bigintToI53Checked = (num) => (num < INT53_MIN || num > INT53_MAX) ? NaN : Number(num);
  
  var UTF8Decoder = globalThis.TextDecoder && new TextDecoder();
  
  
    /**
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul
   * @return {number}
   */
  var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
      var maxIdx = idx + maxBytesToRead;
      if (ignoreNul) return maxIdx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.
      // As a tiny code save trick, compare idx against maxIdx using a negation,
      // so that maxBytesToRead=undefined/NaN means Infinity.
      while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
      return idx;
    };
  
  
    /**
   * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
   * array that contains uint8 values, returns a copy of that string as a
   * Javascript String object.
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number=} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
  
      var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
  
      // When using conditional TextDecoder, skip it for short strings as the overhead of the native call is not worth it.
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.buffer instanceof ArrayBuffer ? heapOrArray.subarray(idx, endPtr) : heapOrArray.slice(idx, endPtr));
      }
      var str = '';
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          if ((u0 & 0xF8) != 0xF0) warnOnce(`Invalid UTF-8 leading byte ${ptrToString(u0)} encountered when deserializing a UTF-8 string in wasm memory to a JS string!`);
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    };
  
  /** @type {!Uint8Array} */
  var HEAPU8;
  
    /**
   * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
   * emscripten HEAP, returns a copy of that string as a Javascript String object.
   *
   * @param {number} ptr
   * @param {number=} maxBytesToRead - An optional length that specifies the
   *   maximum number of bytes to read. You can omit this parameter to scan the
   *   string until the first 0 byte. If maxBytesToRead is passed, and the string
   *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
   *   string will cut short at that byte index.
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */
  var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => {
      assert(typeof ptr == 'number', `UTF8ToString expects a number (got ${typeof ptr})`);
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : '';
    };
  function ___assert_fail(condition, filename, line, func) {
    condition = bigintToI53Checked(condition);
    filename = bigintToI53Checked(filename);
    func = bigintToI53Checked(func);
  
  return abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [filename ? UTF8ToString(filename) : 'unknown filename', line, func ? UTF8ToString(func) : 'unknown function']);
  }

  var ___call_sighandler = function(fp, sig) {
    fp = bigintToI53Checked(fp);
  
  return ((a1) => dynCall_vi(fp, a1))(sig);
  };

  
  
  
  
  function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(2, 0, 1, pthread_ptr, attr, startRoutine, arg);
  return ___pthread_create_js(pthread_ptr, attr, startRoutine, arg)
  }
  
  
  var _emscripten_has_threading_support = () => !!globalThis.SharedArrayBuffer;
  
  
  function ___pthread_create_js(pthread_ptr, attr, startRoutine, arg) {
    pthread_ptr = bigintToI53Checked(pthread_ptr);
    attr = bigintToI53Checked(attr);
    startRoutine = bigintToI53Checked(startRoutine);
    arg = bigintToI53Checked(arg);
  
  
      if (!_emscripten_has_threading_support()) {
        dbg('pthread_create: environment does not support SharedArrayBuffer, pthreads are not available');
        return 6;
      }
  
      // List of JS objects that will transfer ownership to the Worker hosting the thread
      var transferList = [];
      var error = 0;
  
      // Synchronously proxy the thread creation to main thread if possible. If we
      // need to transfer ownership of objects, then proxy asynchronously via
      // postMessage.
      if (ENVIRONMENT_IS_PTHREAD && (!transferList.length || error)) {
        return pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg);
      }
  
      // If on the main thread, and accessing Canvas/OffscreenCanvas failed, abort
      // with the detected error.
      if (error) return error;
  
      var threadParams = {
        startRoutine,
        pthread_ptr,
        arg,
        transferList,
      };
  
      if (ENVIRONMENT_IS_PTHREAD) {
        // The prepopulated pool of web workers that can host pthreads is stored
        // in the main JS thread. Therefore if a pthread is attempting to spawn a
        // new thread, the thread creation must be deferred to the main JS thread.
        threadParams.cmd = 5;
        postMessage(threadParams, transferList);
        // When we defer thread creation this way, we have no way to detect thread
        // creation synchronously today, so we have to assume success and return 0.
        return 0;
      }
  
      // We are the main thread, so we have the pthread warmup pool in this
      // thread and can fire off JS thread creation directly ourselves.
      return spawnThread(threadParams);
    ;
  }

  var initRandomFill = () => {
  
      // like with most Web APIs, we can't use Web Crypto API directly on shared memory,
      // so we need to create an intermediate buffer and copy it to the destination
      return (view) => (view.set(crypto.getRandomValues(new Uint8Array(view.byteLength))), 0);
    };
  var randomFill = (view) => (randomFill = initRandomFill())(view);
  
  var PATH = {
  isAbs:(path) => path.charAt(0) === '/',
  splitPath:(filename) => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },
  normalizeArray:(parts, allowAboveRoot) => {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },
  normalize:(path) => {
        var isAbsolute = PATH.isAbs(path),
            trailingSlash = path.slice(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter((p) => !!p), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },
  dirname:(path) => {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.slice(0, -1);
        }
        return root + dir;
      },
  basename:(path) => path && path.match(/([^\/]+|\/)\/*$/)[1],
join:(...paths) => PATH.normalize(paths.join('/')),
join2:(l, r) => PATH.normalize(l + '/' + r),
};


var PATH_FS = {
resolve:(...args) => {
      var resolvedPath = '',
        resolvedAbsolute = false;
      for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
        var path = (i >= 0) ? args[i] : FS.cwd();
        // Skip empty and invalid entries
        if (typeof path != 'string') {
          throw new TypeError('Arguments to path.resolve must be strings');
        } else if (!path) {
          return ''; // an invalid portion invalidates the whole thing
        }
        resolvedPath = path + '/' + resolvedPath;
        resolvedAbsolute = PATH.isAbs(path);
      }
      // At this point the path should be resolved to a full absolute path, but
      // handle relative paths to be safe (might happen when process.cwd() fails)
      resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter((p) => !!p), !resolvedAbsolute).join('/');
      return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
    },
relative:(from, to) => {
      from = PATH_FS.resolve(from).slice(1);
      to = PATH_FS.resolve(to).slice(1);
      function trim(arr) {
        var start = 0;
        for (; start < arr.length; start++) {
          if (arr[start] !== '') break;
        }
        var end = arr.length - 1;
        for (; end >= 0; end--) {
          if (arr[end] !== '') break;
        }
        if (start > end) return [];
        return arr.slice(start, end - start + 1);
      }
      var fromParts = trim(from.split('/'));
      var toParts = trim(to.split('/'));
      var length = Math.min(fromParts.length, toParts.length);
      var samePartsLength = length;
      for (var i = 0; i < length; i++) {
        if (fromParts[i] !== toParts[i]) {
          samePartsLength = i;
          break;
        }
      }
      var outputParts = [];
      for (var i = samePartsLength; i < fromParts.length; i++) {
        outputParts.push('..');
      }
      outputParts = outputParts.concat(toParts.slice(samePartsLength));
      return outputParts.join('/');
    },
};



var FS_stdin_getChar_buffer = [];

var lengthBytesUTF8 = (str) => {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
      // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
      // unit, not a Unicode code point of the character! So decode
      // UTF16->UTF32->UTF8.
      // See http://unicode.org/faq/utf_bom.html#utf16-3
      var c = str.charCodeAt(i); // possibly a lead surrogate
      if (c <= 0x7F) {
        len++;
      } else if (c <= 0x7FF) {
        len += 2;
      } else if (c >= 0xD800 && c <= 0xDFFF) {
        len += 4; ++i;
      } else {
        len += 3;
      }
    }
    return len;
  };

var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
    assert(typeof str === 'string', `stringToUTF8Array expects a string (got ${typeof str})`);
    // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
    // undefined and false each don't write out any bytes.
    if (!(maxBytesToWrite > 0))
      return 0;

    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
    for (var i = 0; i < str.length; ++i) {
      // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
      // and https://www.ietf.org/rfc/rfc2279.txt
      // and https://tools.ietf.org/html/rfc3629
      var u = str.codePointAt(i);
      if (u <= 0x7F) {
        if (outIdx >= endIdx) break;
        heap[outIdx++] = u;
      } else if (u <= 0x7FF) {
        if (outIdx + 1 >= endIdx) break;
        heap[outIdx++] = 0xC0 | (u >> 6);
        heap[outIdx++] = 0x80 | (u & 63);
      } else if (u <= 0xFFFF) {
        if (outIdx + 2 >= endIdx) break;
        heap[outIdx++] = 0xE0 | (u >> 12);
        heap[outIdx++] = 0x80 | ((u >> 6) & 63);
        heap[outIdx++] = 0x80 | (u & 63);
      } else {
        if (outIdx + 3 >= endIdx) break;
        if (u > 0x10FFFF) warnOnce(`Invalid Unicode code point ${ptrToString(u)} encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).`);
        heap[outIdx++] = 0xF0 | (u >> 18);
        heap[outIdx++] = 0x80 | ((u >> 12) & 63);
        heap[outIdx++] = 0x80 | ((u >> 6) & 63);
        heap[outIdx++] = 0x80 | (u & 63);
        // Gotcha: if codePoint is over 0xFFFF, it is represented as a surrogate pair in UTF-16.
        // We need to manually skip over the second code unit for correct iteration.
        i++;
      }
    }
    // Null-terminate the pointer to the buffer.
    heap[outIdx] = 0;
    return outIdx - startIdx;
  };
/** @type {function(string, boolean=, number=)} */
  var intArrayFromString = (stringy, dontAddNull, length) => {
      var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
      var u8array = new Array(len);
      var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
      if (dontAddNull) u8array.length = numBytesWritten;
      return u8array;
    };
  var FS_stdin_getChar = () => {
      if (!FS_stdin_getChar_buffer.length) {
        var result = null;
        if (globalThis.window?.prompt) {
          // Browser.
          result = window.prompt('Input: ');  // returns null on cancel
          if (result !== null) {
            result += '\n';
          }
        } else
        {}
        if (!result) {
          return null;
        }
        FS_stdin_getChar_buffer = intArrayFromString(result, true);
      }
      return FS_stdin_getChar_buffer.shift();
    };
  var TTY = {
  ttys:[],
  init() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process.stdin.setEncoding('utf8');
        // }
      },
  shutdown() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process.stdin.pause();
        // }
      },
  register(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },
  stream_ops:{
  open(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },
  close(stream) {
          // flush any pending line data
          stream.tty.ops.fsync(stream.tty);
        },
  fsync(stream) {
          stream.tty.ops.fsync(stream.tty);
        },
  read(stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && !bytesRead) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.atime = Date.now();
          }
          return bytesRead;
        },
  write(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.mtime = stream.node.ctime = Date.now();
          }
          return i;
        },
  },
  default_tty_ops:{
  get_char(tty) {
          return FS_stdin_getChar();
        },
  put_char(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },
  fsync(tty) {
          if (tty.output?.length > 0) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        },
  ioctl_tcgets(tty) {
          // typical setting
          return {
            c_iflag: 25856,
            c_oflag: 5,
            c_cflag: 191,
            c_lflag: 35387,
            c_cc: [
              0x03, 0x1c, 0x7f, 0x15, 0x04, 0x00, 0x01, 0x00, 0x11, 0x13, 0x1a, 0x00,
              0x12, 0x0f, 0x17, 0x16, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
              0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            ]
          };
        },
  ioctl_tcsets(tty, optional_actions, data) {
          // currently just ignore
          return 0;
        },
  ioctl_tiocgwinsz(tty) {
          return [24, 80];
        },
  },
  default_tty1_ops:{
  put_char(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },
  fsync(tty) {
          if (tty.output?.length > 0) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        },
  },
  };
  
  
  var zeroMemory = (ptr, size) => HEAPU8.fill(0, ptr, ptr + size);
  
  var alignMemory = (size, alignment) => {
      assert(alignment, 'alignment argument is required');
      return Math.ceil(size / alignment) * alignment;
    };
  var mmapAlloc = (size) => {
      size = alignMemory(size, 65536);
      var ptr = _emscripten_builtin_memalign(65536, size);
      if (ptr) zeroMemory(ptr, size);
      return ptr;
    };
  
  var MEMFS = {
  ops_table:null,
  mount(mount) {
        return MEMFS.createNode(null, '/', 16895, 0);
      },
  createNode(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // not supported
          throw new FS.ErrnoError(63);
        }
        MEMFS.ops_table ||= {
          dir: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
              lookup: MEMFS.node_ops.lookup,
              mknod: MEMFS.node_ops.mknod,
              rename: MEMFS.node_ops.rename,
              unlink: MEMFS.node_ops.unlink,
              rmdir: MEMFS.node_ops.rmdir,
              readdir: MEMFS.node_ops.readdir,
              symlink: MEMFS.node_ops.symlink
            },
            stream: {
              llseek: MEMFS.stream_ops.llseek
            }
          },
          file: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr
            },
            stream: {
              llseek: MEMFS.stream_ops.llseek,
              read: MEMFS.stream_ops.read,
              write: MEMFS.stream_ops.write,
              mmap: MEMFS.stream_ops.mmap,
              msync: MEMFS.stream_ops.msync
            }
          },
          link: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
              readlink: MEMFS.node_ops.readlink
            },
            stream: {}
          },
          chrdev: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr
            },
            stream: FS.chrdev_stream_ops
          }
        };
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          // The actual number of bytes used in the typed array, as opposed to
          // contents.length which gives the whole capacity.
          node.usedBytes = 0;
          // The byte data of the file is stored in a typed array.
          // Note: typed arrays are not resizable like normal JS arrays are, so
          // there is a small penalty involved for appending file writes that
          // continuously grow a file similar to std::vector capacity vs used.
          node.contents = MEMFS.emptyFileContents ??= new Uint8Array(0);
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.atime = node.mtime = node.ctime = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
          parent.atime = parent.mtime = parent.ctime = node.atime;
        }
        return node;
      },
  getFileDataAsTypedArray(node) {
        assert(FS.isFile(node.mode), 'getFileDataAsTypedArray called on non-file');
        return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
      },
  expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents.length;
        if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very
        // small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for
        // large sizes, do a much more conservative size*1.125 increase to avoid
        // overshooting the allocation cap by a very large margin.
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) >>> 0);
        if (prevCapacity) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = MEMFS.getFileDataAsTypedArray(node);
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        node.contents.set(oldContents);
      },
  resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize) return;
        var oldContents = node.contents;
        node.contents = new Uint8Array(newSize); // Allocate new storage.
        node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
        node.usedBytes = newSize;
      },
  node_ops:{
  getattr(node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.atime);
          attr.mtime = new Date(node.mtime);
          attr.ctime = new Date(node.ctime);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },
  setattr(node, attr) {
          for (const key of ['mode', 'atime', 'mtime', 'ctime']) {
            if (attr[key] != null) {
              node[key] = attr[key];
            }
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },
  lookup(parent, name) {
          throw new FS.ErrnoError(44);
        },
  mknod(parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },
  rename(old_node, new_dir, new_name) {
          var new_node;
          try {
            new_node = FS.lookupNode(new_dir, new_name);
          } catch (e) {}
          if (new_node) {
            if (FS.isDir(old_node.mode)) {
              // if we're overwriting a directory at new_name, make sure it's empty.
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
            FS.hashRemoveNode(new_node);
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          new_dir.contents[new_name] = old_node;
          old_node.name = new_name;
          new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
        },
  unlink(parent, name) {
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        },
  rmdir(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        },
  readdir(node) {
          return ['.', '..', ...Object.keys(node.contents)];
        },
  symlink(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0o777 | 40960, 0);
          node.link = oldpath;
          return node;
        },
  readlink(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        },
  },
  stream_ops:{
  read(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          buffer.set(contents.subarray(position, position + size), offset);
          return size;
        },
  write(stream, buffer, offset, length, position, canOwn) {
          assert(buffer.subarray, 'FS.write expects a TypedArray');
  
          if (!length) return 0;
          var node = stream.node;
          node.mtime = node.ctime = Date.now();
  
          if (canOwn) {
            assert(!position, 'canOwn must imply no weird position inside the file');
            node.contents = buffer.subarray(offset, offset + length);
            node.usedBytes = length;
          } else if (!node.usedBytes && !position) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
            node.contents = buffer.slice(offset, offset + length);
            node.usedBytes = length;
          } else {
            MEMFS.expandFileStorage(node, position+length);
            // Use typed array write which is available.
            node.contents.set(buffer.subarray(offset, offset + length), position);
            node.usedBytes = Math.max(node.usedBytes, position + length);
          }
          return length;
        },
  llseek(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },
  mmap(stream, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
            // We can't emulate MAP_SHARED when the file is not backed by the
            // buffer we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            allocated = true;
            ptr = mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            if (contents) {
              // Try to avoid unnecessary slices.
              if (position > 0 || position + length < contents.length) {
                if (contents.subarray) {
                  contents = contents.subarray(position, position + length);
                } else {
                  contents = Array.prototype.slice.call(contents, position, position + length);
                }
              }
              HEAP8.set(contents, ptr);
            }
          }
          return { ptr, allocated };
        },
  msync(stream, buffer, offset, length, mmapFlags) {
          MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        },
  },
  };
  
  var FS_modeStringToFlags = (str) => {
      if (typeof str != 'string') return str;
      var flagModes = {
        'r': 0,
        'r+': 2,
        'w': 512 | 64 | 1,
        'w+': 512 | 64 | 2,
        'a': 1024 | 64 | 1,
        'a+': 1024 | 64 | 2,
      };
      var flags = flagModes[str];
      if (typeof flags == 'undefined') {
        throw new Error(`Unknown file open mode: ${str}`);
      }
      return flags;
    };
  
  var FS_fileDataToTypedArray = (data) => {
      if (typeof data == 'string') {
        data = intArrayFromString(data, true);
      }
      if (!data.subarray) {
        data = new Uint8Array(data);
      }
      return data;
    };
  
  var FS_getMode = (canRead, canWrite) => {
      var mode = 0;
      if (canRead) mode |= 292 | 73;
      if (canWrite) mode |= 146;
      return mode;
    };
  
  
  
  
  var strError = (errno) => UTF8ToString(_strerror(errno));
  
  var ERRNO_CODES = {
      'EPERM': 63,
      'ENOENT': 44,
      'ESRCH': 71,
      'EINTR': 27,
      'EIO': 29,
      'ENXIO': 60,
      'E2BIG': 1,
      'ENOEXEC': 45,
      'EBADF': 8,
      'ECHILD': 12,
      'EAGAIN': 6,
      'EWOULDBLOCK': 6,
      'ENOMEM': 48,
      'EACCES': 2,
      'EFAULT': 21,
      'ENOTBLK': 105,
      'EBUSY': 10,
      'EEXIST': 20,
      'EXDEV': 75,
      'ENODEV': 43,
      'ENOTDIR': 54,
      'EISDIR': 31,
      'EINVAL': 28,
      'ENFILE': 41,
      'EMFILE': 33,
      'ENOTTY': 59,
      'ETXTBSY': 74,
      'EFBIG': 22,
      'ENOSPC': 51,
      'ESPIPE': 70,
      'EROFS': 69,
      'EMLINK': 34,
      'EPIPE': 64,
      'EDOM': 18,
      'ERANGE': 68,
      'ENOMSG': 49,
      'EIDRM': 24,
      'ECHRNG': 106,
      'EL2NSYNC': 156,
      'EL3HLT': 107,
      'EL3RST': 108,
      'ELNRNG': 109,
      'EUNATCH': 110,
      'ENOCSI': 111,
      'EL2HLT': 112,
      'EDEADLK': 16,
      'ENOLCK': 46,
      'EBADE': 113,
      'EBADR': 114,
      'EXFULL': 115,
      'ENOANO': 104,
      'EBADRQC': 103,
      'EBADSLT': 102,
      'EDEADLOCK': 16,
      'EBFONT': 101,
      'ENOSTR': 100,
      'ENODATA': 116,
      'ETIME': 117,
      'ENOSR': 118,
      'ENONET': 119,
      'ENOPKG': 120,
      'EREMOTE': 121,
      'ENOLINK': 47,
      'EADV': 122,
      'ESRMNT': 123,
      'ECOMM': 124,
      'EPROTO': 65,
      'EMULTIHOP': 36,
      'EDOTDOT': 125,
      'EBADMSG': 9,
      'ENOTUNIQ': 126,
      'EBADFD': 127,
      'EREMCHG': 128,
      'ELIBACC': 129,
      'ELIBBAD': 130,
      'ELIBSCN': 131,
      'ELIBMAX': 132,
      'ELIBEXEC': 133,
      'ENOSYS': 52,
      'ENOTEMPTY': 55,
      'ENAMETOOLONG': 37,
      'ELOOP': 32,
      'EOPNOTSUPP': 138,
      'EPFNOSUPPORT': 139,
      'ECONNRESET': 15,
      'ENOBUFS': 42,
      'EAFNOSUPPORT': 5,
      'EPROTOTYPE': 67,
      'ENOTSOCK': 57,
      'ENOPROTOOPT': 50,
      'ESHUTDOWN': 140,
      'ECONNREFUSED': 14,
      'EADDRINUSE': 3,
      'ECONNABORTED': 13,
      'ENETUNREACH': 40,
      'ENETDOWN': 38,
      'ETIMEDOUT': 73,
      'EHOSTDOWN': 142,
      'EHOSTUNREACH': 23,
      'EINPROGRESS': 26,
      'EALREADY': 7,
      'EDESTADDRREQ': 17,
      'EMSGSIZE': 35,
      'EPROTONOSUPPORT': 66,
      'ESOCKTNOSUPPORT': 137,
      'EADDRNOTAVAIL': 4,
      'ENETRESET': 39,
      'EISCONN': 30,
      'ENOTCONN': 53,
      'ETOOMANYREFS': 141,
      'EUSERS': 136,
      'EDQUOT': 19,
      'ESTALE': 72,
      'ENOTSUP': 138,
      'ENOMEDIUM': 148,
      'EILSEQ': 25,
      'EOVERFLOW': 61,
      'ECANCELED': 11,
      'ENOTRECOVERABLE': 56,
      'EOWNERDEAD': 62,
      'ESTRPIPE': 135,
    };
  
  var asyncLoad = async (url) => {
      var arrayBuffer = await readAsync(url);
      assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
      return new Uint8Array(arrayBuffer);
    };
  
  
  var FS_createDataFile = (...args) => FS.createDataFile(...args);
  
  var getUniqueRunDependency = (id) => {
      var orig = id;
      while (1) {
        if (!runDependencyTracking[id]) return id;
        id = orig + Math.random();
      }
    };
  
  
  
  var preloadPlugins = [];
  var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
      // Ensure plugins are ready.
      if (typeof Browser != 'undefined') Browser.init();
  
      for (var plugin of preloadPlugins) {
        if (plugin['canHandle'](fullname)) {
          assert(plugin['handle'].constructor.name === 'AsyncFunction', 'Filesystem plugin handlers must be async functions (See #24914)')
          return plugin['handle'](byteArray, fullname);
        }
      }
      // If no plugin handled this file then return the original/unmodified
      // byteArray.
      return byteArray;
    };
  var FS_preloadFile = async (parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish) => {
      // TODO we should allow people to just pass in a complete filename instead
      // of parent and name being that we just join them anyways
      var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
      var dep = getUniqueRunDependency(`cp ${fullname}`); // might have several active requests for the same fullname
      addRunDependency(dep);
  
      try {
        var byteArray = url;
        if (typeof url == 'string') {
          byteArray = await asyncLoad(url);
        }
  
        byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
        preFinish?.();
        if (!dontCreateFile) {
          FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
        }
      } finally {
        removeRunDependency(dep);
      }
    };
  var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
      FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish).then(onload).catch(onerror);
    };
  
  var FS = {
  root:null,
  mounts:[],
  devices:{
  },
  streams:[],
  nextInode:1,
  nameTable:null,
  currentPath:"/",
  initialized:false,
  ignorePermissions:true,
  filesystems:null,
  syncFSRequests:0,
  ErrnoError:class extends Error {
        name = 'ErrnoError';
        // We set the `name` property to be able to identify `FS.ErrnoError`
        // - the `name` is a standard ECMA-262 property of error objects. Kind of good to have it anyway.
        // - when using PROXYFS, an error can come from an underlying FS
        // as different FS objects have their own FS.ErrnoError each,
        // the test `err instanceof FS.ErrnoError` won't detect an error coming from another filesystem, causing bugs.
        // we'll use the reliable test `err.name == "ErrnoError"` instead
        constructor(errno) {
          super(runtimeInitialized ? strError(errno) : '');
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
        }
      },
  FSStream:class {
        shared = {};
        get object() {
          return this.node;
        }
        set object(val) {
          this.node = val;
        }
        get isRead() {
          return (this.flags & 2097155) !== 1;
        }
        get isWrite() {
          return (this.flags & 2097155) !== 0;
        }
        get isAppend() {
          return (this.flags & 1024);
        }
        get flags() {
          return this.shared.flags;
        }
        set flags(val) {
          this.shared.flags = val;
        }
        get position() {
          return this.shared.position;
        }
        set position(val) {
          this.shared.position = val;
        }
      },
  FSNode:class {
        node_ops = {};
        stream_ops = {};
        readMode = 292 | 73;
        writeMode = 146;
        mounted = null;
        constructor(parent, name, mode, rdev) {
          if (!parent) {
            parent = this;  // root node sets parent to itself
          }
          this.parent = parent;
          this.mount = parent.mount;
          this.id = FS.nextInode++;
          this.name = name;
          this.mode = mode;
          this.rdev = rdev;
          this.atime = this.mtime = this.ctime = Date.now();
        }
        get read() {
          return (this.mode & this.readMode) === this.readMode;
        }
        set read(val) {
          val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
        }
        get write() {
          return (this.mode & this.writeMode) === this.writeMode;
        }
        set write(val) {
          val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
        }
        get isFolder() {
          return FS.isDir(this.mode);
        }
        get isDevice() {
          return FS.isChrdev(this.mode);
        }
        // The per-inode readiness wait-queue. The node carries a Set of listener
        // entries {cb}; producers (SOCKFS, PIPEFS) call notifyListeners on a
        // readiness transition, and poll()/epoll consume it. It lives on the node
        // (not the fd) so dup'd fds share one queue. Only nodes that derive real
        // readiness (sockets, pipes, and an epoll's own node) ever use this -
        // always-ready types (regular files, ttys) never register or notify.
        addListener(cb, exclusive = false) {
          var entry = {cb, exclusive};
          var listeners = (this.listeners ??= new Set());
          listeners.add(entry);
          return {listeners, entry};
        }
        notifyListeners(flags) {
          // Iterates the set without copying, which is safe ONLY under a
          // load-bearing contract that every internal listener must honour:
          //   1. A listener must not run user code synchronously (a poll waiter only
          //      resolves a Promise; an epoll registration only re-lists +
          //      re-notifies; the epoll callback only schedules a tick). User code
          //      runs on a later tick, never inside this loop.
          //   2. A listener may delete entries only from ITS OWN waiter, never from
          //      a sibling node's set that may be mid-iteration. (Deleting an entry
          //      of the set being iterated here is fine - a Set tolerates removal of
          //      a not-yet-visited entry mid-iteration; mutating a *different* node's
          //      set is fine because that set is not being iterated.)
          // Violating either gives silently skipped wakeups that are near-impossible
          // to reproduce. Any new producer/listener must preserve it.
          if (!this.listeners) return;
          // Fire every non-exclusive listener. Among EPOLLEXCLUSIVE registrations
          // (one fd watched by several epolls) wake only one, rotating round-robin
          // per node, to avoid a thundering herd. (Only epoll registrations are ever
          // exclusive; poll waiters and a node's own consumers are not.)
          var excl;
          for (var entry of this.listeners) {
            if (entry.exclusive) (excl ||= []).push(entry);
            else entry.cb(flags);
          }
          if (excl) {
            var i = (this.exclTurn || 0) % excl.length;
            this.exclTurn = i + 1;
            excl[i].cb(flags);
          }
        }
      },
  lookupPath(path, opts = {}) {
        if (!path) {
          throw new FS.ErrnoError(44);
        }
        opts.follow_mount ??= true
  
        if (!PATH.isAbs(path)) {
          path = FS.cwd() + '/' + path;
        }
  
        // limit max consecutive symlinks to SYMLOOP_MAX.
        linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
          // split the absolute path
          var parts = path.split('/').filter((p) => !!p);
  
          // start at the root
          var current = FS.root;
          var current_path = '/';
  
          for (var i = 0; i < parts.length; i++) {
            var islast = (i === parts.length-1);
            if (islast && opts.parent) {
              // stop resolving
              break;
            }
  
            if (parts[i] === '.') {
              continue;
            }
  
            if (parts[i] === '..') {
              current_path = PATH.dirname(current_path);
              if (FS.isRoot(current)) {
                path = current_path + '/' + parts.slice(i + 1).join('/');
                // We're making progress here, don't let many consecutive ..'s
                // lead to ELOOP
                nlinks--;
                continue linkloop;
              } else {
                current = current.parent;
              }
              continue;
            }
  
            current_path = PATH.join2(current_path, parts[i]);
            try {
              current = FS.lookupNode(current, parts[i]);
            } catch (e) {
              // if noent_okay is true, suppress a ENOENT in the last component
              // and return an object with an undefined node. This is needed for
              // resolving symlinks in the path when creating a file.
              if ((e?.errno === 44) && islast && opts.noent_okay) {
                return { path: current_path };
              }
              throw e;
            }
  
            // jump to the mount's root node if this is a mountpoint
            if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
              current = current.mounted.root;
            }
  
            // by default, lookupPath will not follow a symlink if it is the final path component.
            // setting opts.follow = true will override this behavior.
            if (FS.isLink(current.mode) && (!islast || opts.follow)) {
              if (!current.node_ops.readlink) {
                throw new FS.ErrnoError(52);
              }
              var link = current.node_ops.readlink(current);
              if (!PATH.isAbs(link)) {
                link = PATH.dirname(current_path) + '/' + link;
              }
              path = link + '/' + parts.slice(i + 1).join('/');
              continue linkloop;
            }
          }
          return { path: current_path, node: current };
        }
        throw new FS.ErrnoError(32);
      },
  getPath(node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? `${mount}/${path}` : mount + path;
          }
          path = path ? `${node.name}/${path}` : node.name;
          node = node.parent;
        }
      },
  hashName(parentid, name) {
        var hash = 0;
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },
  hashAddNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },
  hashRemoveNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },
  lookupNode(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },
  createNode(parent, name, mode, rdev) {
        assert(typeof parent == 'object')
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },
  destroyNode(node) {
        FS.hashRemoveNode(node);
      },
  isRoot(node) {
        return node === node.parent;
      },
  isMountpoint(node) {
        return !!node.mounted;
      },
  isFile(mode) {
        return (mode & 61440) === 32768;
      },
  isDir(mode) {
        return (mode & 61440) === 16384;
      },
  isLink(mode) {
        return (mode & 61440) === 40960;
      },
  isChrdev(mode) {
        return (mode & 61440) === 8192;
      },
  isBlkdev(mode) {
        return (mode & 61440) === 24576;
      },
  isFIFO(mode) {
        return (mode & 61440) === 4096;
      },
  isSocket(mode) {
        return (mode & 49152) === 49152;
      },
  flagsToPermissionString(flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },
  nodePermissions(node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.includes('r') && !(node.mode & 292)) {
          return 2;
        }
        if (perms.includes('w') && !(node.mode & 146)) {
          return 2;
        }
        if (perms.includes('x') && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },
  mayLookup(dir) {
        if (!FS.isDir(dir.mode)) return 54;
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },
  mayCreate(dir, name) {
        if (!FS.isDir(dir.mode)) {
          return 54;
        }
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },
  mayDelete(dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else if (FS.isDir(node.mode)) {
          return 31;
        }
        return 0;
      },
  mayOpen(node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        }
        var mode = FS.flagsToPermissionString(flags);
        if (FS.isDir(node.mode)) {
          // opening for write
          // TODO: check for O_SEARCH? (== search for dir only)
          if (mode !== 'r' || (flags & (512 | 64))) {
            return 31;
          }
        }
        return FS.nodePermissions(node, mode);
      },
  checkOpExists(op, err) {
        if (!op) {
          throw new FS.ErrnoError(err);
        }
        return op;
      },
  MAX_OPEN_FDS:4096,
  nextfd() {
        for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },
  getStreamChecked(fd) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        return stream;
      },
  getStream:(fd) => FS.streams[fd],
  createStream(stream, fd = -1) {
        assert(fd >= -1);
  
        // clone it, so we can return an instance of FSStream
        stream = Object.assign(new FS.FSStream(), stream);
        if (fd == -1) {
          fd = FS.nextfd();
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },
  closeStream(fd) {
        FS.streams[fd] = null;
      },
  dupStream(origStream, fd = -1) {
        var stream = FS.createStream(origStream, fd);
        stream.stream_ops?.dup?.(stream);
        return stream;
      },
  doSetAttr(stream, node, attr) {
        var setattr = stream?.stream_ops.setattr;
        var arg = setattr ? stream : node;
        setattr ??= node.node_ops.setattr;
        FS.checkOpExists(setattr, 63)
        try {
          setattr(arg, attr);
        } catch (e) {
          if (e instanceof RangeError) {
            throw new FS.ErrnoError(22);
          }
          throw e;
        }
      },
  chrdev_stream_ops:{
  open(stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          stream.stream_ops.open?.(stream);
        },
  llseek() {
          throw new FS.ErrnoError(70);
        },
  },
  major:(dev) => ((dev) >> 8),
  minor:(dev) => ((dev) & 0xff),
  makedev:(ma, mi) => ((ma) << 8 | (mi)),
  registerDevice(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },
  getDevice:(dev) => FS.devices[dev],
  getMounts(mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push(...m.mounts);
        }
  
        return mounts;
      },
  syncfs(populate, callback) {
        if (typeof populate == 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(errCode) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          return callback(errCode);
        }
  
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        for (var mount of mounts) {
          if (mount.type.syncfs) {
            mount.type.syncfs(mount, populate, done);
          } else {
            done(null);
          }
        }
      },
  mount(type, opts, mountpoint) {
        if (typeof type == 'string') {
          // The filesystem was not included, and instead we have an error
          // message stored in the variable.
          throw type;
        }
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
  
        var mount = {
          type,
          opts,
          mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },
  unmount(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        for (var [hash, current] of Object.entries(FS.nameTable)) {
          while (current) {
            var next = current.name_next;
  
            if (mounts.includes(current.mount)) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        }
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },
  lookup(parent, name) {
        return parent.node_ops.lookup(parent, name);
      },
  mknod(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name) {
          throw new FS.ErrnoError(28);
        }
        if (name === '.' || name === '..') {
          throw new FS.ErrnoError(20);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },
  statfs(path) {
        return FS.statfsNode(FS.lookupPath(path, {follow: true}).node);
      },
  statfsStream(stream) {
        // We keep a separate statfsStream function because noderawfs overrides
        // it. In noderawfs, stream.node is sometimes null. Instead, we need to
        // look at stream.path.
        return FS.statfsNode(stream.node);
      },
  statfsNode(node) {
        // NOTE: None of the defaults here are true. We're just returning safe and
        //       sane values. Currently nodefs and rawfs replace these defaults,
        //       other file systems leave them alone.
        var rtn = {
          bsize: 4096,
          frsize: 4096,
          blocks: 1e6,
          bfree: 5e5,
          bavail: 5e5,
          files: FS.nextInode,
          ffree: FS.nextInode - 1,
          fsid: 42,
          flags: 2,
          namelen: 255,
        };
  
        if (node.node_ops.statfs) {
          Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
        }
        return rtn;
      },
  create(path, mode = 0o666) {
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },
  mkdir(path, mode = 0o777) {
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },
  mkdirTree(path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var dir of dirs) {
          if (!dir) continue;
          if (d || PATH.isAbs(path)) d += '/';
          d += dir;
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != 20) throw e;
          }
        }
      },
  mkdev(path, mode, dev) {
        if (typeof dev == 'undefined') {
          dev = mode;
          mode = 0o666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },
  symlink(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },
  link(oldpath, newpath, flags) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // Hardlinks are only supported by filesystem backends that provide a
        // `link` node op (e.g. NODERAWFS backed by the host). NODEFS omits it:
        // a host hardlink cannot be confined to the mount root.
        if (!parent.node_ops.link) {
          throw new FS.ErrnoError(34);
        }
        return parent.node_ops.link(parent, newname, oldpath, flags);
      },
  rename(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
  
        // let the errors from non existent directories percolate up
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
  
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(28);
        }
        // new path should not be an ancestor of the old path
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(55);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        errCode = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(10);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, 'w');
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
          // update old node (we do this here to avoid each backend
          // needing to)
          old_node.parent = new_dir;
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },
  rmdir(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },
  readdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
        return readdir(node);
      },
  unlink(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },
  readlink(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return link.node_ops.readlink(link);
      },
  stat(path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
        return getattr(node);
      },
  fstat(fd) {
        var stream = FS.getStreamChecked(fd);
        var node = stream.node;
        var getattr = stream.stream_ops.getattr;
        var arg = getattr ? stream : node;
        getattr ??= node.node_ops.getattr;
        FS.checkOpExists(getattr, 63)
        return getattr(arg);
      },
  lstat(path) {
        return FS.stat(path, true);
      },
  doChmod(stream, node, mode, dontFollow) {
        FS.doSetAttr(stream, node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          ctime: Date.now(),
          dontFollow
        });
      },
  chmod(path, mode, dontFollow) {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doChmod(null, node, mode, dontFollow);
      },
  lchmod(path, mode) {
        FS.chmod(path, mode, true);
      },
  fchmod(fd, mode) {
        var stream = FS.getStreamChecked(fd);
        FS.doChmod(stream, stream.node, mode, false);
      },
  doChown(stream, node, dontFollow) {
        FS.doSetAttr(stream, node, {
          timestamp: Date.now(),
          dontFollow
          // we ignore the uid / gid for now
        });
      },
  chown(path, uid, gid, dontFollow) {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doChown(null, node, dontFollow);
      },
  lchown(path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },
  fchown(fd, uid, gid) {
        var stream = FS.getStreamChecked(fd);
        FS.doChown(stream, stream.node, false);
      },
  doTruncate(stream, node, len) {
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.doSetAttr(stream, node, {
          size: len,
          timestamp: Date.now()
        });
      },
  truncate(path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doTruncate(null, node, len);
      },
  ftruncate(fd, len) {
        var stream = FS.getStreamChecked(fd);
        if (len < 0 || (stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.doTruncate(stream, stream.node, len);
      },
  utime(path, atime, mtime, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        FS.doSetAttr(null, lookup.node, {
          atime: atime,
          mtime: mtime,
          dontFollow
        });
      },
  open(path, flags, mode = 0o666) {
        if (path === '') {
          throw new FS.ErrnoError(44);
        }
        flags = FS_modeStringToFlags(flags);
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        var isDirPath;
        if (typeof path == 'object') {
          node = path;
        } else {
          isDirPath = path.endsWith('/');
          // noent_okay makes it so that if the final component of the path
          // doesn't exist, lookupPath returns `node: undefined`. `path` will be
          // updated to point to the target of all symlinks.
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 131072),
            noent_okay: true
          });
          node = lookup.node;
          path = lookup.path;
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(20);
            }
          } else if (isDirPath) {
            throw new FS.ErrnoError(31);
          } else {
            // node doesn't exist, try to create it
            // Ignore the permission bits here to ensure we can `open` this new
            // file below. We use chmod below to apply the permissions once the
            // file is open.
            node = FS.mknod(path, mode | 0o777, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // do truncation if necessary
        if ((flags & 512) && !created) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512 | 131072);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        });
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (created) {
          FS.chmod(node, mode & 0o777);
        }
        return stream;
      },
  close(stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        // The fd is going away: wake anything waiting on it (poll/epoll) with
        // POLLNVAL so a blocking wait unblocks and an epoll registration is evicted
        // on its next derive. Only sockets/pipes/epoll ever carry a wait-queue, so
        // for every other stream (incl. nodeless noderawfs stdio) this is a no-op.
        stream.node?.notifyListeners(32);
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },
  isClosed(stream) {
        return stream.fd === null;
      },
  llseek(stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },
  read(stream, buffer, offset, length, position) {
        assert(offset >= 0);
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },
  write(stream, buffer, offset, length, position, canOwn) {
        assert(offset >= 0);
        assert(buffer.subarray, 'FS.write expects a TypedArray');
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },
  mmap(stream, length, position, prot, flags) {
        // User requests writing to file (prot & PROT_WRITE != 0).
        // Checking if we have permissions to write to the file unless
        // MAP_PRIVATE flag is set. According to POSIX spec it is possible
        // to write to file opened in read-only mode with MAP_PRIVATE flag,
        // as all modifications will be visible only in the memory of
        // the current process.
        if ((prot & 2)
            && !(flags & 2)
            && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        if (!length) {
          throw new FS.ErrnoError(28);
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags);
      },
  msync(stream, buffer, offset, length, mmapFlags) {
        assert(offset >= 0);
        if (!stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },
  ioctl(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },
  readFile(path, opts = {}) {
        opts.flags = opts.flags ?? 0;
        opts.encoding = opts.encoding ?? 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          abort(`Invalid encoding type "${opts.encoding}"`);
        }
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          buf = UTF8ArrayToString(buf);
        }
        FS.close(stream);
        return buf;
      },
  writeFile(path, data, opts = {}) {
        opts.flags = opts.flags ?? 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        data = FS_fileDataToTypedArray(data);
        FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        FS.close(stream);
      },
  cwd:() => FS.currentPath,
  chdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },
  createDefaultDirectories() {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },
  createDefaultDevices() {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: () => 0,
          write: (stream, buffer, offset, length, pos) => length,
          llseek: () => 0,
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using err() rather than out()
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        // use a buffer to avoid overhead of individual crypto calls per byte
        var randomBuffer = new Uint8Array(1024), randomLeft = 0;
        var randomByte = () => {
          if (!randomLeft) {
            randomFill(randomBuffer);
            randomLeft = randomBuffer.byteLength;
          }
          return randomBuffer[--randomLeft];
        };
        FS.createDevice('/dev', 'random', randomByte);
        FS.createDevice('/dev', 'urandom', randomByte);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },
  createSpecialDirectories() {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the
        // name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        var proc_self = FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount() {
            var node = FS.createNode(proc_self, 'fd', 16895, 73);
            node.stream_ops = {
              llseek: MEMFS.stream_ops.llseek,
            };
            node.node_ops = {
              lookup(parent, name) {
                var fd = +name;
                var stream = FS.getStreamChecked(fd);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: () => stream.path },
                  id: fd + 1,
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              },
              readdir() {
                return Array.from(FS.streams.entries())
                  .filter(([k, v]) => v)
                  .map(([k, v]) => k.toString());
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },
  createStandardStreams(input, output, error) {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (input) {
          FS.createDevice('/dev', 'stdin', input);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (output) {
          FS.createDevice('/dev', 'stdout', null, output);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (error) {
          FS.createDevice('/dev', 'stderr', null, error);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 0);
        var stdout = FS.open('/dev/stdout', 1);
        var stderr = FS.open('/dev/stderr', 1);
        assert(stdin.fd === 0, `invalid handle for stdin (${stdin.fd})`);
        assert(stdout.fd === 1, `invalid handle for stdout (${stdout.fd})`);
        assert(stderr.fd === 2, `invalid handle for stderr (${stderr.fd})`);
      },
  staticInit() {
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
        };
      },
  init(input, output, error) {
        assert(!FS.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.initialized = true;
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
  
        FS.createStandardStreams(input, output, error);
      },
  quit() {
        FS.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        _fflush(0);
        // close all of our streams
        for (var stream of FS.streams) {
          if (stream) {
            FS.close(stream);
          }
        }
      },
  findObject(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (!ret.exists) {
          return null;
        }
        return ret.object;
      },
  analyzePath(path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },
  createPath(parent, path, canRead, canWrite) {
        parent = typeof parent == 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            if (e.errno != 20) throw e;
          }
          parent = current;
        }
        return current;
      },
  createFile(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode);
      },
  createDataFile(parent, name, data, canRead, canWrite, canOwn) {
        var path = name;
        if (parent) {
          parent = typeof parent == 'string' ? parent : FS.getPath(parent);
          path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          data = FS_fileDataToTypedArray(data);
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 577);
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
      },
  createDevice(parent, name, input, output) {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(!!input, !!output);
        FS.createDevice.major ??= 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open(stream) {
            stream.seekable = false;
          },
          close(stream) {
            // flush any pending line data
            if (output?.buffer?.length) {
              output(10);
            }
          },
          read(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && !bytesRead) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.atime = Date.now();
            }
            return bytesRead;
          },
          write(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.mtime = stream.node.ctime = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },
  forceLoadFile(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (globalThis.XMLHttpRequest) {
          abort('Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.');
        } else { // Command-line.
          try {
            obj.contents = readBinary(obj.url);
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
      },
  createLazyFile(parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array).
        // Actual getting is abstracted away for eventual reuse.
        class LazyUint8Array {
          lengthKnown = false;
          chunks = []; // Loaded chunks. Index is the chunk number
          get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = (idx / this.chunkSize)|0;
            return this.getter(chunkNum)[chunkOffset];
          }
          setDataGetter(getter) {
            this.getter = getter;
          }
          cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort(`Couldn't load ${url}. Status: ${xhr.status}`);
            var datalength = Number(xhr.getResponseHeader('Content-length'));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader('Accept-Ranges')) && header === 'bytes';
            var usesGzip = (header = xhr.getResponseHeader('Content-Encoding')) && header === 'gzip';
  
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (from, to) => {
              if (from > to) abort(`invalid range (${from}, ${to}) or no bytes requested!`);
              if (to > datalength-1) abort(`only ${datalength} bytes available! programmer error!`);
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader('Range', `bytes=${from}-${to}`);
  
              // Some hints to the browser that we want binary data.
              xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort(`Couldn't load ${url}. Status: ${xhr.status}`);
              if (xhr.response !== undefined) {
                return new Uint8Array(/** @type{Array<number>} */(xhr.response || []));
              }
              return intArrayFromString(xhr.responseText ?? '', true);
            };
            var lazyArray = this;
            lazyArray.setDataGetter((chunkNum) => {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof lazyArray.chunks[chunkNum] == 'undefined') {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof lazyArray.chunks[chunkNum] == 'undefined') abort('doXHR failed!');
              return lazyArray.chunks[chunkNum];
            });
  
            if (usesGzip || !datalength) {
              // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
              chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
              datalength = this.getter(0).length;
              chunkSize = datalength;
              out('LazyFiles on gzip forces download of the whole file when length is accessed');
            }
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
          }
          get length() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._length;
          }
          get chunkSize() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._chunkSize;
          }
        }
  
        if (globalThis.XMLHttpRequest) {
          if (!ENVIRONMENT_IS_WORKER) abort('Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc');
          var lazyArray = new LazyUint8Array();
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        for (const [key, fn] of Object.entries(node.stream_ops)) {
          stream_ops[key] = (...args) => {
            FS.forceLoadFile(node);
            return fn(...args);
          };
        }
        function writeChunks(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        }
        // use a custom read function
        stream_ops.read = (stream, buffer, offset, length, position) => {
          FS.forceLoadFile(node);
          return writeChunks(stream, buffer, offset, length, position)
        };
        // use a custom mmap function
        stream_ops.mmap = (stream, length, position, prot, flags) => {
          FS.forceLoadFile(node);
          var ptr = mmapAlloc(length);
          if (!ptr) {
            throw new FS.ErrnoError(48);
          }
          writeChunks(stream, HEAP8, ptr, length, position);
          return { ptr, allocated: true };
        };
        node.stream_ops = stream_ops;
        return node;
      },
  };
  
  var SOCKFS = {
  callbacks:{
  },
  on(event, callback) {
        SOCKFS.callbacks[event] = callback;
      },
  emit(event, param) {
        SOCKFS.callbacks[event]?.(param);
        // Bridge socket readiness into the inode wait-queue (poll/epoll). The
        // 'error' event carries [fd, ...]; the rest carry the fd directly.
        var fd = event === 'error' ? param[0] : param;
        var flags = {
          'message':    64 | 1,
          'open':       4,
          'connection': 64 | 1,
          'close':      1 | 16,
          'error':      8,
        }[event];
        // 'listen' has no readiness mapping; skip it.
        if (flags) FS.getStream(fd)?.node.notifyListeners(flags);
      },
  mount(mount) {
  
        return FS.createNode(null, '/', 16895, 0);
      },
  createSocket(family, type, protocol) {
        if (family != 2
           ) {
          throw new FS.ErrnoError(5);
        }
        type &= ~526336; // Some applications may pass it; it makes no sense for a single process.
        // Emscripten only supports SOCK_STREAM and SOCK_DGRAM
        if (type != 1 && type != 2) {
          throw new FS.ErrnoError(28);
        }
        var streaming = type == 1;
        // The IPPROTO_TCP protocol guard only applies to INET stream sockets; unix
        // stream sockets use protocol 0.
        if (streaming && protocol && protocol != 6
           ) {
          throw new FS.ErrnoError(66); // if SOCK_STREAM, must be tcp or 0.
        }
  
        // create our internal socket structure
        var sock = {
          family,
          type,
          protocol,
          server: null,
          error: null, // Used in getsockopt for SOL_SOCKET/SO_ERROR test
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node,
          flags: 2,
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },
  getSocket(fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },
  stream_ops:{
  getattr(stream) {
          var node = stream.node;
          return {
            dev: 1,
            ino: node.id,
            mode: 49152 | 0o777,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: 0,
            size: 0,
            atime: new Date(0),
            mtime: new Date(0),
            ctime: new Date(0),
            blksize: 4096,
            blocks: 0,
          };
        },
  poll(stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },
  ioctl(stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },
  read(stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },
  write(stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },
  close(stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        },
  },
  nextname() {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return `socket[${SOCKFS.nextname.current++}]`;
      },
  websocket_sock_ops:{
  createPeer(sock, addr, port) {
          var ws;
  
          if (typeof addr == 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              // The default value is 'ws://' the replace is needed because the compiler replaces '//' comments with '#'
              // comments without checking context, so we'd end up with ws:#, the replace swaps the '#' for '//' again.
              var url = 'ws://'.replace('#', '//');
              // Make the WebSocket subprotocol (Sec-WebSocket-Protocol) default to binary if no configuration is set.
              var subProtocols = 'binary'; // The default value is 'binary'
              // The default WebSocket options
              var opts = undefined;
  
              if (url === 'ws://' || url === 'wss://') { // Is the supplied URL config just a prefix, if so complete it.
                var parts = addr.split('/');
                url = url + parts[0] + ':' + port + '/' + parts.slice(1).join('/');
              }
  
              if (subProtocols !== 'null') {
                // The regex trims the string (removes spaces at the beginning and end), then splits the string by
                // <any space>,<any space> into an Array. Whitespace removal is important for Websockify and ws.
                subProtocols = subProtocols.replace(/^ +| +$/g,'').split(/ *, */);
  
                opts = subProtocols;
              }
  
              // If node we use the ws library.
              var WebSocketConstructor;
              {
                WebSocketConstructor = WebSocket;
              }
              ws = new WebSocketConstructor(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(23);
            }
          }
  
          var peer = {
            addr,
            port,
            socket: ws,
            msg_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport != 'undefined') {
            peer.msg_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },
  getPeer(sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },
  addPeer(sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },
  removePeer(sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },
  handlePeerEvents(sock, peer) {
          var first = true;
  
          function handleOpen() {
  
            sock.connecting = false;
            SOCKFS.emit('open', sock.stream.fd);
  
            try {
              var queued = peer.msg_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.msg_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          }
  
          function handleMessage(data) {
            if (typeof data == 'string') {
              var encoder = new TextEncoder(); // should be utf-8
              data = encoder.encode(data); // make a typed array from the string
            } else {
              assert(data.byteLength !== undefined); // must receive an ArrayBuffer
              if (data.byteLength == 0) {
                // An empty ArrayBuffer will emit a pseudo disconnect event
                // as recv/recvmsg will return zero which indicates that a socket
                // has performed a shutdown although the connection has not been disconnected yet.
                return;
              }
              data = new Uint8Array(data); // make a typed array view on the array buffer
            }
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and its key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
            SOCKFS.emit('message', sock.stream.fd);
          }
  
          peer.socket.onopen = handleOpen;
          peer.socket.onclose = () => SOCKFS.emit('close', sock.stream.fd);
          peer.socket.onmessage = (event) => handleMessage(event.data);
          peer.socket.onerror = (error) => {
            // The WebSocket spec only allows a 'simple event' to be thrown on error,
            // so we only really know as much as ECONNREFUSED.
            sock.error = 14; // Used in getsockopt for SOL_SOCKET/SO_ERROR test.
            SOCKFS.emit('error', [sock.stream.fd, sock.error, 'ECONNREFUSED: Connection refused']);
          };
        },
  poll(sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            // When an non-blocking connect fails mark the socket as writable.
            // Its up to the calling code to then use getsockopt with SO_ERROR to
            // retrieve the error.
            // See https://man7.org/linux/man-pages/man2/connect.2.html
            if (sock.connecting) {
              mask |= 4;
            } else  {
              // A closed peer is both a full hangup and a read-side hangup.
              mask |= 16 | 8192;
            }
          }
  
          return mask;
        },
  ioctl(sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)/4)] = bytes;
              return 0;
            case 21537:
              var on = HEAP32[((arg)/4)];
              if (on) {
                sock.stream.flags |= 2048;
              } else {
                sock.stream.flags &= ~2048;
              }
              return 0;
            default:
              return 28;
          }
        },
  close(sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          for (var peer of Object.values(sock.peers)) {
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },
  bind(sock, addr, port) {
          if (typeof sock.saddr != 'undefined' || typeof sock.sport != 'undefined') {
            throw new FS.ErrnoError(28);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port;
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e.name === 'ErrnoError')) throw e;
              if (e.errno !== 138) throw e;
            }
          }
        },
  connect(sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(138);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr != 'undefined' && typeof sock.dport != 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(7);
              } else {
                throw new FS.ErrnoError(30);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // because we cannot synchronously block to wait for the WebSocket
          // connection to complete, we return here pretending that the connection
          // was a success.
          sock.connecting = true;
        },
  listen(sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(138);
          }
        },
  accept(listensock) {
          if (!listensock.server || !listensock.pending.length) {
            throw new FS.ErrnoError(28);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },
  getname(sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(53);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr, port };
        },
  sendmsg(sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(17);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(53);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          if (ArrayBuffer.isView(buffer)) {
            offset += buffer.byteOffset;
            buffer = buffer.buffer;
          }
  
          var data = buffer.slice(offset, offset + length);
          // WebSockets .send() does not allow passing a SharedArrayBuffer, so
          // clone the SharedArrayBuffer as regular ArrayBuffer before
          // sending.
          if (data instanceof SharedArrayBuffer) {
            data = new Uint8Array(new Uint8Array(data)).buffer;
          }
  
          // if we don't have a cached connectionless UDP datagram connection, or
          // the TCP socket is still connecting, queue the message to be sent upon
          // connect, and lie, saying the data was sent now.
          if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
            // if we're not connected, open a new connection
            if (sock.type === 2) {
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
            }
            dest.msg_send_queue.push(data);
            return length;
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(28);
          }
        },
  recvmsg(sock, length, flags) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(53);
          }
  
          // MSG_PEEK returns the head of the queue without consuming it, so a
          // later recv sees the same bytes and poll still reports it readable.
          var peek = flags & 2;
          var queued = sock.recv_queue[0];
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(53);
              }
              if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              // else, our socket is in a valid state but truly has nothing available
              throw new FS.ErrnoError(6);
            }
            throw new FS.ErrnoError(6);
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
          if (peek) return res;
          sock.recv_queue.shift();
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        },
  },
  };
  
  var getSocketFromFD = (fd) => {
      var socket = SOCKFS.getSocket(fd);
      if (!socket) throw new FS.ErrnoError(8);
      return socket;
    };
  
  var inetPton4 = (str) => {
      var b = str.split('.');
      for (var i = 0; i < 4; i++) {
        var tmp = Number(b[i]);
        if (isNaN(tmp)) return null;
        b[i] = tmp;
      }
      return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
    };
  
  var inetPton6 = (str) => {
      var words;
      var w, offset, z, i;
      /* http://home.deds.nl/~aeron/regex/ */
      var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i
      var parts = [];
      if (!valid6regx.test(str)) {
        return null;
      }
      if (str === '::') {
        return [0, 0, 0, 0, 0, 0, 0, 0];
      }
      // Z placeholder to keep track of zeros when splitting the string on ':'
      if (str.startsWith('::')) {
        str = str.replace('::', 'Z:'); // leading zeros case
      } else {
        str = str.replace('::', ':Z:');
      }
  
      if (str.indexOf('.') > 0) {
        // parse IPv4 embedded address
        str = str.replace(new RegExp('[.]', 'g'), ':');
        words = str.split(':');
        words[words.length-4] = Number(words[words.length-4]) + Number(words[words.length-3])*256;
        words[words.length-3] = Number(words[words.length-2]) + Number(words[words.length-1])*256;
        words = words.slice(0, words.length-2);
      } else {
        words = str.split(':');
      }
  
      offset = 0; z = 0;
      for (w=0; w < words.length; w++) {
        if (typeof words[w] == 'string') {
          if (words[w] === 'Z') {
            // compressed zeros - write appropriate number of zero words
            for (z = 0; z < (8 - words.length+1); z++) {
              parts[w+z] = 0;
            }
            offset = z-1;
          } else {
            // parse hex field to 16-bit value and write it in network byte-order
            parts[w+offset] = _htons(parseInt(words[w],16));
          }
        } else {
          // parsed IPv4 words
          parts[w+offset] = words[w];
        }
      }
      return [
        (parts[1] << 16) | parts[0],
        (parts[3] << 16) | parts[2],
        (parts[5] << 16) | parts[4],
        (parts[7] << 16) | parts[6]
      ];
    };
  
  
  
  var DNS = {
  address_map:{
  id:1,
  addrs:{
  },
  names:{
  },
  },
  lookup_name(name) {
        // If the name is already a valid ipv4 / ipv6 address, don't generate a fake one.
        var res = inetPton4(name);
        if (res !== null) {
          return name;
        }
        res = inetPton6(name);
        if (res !== null) {
          return name;
        }
  
        // See if this name is already mapped.
        var addr;
  
        if (DNS.address_map.addrs[name]) {
          addr = DNS.address_map.addrs[name];
        } else {
          var id = DNS.address_map.id++;
          assert(id < 65535, 'exceeded max address mappings of 65535');
  
          addr = '172.29.' + (id & 0xff) + '.' + (id & 0xff00);
  
          DNS.address_map.names[addr] = name;
          DNS.address_map.addrs[name] = addr;
        }
  
        return addr;
      },
  lookup_addr(addr) {
        if (DNS.address_map.names[addr]) {
          return DNS.address_map.names[addr];
        }
  
        return null;
      },
  };
  
  
  /** @type {!Int16Array} */
  var HEAP16;
  
  /** @param {number=} addrlen */
  var writeSockaddr = (sa, family, addr, port, addrlen) => {
      switch (family) {
        case 2:
          // The address may still be an unresolved hostname (e.g. a peer name
          // recorded at connect time); map it to its (possibly fake) IP here so
          // callers can pass names and IPs alike.
          addr = inetPton4(DNS.lookup_name(addr));
          zeroMemory(sa, 16);
          if (addrlen) {
            HEAP32[((addrlen)/4)] = 16;
          }
          HEAP16[((sa)/2)] = family;
          HEAP32[(((sa)+(4))/4)] = addr;
          HEAP16[(((sa)+(2))/2)] = _htons(port);
          break;
        case 10:
          addr = inetPton6(DNS.lookup_name(addr));
          zeroMemory(sa, 28);
          if (addrlen) {
            HEAP32[((addrlen)/4)] = 28;
          }
          HEAP32[((sa)/4)] = family;
          HEAP32[(((sa)+(8))/4)] = addr[0];
          HEAP32[(((sa)+(12))/4)] = addr[1];
          HEAP32[(((sa)+(16))/4)] = addr[2];
          HEAP32[(((sa)+(20))/4)] = addr[3];
          HEAP16[(((sa)+(2))/2)] = _htons(port);
          break;
        default:
          return 5;
      }
      return 0;
    };
  
  
  
  function ___syscall_accept4(fd, addr, len, flags, u1, u2) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(3, 0, 1, fd, addr, len, flags, u1, u2);
  
    addr = bigintToI53Checked(addr);
    len = bigintToI53Checked(len);
  
  
  try {
  
      var sock = getSocketFromFD(fd);
      var newsock = sock.sock_ops.accept(sock);
      if (addr) {
        var errno = writeSockaddr(addr, newsock.family, newsock.daddr, newsock.dport, len);
        assert(!errno);
      }
      return newsock.stream.fd;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  var inetNtop4 = (addr) =>
      (addr & 0xff) + '.' + ((addr >> 8) & 0xff) + '.' + ((addr >> 16) & 0xff) + '.' + ((addr >> 24) & 0xff);
  
  
  var inetNtop6 = (ints) => {
      //  ref:  http://www.ietf.org/rfc/rfc2373.txt - section 2.5.4
      //  Format for IPv4 compatible and mapped  128-bit IPv6 Addresses
      //  128-bits are split into eight 16-bit words
      //  stored in network byte order (big-endian)
      //  |                80 bits               | 16 |      32 bits        |
      //  +-----------------------------------------------------------------+
      //  |               10 bytes               |  2 |      4 bytes        |
      //  +--------------------------------------+--------------------------+
      //  +               5 words                |  1 |      2 words        |
      //  +--------------------------------------+--------------------------+
      //  |0000..............................0000|0000|    IPv4 ADDRESS     | (compatible)
      //  +--------------------------------------+----+---------------------+
      //  |0000..............................0000|FFFF|    IPv4 ADDRESS     | (mapped)
      //  +--------------------------------------+----+---------------------+
      var str = '';
      var word = 0;
      var longest = 0;
      var lastzero = 0;
      var zstart = 0;
      var len = 0;
      var i = 0;
      var parts = [
        ints[0] & 0xffff,
        (ints[0] >> 16),
        ints[1] & 0xffff,
        (ints[1] >> 16),
        ints[2] & 0xffff,
        (ints[2] >> 16),
        ints[3] & 0xffff,
        (ints[3] >> 16)
      ];
  
      // Handle IPv4-compatible, IPv4-mapped, loopback and any/unspecified addresses
  
      var hasipv4 = true;
      var v4part = '';
      // check if the 10 high-order bytes are all zeros (first 5 words)
      for (i = 0; i < 5; i++) {
        if (parts[i]) {
          hasipv4 = false;
          break;
        }
      }
  
      if (hasipv4) {
        // low-order 32-bits store an IPv4 address (bytes 13 to 16) (last 2 words)
        v4part = inetNtop4(parts[6] | (parts[7] << 16));
        // IPv4-mapped IPv6 address if 16-bit value (bytes 11 and 12) == 0xFFFF (6th word)
        if (parts[5] === -1) {
          str = '::ffff:';
          str += v4part;
          return str;
        }
        // IPv4-compatible IPv6 address if 16-bit value (bytes 11 and 12) == 0x0000 (6th word)
        if (!parts[5]) {
          str = '::';
          // special case IPv6 addresses
          if (v4part === '0.0.0.0') v4part = ''; // any/unspecified address
          if (v4part === '0.0.0.1') v4part = '1';// loopback address
          str += v4part;
          return str;
        }
      }
  
      // Handle all other IPv6 addresses
  
      // first run to find the longest contiguous zero words
      for (word = 0; word < 8; word++) {
        if (!parts[word]) {
          if (word - lastzero > 1) {
            len = 0;
          }
          lastzero = word;
          len++;
        }
        if (len > longest) {
          longest = len;
          zstart = word - longest + 1;
        }
      }
  
      for (word = 0; word < 8; word++) {
        if (longest > 1) {
          // compress contiguous zeros - to produce '::'
          if (!parts[word] && word >= zstart && word < (zstart + longest) ) {
            if (word === zstart) {
              str += ':';
              if (!zstart) str += ':'; //leading zeros case
            }
            continue;
          }
        }
        // converts 16-bit words from big-endian to little-endian before converting to hex string
        str += Number(_ntohs(parts[word] & 0xffff)).toString(16);
        str += word < 7 ? ':' : '';
      }
      return str;
    };
  
  
  
  /** @type {!Uint16Array} */
  var HEAPU16;
  
  var readSockaddr = (sa, salen) => {
      // family / port offsets are common to both sockaddr_in and sockaddr_in6
      var family = HEAP16[((sa)/2)];
      var port = _ntohs(HEAPU16[(((sa)+(2))/2)]);
      var addr;
  
      switch (family) {
        case 2:
          if (salen !== 16) {
            return { errno: 28 };
          }
          addr = HEAP32[(((sa)+(4))/4)];
          addr = inetNtop4(addr);
          break;
        case 10:
          if (salen !== 28) {
            return { errno: 28 };
          }
          addr = [
            HEAP32[(((sa)+(8))/4)],
            HEAP32[(((sa)+(12))/4)],
            HEAP32[(((sa)+(16))/4)],
            HEAP32[(((sa)+(20))/4)]
          ];
          addr = inetNtop6(addr);
          break;
        default:
          return { errno: 5 };
      }
  
      return { family: family, addr: addr, port: port };
    };
  
  
  var getSocketAddress = (addrp, addrlen) => {
      var info = readSockaddr(addrp, addrlen);
      if (info.errno) throw new FS.ErrnoError(info.errno);
      info.addr = DNS.lookup_addr(info.addr) || info.addr;
      return info;
    };
  
  
  
  function ___syscall_bind(fd, addr, len, u1, u2, u3) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(4, 0, 1, fd, addr, len, u1, u2, u3);
  
    addr = bigintToI53Checked(addr);
  
  
  try {
  
      var sock = getSocketFromFD(fd);
      var info = getSocketAddress(addr, len);
      sock.sock_ops.bind(sock, info.addr, info.port);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  
  
  
  
  var SYSCALLS = {
  currentUmask:18,
  calculateAt(dirfd, path, allowEmpty) {
        if (PATH.isAbs(path)) {
          return path;
        }
        // relative path
        var dir;
        if (dirfd === -100) {
          dir = FS.cwd();
        } else {
          var dirstream = SYSCALLS.getStreamFromFD(dirfd);
          dir = dirstream.path;
        }
        if (path.length == 0) {
          if (!allowEmpty) {
            throw new FS.ErrnoError(44);;
          }
          return dir;
        }
        return dir + '/' + path;
      },
  writeStat(buf, stat) {
        HEAPU32[((buf)/4)] = stat.dev;
        HEAPU32[(((buf)+(4))/4)] = stat.mode;
        HEAPU64[(((buf)+(8))/8)] = BigInt(stat.nlink);
        HEAPU32[(((buf)+(16))/4)] = stat.uid;
        HEAPU32[(((buf)+(20))/4)] = stat.gid;
        HEAPU32[(((buf)+(24))/4)] = stat.rdev;
        HEAP64[(((buf)+(32))/8)] = BigInt(stat.size);
        HEAP32[(((buf)+(40))/4)] = 4096;
        HEAP32[(((buf)+(44))/4)] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        HEAP64[(((buf)+(48))/8)] = BigInt(Math.floor(atime / 1000));
        HEAPU64[(((buf)+(56))/8)] = BigInt((atime % 1000) * 1000 * 1000);
        HEAP64[(((buf)+(64))/8)] = BigInt(Math.floor(mtime / 1000));
        HEAPU64[(((buf)+(72))/8)] = BigInt((mtime % 1000) * 1000 * 1000);
        HEAP64[(((buf)+(80))/8)] = BigInt(Math.floor(ctime / 1000));
        HEAPU64[(((buf)+(88))/8)] = BigInt((ctime % 1000) * 1000 * 1000);
        HEAP64[(((buf)+(96))/8)] = BigInt(stat.ino);
        return 0;
      },
  writeStatFs(buf, stats) {
        HEAPU32[(((buf)+(8))/4)] = stats.bsize;
        HEAPU32[(((buf)+(72))/4)] = stats.bsize;
        HEAP64[(((buf)+(16))/8)] = BigInt(stats.blocks);
        HEAP64[(((buf)+(24))/8)] = BigInt(stats.bfree);
        HEAP64[(((buf)+(32))/8)] = BigInt(stats.bavail);
        HEAP64[(((buf)+(40))/8)] = BigInt(stats.files);
        HEAP64[(((buf)+(48))/8)] = BigInt(stats.ffree);
        HEAPU32[(((buf)+(56))/4)] = stats.fsid;
        HEAPU32[(((buf)+(80))/4)] = stats.flags;  // ST_NOSUID
        HEAPU32[(((buf)+(64))/4)] = stats.namelen;
      },
  doMsync(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (flags & 2) {
          // MAP_PRIVATE calls need not to be synced back to underlying fs
          return 0;
        }
        var buffer = HEAPU8.subarray(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      },
  getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream;
      },
  varargs:undefined,
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
  };
  
  
  
  function ___syscall_chdir(path) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(5, 0, 1, path);
  
    path = bigintToI53Checked(path);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      FS.chdir(path);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  
  function ___syscall_connect(fd, addr, len, u1, u2, u3) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(6, 0, 1, fd, addr, len, u1, u2, u3);
  
    addr = bigintToI53Checked(addr);
  
  
  try {
  
      var sock = getSocketFromFD(fd);
      var info = getSocketAddress(addr, len);
      sock.sock_ops.connect(sock, info.addr, info.port);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  function ___syscall_dup(fd) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(7, 0, 1, fd);
  
  try {
  
      var old = SYSCALLS.getStreamFromFD(fd);
      return FS.dupStream(old).fd;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  
  }
  

  
  
  function ___syscall_dup3(fd, newfd, flags) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(8, 0, 1, fd, newfd, flags);
  
  try {
  
      if (fd === newfd) return -28;
      if (flags & ~524288) return -28;
      var old = SYSCALLS.getStreamFromFD(fd);
      // Check newfd is within range of valid open file descriptors.
      if (newfd < 0 || newfd >= FS.MAX_OPEN_FDS) return -8;
      var existing = FS.getStream(newfd);
      if (existing) FS.close(existing);
      var stream = FS.dupStream(old, newfd);
      if (flags & 524288) {
        stream.flags |= 524288;
      }
      return stream.fd;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  
  }
  

  
  
  
  function ___syscall_faccessat(dirfd, path, amode, flags) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(9, 0, 1, dirfd, path, amode, flags);
  
    path = bigintToI53Checked(path);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      assert(!flags || flags == 512);
      path = SYSCALLS.calculateAt(dirfd, path);
      if (amode & ~7) {
        // need a valid mode
        return -28;
      }
      var lookup = FS.lookupPath(path, { follow: true });
      var node = lookup.node;
      if (!node) {
        return -44;
      }
      var perms = '';
      if (amode & 4) perms += 'r';
      if (amode & 2) perms += 'w';
      if (amode & 1) perms += 'x';
      if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
        return -2;
      }
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  function ___syscall_fallocate(fd, mode, offset, len) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(10, 0, 1, fd, mode, offset, len);
  
    offset = bigintToI53Checked(offset);
    len = bigintToI53Checked(len);
  
  
  try {
  
      if (isNaN(offset) || isNaN(len)) return -22;
      if (mode != 0) {
        return -138
      }
      if (offset < 0 || len < 0) {
        return -28
      }
      // fallocate is only meaningful on regular files; a pipe/socket is a seek
      // error (ESPIPE), matching Linux.
      if (!SYSCALLS.getStreamFromFD(fd).seekable) {
        return -70;
      }
      // We only support mode == 0, which means we can implement fallocate
      // in terms of ftruncate.
      var oldSize = FS.fstat(fd).size;
      var newSize = offset + len;
      if (newSize > oldSize) {
        FS.ftruncate(fd, newSize);
      }
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  var syscallGetVarargP = () => {
      assert(SYSCALLS.varargs != undefined);
      var ret = Number(HEAPU64[((SYSCALLS.varargs)/8)]);
      SYSCALLS.varargs += 8;
      return ret;
    };
  
  var syscallGetVarargI = () => {
      assert(SYSCALLS.varargs != undefined);
      // the `+` prepended here is necessary to convince the JSCompiler that varargs is indeed a number.
      var ret = HEAP32[((+SYSCALLS.varargs)/4)];
      SYSCALLS.varargs += 4;
      return ret;
    };
  
  
  
  
  
  function ___syscall_fcntl64(fd, cmd, varargs) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(11, 0, 1, fd, cmd, varargs);
  
    varargs = bigintToI53Checked(varargs);
  
  
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (cmd) {
        case 0: {
          var arg = syscallGetVarargI();
          if (arg < 0) {
            return -28;
          }
          while (FS.streams[arg]) {
            arg++;
          }
          var newStream;
          newStream = FS.dupStream(stream, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4: {
          var arg = syscallGetVarargI();
          var mask = 289792;
          stream.flags = (stream.flags & ~mask) | (arg & mask);
          return 0;
        }
        case 5: {
          var arg = syscallGetVarargP();
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))/2)] = 2;
          return 0;
        }
        case 6:
        case 7:
          // Pretend that the locking is successful. These are process-level locks,
          // and Emscripten programs are a single process. If we supported linking a
          // filesystem between programs, we'd need to do more here.
          // See https://github.com/emscripten-core/emscripten/issues/23697
          return 0;
      }
      return -28;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  function ___syscall_fstat64(fd, buf) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(12, 0, 1, fd, buf);
  
    buf = bigintToI53Checked(buf);
  
  
  try {
  
      return SYSCALLS.writeStat(buf, FS.fstat(fd));
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  function ___syscall_ftruncate64(fd, length) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(13, 0, 1, fd, length);
  
    length = bigintToI53Checked(length);
  
  
  try {
  
      if (isNaN(length)) return -22;
      FS.ftruncate(fd, length);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF8 requires a third parameter that specifies the length of the output buffer');
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    };
  
  
  
  function ___syscall_getcwd(buf, size) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(14, 0, 1, buf, size);
  
    buf = bigintToI53Checked(buf);
    size = bigintToI53Checked(size);
  
  
  try {
  
      if (!size) return -28;
      var cwd = FS.cwd();
      var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
      if (size < cwdLengthInBytes) return -68;
      stringToUTF8(cwd, buf, size);
      return cwdLengthInBytes;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  
  
  
  
  function ___syscall_getdents64(fd, dirp, count) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(15, 0, 1, fd, dirp, count);
  
    dirp = bigintToI53Checked(dirp);
    count = bigintToI53Checked(count);
  
  
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd)
      stream.getdents ||= FS.readdir(stream.path);
  
      var struct_size = 280;
      var pos = 0;
      var off = FS.llseek(stream, 0, 1);
  
      var startIdx = Math.floor(off / struct_size);
      var endIdx = Math.min(stream.getdents.length, startIdx + Math.floor(count/struct_size))
      for (var idx = startIdx; idx < endIdx; idx++) {
        var id;
        var type;
        var name = stream.getdents[idx];
        if (name === '.') {
          id = stream.node.id;
          type = 4;
        }
        else if (name === '..') {
          var lookup = FS.lookupPath(stream.path, { parent: true });
          id = lookup.node.id;
          type = 4;
        }
        else {
          var child;
          try {
            child = FS.lookupNode(stream.node, name);
          } catch (e) {
            // If the entry is not a directory, file, or symlink, nodefs
            // lookupNode will raise EINVAL. Skip these and continue.
            if (e?.errno === 28) {
              continue;
            }
            throw e;
          }
          id = child.id;
          type = FS.isChrdev(child.mode) ? 2 : // character device.
                 FS.isDir(child.mode) ? 4 :    // directory
                 FS.isLink(child.mode) ? 10 :   // symbolic link.
                 8;                            // regular file.
        }
        assert(id);
        HEAP64[((dirp + pos)/8)] = BigInt(id);
        HEAP64[(((dirp + pos)+(8))/8)] = BigInt((idx + 1) * struct_size);
        HEAP16[(((dirp + pos)+(16))/2)] = 280;
        HEAP8[(dirp + pos)+(18)] = type;
        stringToUTF8(name, dirp + pos + 19, 256);
        pos += struct_size;
      }
      FS.llseek(stream, idx * struct_size, 0);
      return pos;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  
  function ___syscall_getpeername(fd, addr, len, u1, u2, u3) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(16, 0, 1, fd, addr, len, u1, u2, u3);
  
    addr = bigintToI53Checked(addr);
    len = bigintToI53Checked(len);
  
  
  try {
  
      var sock = getSocketFromFD(fd);
      if (!sock.daddr) {
        return -53; // The socket is not connected.
      }
      var errno = writeSockaddr(addr, sock.family, sock.daddr, sock.dport, len);
      assert(!errno);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  
  function ___syscall_getsockname(fd, addr, len, u1, u2, u3) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(17, 0, 1, fd, addr, len, u1, u2, u3);
  
    addr = bigintToI53Checked(addr);
    len = bigintToI53Checked(len);
  
  
  try {
  
      var sock = getSocketFromFD(fd);
      var defaultAddr = '0.0.0.0';
      // TODO: sock.saddr should never be undefined, see TODO in websocket_sock_ops.getname
      var errno = writeSockaddr(addr, sock.family, sock.saddr || defaultAddr, sock.sport, len);
      assert(!errno);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  
  function ___syscall_getsockopt(fd, level, optname, optval, optlen, unused) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(18, 0, 1, fd, level, optname, optval, optlen, unused);
  
    optval = bigintToI53Checked(optval);
    optlen = bigintToI53Checked(optlen);
  
  
  try {
  
      var sock = getSocketFromFD(fd);
      // Minimal getsockopt aimed at resolving https://github.com/emscripten-core/emscripten/issues/2211
      // so only supports SOL_SOCKET with SO_ERROR.
      if (level === 1) {
        if (optname === 4) {
          HEAP32[((optval)/4)] = sock.error;
          HEAP32[((optlen)/4)] = 4;
          sock.error = null; // Clear the error (The SO_ERROR option obtains and then clears this field).
          return 0;
        }
      }
      return -50; // The option is unknown at the level indicated.
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  function ___syscall_getuid32() {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(19, 0, 1);
  return 0
  }
  

  
  
  
  
  
  
  
  function ___syscall_ioctl(fd, op, varargs) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(20, 0, 1, fd, op, varargs);
  
    varargs = bigintToI53Checked(varargs);
  
  
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (op) {
        case 21509: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21505: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcgets) {
            var termios = stream.tty.ops.ioctl_tcgets(stream);
            var argp = syscallGetVarargP();
            HEAP32[((argp)/4)] = termios.c_iflag || 0;
            HEAP32[(((argp)+(4))/4)] = termios.c_oflag || 0;
            HEAP32[(((argp)+(8))/4)] = termios.c_cflag || 0;
            HEAP32[(((argp)+(12))/4)] = termios.c_lflag || 0;
            for (var i = 0; i < 32; i++) {
              HEAP8[(argp + i)+(17)] = termios.c_cc[i] || 0;
            }
            return 0;
          }
          return 0;
        }
        case 21510:
        case 21511:
        case 21512: {
          if (!stream.tty) return -59;
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcsets) {
            var argp = syscallGetVarargP();
            var c_iflag = HEAP32[((argp)/4)];
            var c_oflag = HEAP32[(((argp)+(4))/4)];
            var c_cflag = HEAP32[(((argp)+(8))/4)];
            var c_lflag = HEAP32[(((argp)+(12))/4)];
            var c_cc = []
            for (var i = 0; i < 32; i++) {
              c_cc.push(HEAP8[(argp + i)+(17)]);
            }
            return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag, c_oflag, c_cflag, c_lflag, c_cc });
          }
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21519: {
          if (!stream.tty) return -59;
          var argp = syscallGetVarargP();
          HEAP32[((argp)/4)] = 0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -59;
          return -28; // not supported
        }
        case 21537:
        case 21531: {
          var argp = syscallGetVarargP();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          // TODO: in theory we should write to the winsize struct that gets
          // passed in, but for now musl doesn't read anything on it
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tiocgwinsz) {
            var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
            var argp = syscallGetVarargP();
            HEAP16[((argp)/2)] = winsize[0];
            HEAP16[(((argp)+(2))/2)] = winsize[1];
          }
          return 0;
        }
        case 21524: {
          // TODO: technically, this ioctl call should change the window size.
          // but, since emscripten doesn't have any concept of a terminal window
          // yet, we'll just silently throw it away as we do TIOCGWINSZ
          if (!stream.tty) return -59;
          return 0;
        }
        case 21515: {
          if (!stream.tty) return -59;
          return 0;
        }
        default: return -28; // not supported
      }
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  function ___syscall_listen(fd, backlog, u1, u2, u3, u4) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(21, 0, 1, fd, backlog, u1, u2, u3, u4);
  
  try {
  
      var sock = getSocketFromFD(fd);
      sock.sock_ops.listen(sock, backlog);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  
  }
  

  
  
  
  function ___syscall_lstat64(path, buf) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(22, 0, 1, path, buf);
  
    path = bigintToI53Checked(path);
    buf = bigintToI53Checked(buf);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      return SYSCALLS.writeStat(buf, FS.lstat(path));
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  function ___syscall_mkdirat(dirfd, path, mode) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(23, 0, 1, dirfd, path, mode);
  
    path = bigintToI53Checked(path);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      mode &= ~SYSCALLS.currentUmask;
      FS.mkdir(path, mode, 0);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  function ___syscall_newfstatat(dirfd, path, buf, flags) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(24, 0, 1, dirfd, path, buf, flags);
  
    path = bigintToI53Checked(path);
    buf = bigintToI53Checked(buf);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      var nofollow = flags & 256;
      var allowEmpty = flags & 4096;
      flags = flags & (~6400);
      assert(!flags, `unknown flags in __syscall_newfstatat: ${flags}`);
      path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
      return SYSCALLS.writeStat(buf, nofollow ? FS.lstat(path) : FS.stat(path));
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  
  function ___syscall_openat(dirfd, path, flags, varargs) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(25, 0, 1, dirfd, path, flags, varargs);
  
    path = bigintToI53Checked(path);
    varargs = bigintToI53Checked(varargs);
  
  
  SYSCALLS.varargs = varargs;
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      var mode = varargs ? syscallGetVarargI() : 0;
      if (flags & 64) {
        mode &= ~SYSCALLS.currentUmask;
      }
      return FS.open(path, flags, mode).fd;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  var PIPEFS = {
  BUCKET_BUFFER_SIZE:8192,
  mount(mount) {
        // Do not pollute the real root directory or its child nodes with pipes
        // Looks like it is OK to create another pseudo-root node not linked to the FS.root hierarchy this way
        return FS.createNode(null, '/', 16384 | 0o777, 0);
      },
  createPipe() {
        var pipe = {
          buckets: [],
          // Open write ends. When it drops to 0 the reader sees EOF and poll must
          // report POLLHUP (Linux semantics). Buckets are freed once both counts
          // reach 0.
          writerCount: 1,
          writeClosed: false,
          // Open read ends. When it drops to 0 the writer sees POLLERR (a further
          // write would get EPIPE).
          readerCount: 1,
          readClosed: false,
          timestamp: new Date(),
        };
  
        pipe.buckets.push({
          buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
          offset: 0,
          roffset: 0
        });
  
        var rName = PIPEFS.nextname();
        var wName = PIPEFS.nextname();
        var rNode = FS.createNode(PIPEFS.root, rName, 4096, 0);
        var wNode = FS.createNode(PIPEFS.root, wName, 4096, 0);
  
        rNode.pipe = pipe;
        wNode.pipe = pipe;
        // The read end's node carries the reader poll wait-queue (writes wake it);
        // the write end's node carries the writer wait-queue (read-end close wakes it).
        pipe.readNode = rNode;
        pipe.writeNode = wNode;
  
        var readableStream = FS.createStream({
          path: rName,
          node: rNode,
          flags: 0,
          seekable: false,
          stream_ops: PIPEFS.stream_ops
        });
        rNode.stream = readableStream;
  
        var writableStream = FS.createStream({
          path: wName,
          node: wNode,
          flags: 1,
          seekable: false,
          stream_ops: PIPEFS.stream_ops
        });
        wNode.stream = writableStream;
  
        return {
          readable_fd: readableStream.fd,
          writable_fd: writableStream.fd
        };
      },
  stream_ops:{
  getattr(stream) {
          var node = stream.node;
          var timestamp = node.pipe.timestamp;
          return {
            dev: 14,
            ino: node.id,
            mode: 0o10600,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: 0,
            size: 0,
            atime: timestamp,
            mtime: timestamp,
            ctime: timestamp,
            blksize: 4096,
            blocks: 0,
          };
        },
  poll(stream) {
          var pipe = stream.node.pipe;
  
          if ((stream.flags & 2097155) === 1) {
            // Linux keeps the write end writable (the write itself fails with
            // EPIPE) while also signalling POLLERR once every read end is closed.
            var mask = 256 | 4;
            if (pipe.readClosed) {
              mask |= 8;
            }
            return mask;
          }
          var mask = 0;
          for (var bucket of pipe.buckets) {
            if (bucket.offset - bucket.roffset > 0) {
              mask = 64 | 1;
              break;
            }
          }
          // With every write end closed the read end is at EOF: readable (read
          // returns 0) and hung up.
          if (pipe.writeClosed) {
            mask |= 16 | 1;
          }
          return mask;
        },
  dup(stream) {
          var pipe = stream.node.pipe;
          if ((stream.flags & 2097155) === 1) {
            pipe.writerCount++;
          } else {
            pipe.readerCount++;
          }
        },
  ioctl(stream, request, argp) {
          if (request == 21531) {
            var pipe = stream.node.pipe;
            var currentLength = 0;
            for (var bucket of pipe.buckets) {
              currentLength += bucket.offset - bucket.roffset;
            }
            HEAP32[((argp)/4)] = currentLength;
            return 0;
          }
          return 28;
        },
  fsync(stream) {
          return 28;
        },
  read(stream, buffer, offset, length, position /* ignored */) {
          var pipe = stream.node.pipe;
          var currentLength = 0;
  
          for (var bucket of pipe.buckets) {
            currentLength += bucket.offset - bucket.roffset;
          }
  
          assert(buffer instanceof ArrayBuffer || buffer instanceof SharedArrayBuffer || ArrayBuffer.isView(buffer));
          var data = buffer.subarray(offset, offset + length);
  
          if (length <= 0) {
            return 0;
          }
          if (currentLength == 0) {
            // Behave as if the read end is always non-blocking
            throw new FS.ErrnoError(6);
          }
          var toRead = Math.min(currentLength, length);
  
          var totalRead = toRead;
          var toRemove = 0;
  
          for (var bucket of pipe.buckets) {
            var bucketSize = bucket.offset - bucket.roffset;
  
            if (toRead <= bucketSize) {
              var tmpSlice = bucket.buffer.subarray(bucket.roffset, bucket.offset);
              if (toRead < bucketSize) {
                tmpSlice = tmpSlice.subarray(0, toRead);
                bucket.roffset += toRead;
              } else {
                toRemove++;
              }
              data.set(tmpSlice);
              break;
            } else {
              var tmpSlice = bucket.buffer.subarray(bucket.roffset, bucket.offset);
              data.set(tmpSlice);
              data = data.subarray(tmpSlice.byteLength);
              toRead -= tmpSlice.byteLength;
              toRemove++;
            }
          }
  
          if (toRemove && toRemove == pipe.buckets.length) {
            // Do not generate excessive garbage in use cases such as
            // write several bytes, read everything, write several bytes, read everything...
            toRemove--;
            pipe.buckets[toRemove].offset = 0;
            pipe.buckets[toRemove].roffset = 0;
          }
  
          pipe.buckets.splice(0, toRemove);
  
          return totalRead;
        },
  write(stream, buffer, offset, length, position /* ignored */) {
          var pipe = stream.node.pipe;
  
          assert(buffer instanceof ArrayBuffer || buffer instanceof SharedArrayBuffer || ArrayBuffer.isView(buffer));
          var data = buffer.subarray(offset, offset + length);
  
          var dataLen = data.byteLength;
          if (dataLen <= 0) {
            return 0;
          }
  
          var currBucket = null;
  
          if (pipe.buckets.length == 0) {
            currBucket = {
              buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
              offset: 0,
              roffset: 0
            };
            pipe.buckets.push(currBucket);
          } else {
            currBucket = pipe.buckets[pipe.buckets.length - 1];
          }
  
          assert(currBucket.offset <= PIPEFS.BUCKET_BUFFER_SIZE);
  
          var freeBytesInCurrBuffer = PIPEFS.BUCKET_BUFFER_SIZE - currBucket.offset;
          if (freeBytesInCurrBuffer >= dataLen) {
            currBucket.buffer.set(data, currBucket.offset);
            currBucket.offset += dataLen;
            pipe.readNode.notifyListeners(64 | 1);
            return dataLen;
          } else if (freeBytesInCurrBuffer > 0) {
            currBucket.buffer.set(data.subarray(0, freeBytesInCurrBuffer), currBucket.offset);
            currBucket.offset += freeBytesInCurrBuffer;
            data = data.subarray(freeBytesInCurrBuffer, data.byteLength);
          }
  
          var numBuckets = (data.byteLength / PIPEFS.BUCKET_BUFFER_SIZE) | 0;
          var remElements = data.byteLength % PIPEFS.BUCKET_BUFFER_SIZE;
  
          for (var i = 0; i < numBuckets; i++) {
            var newBucket = {
              buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
              offset: PIPEFS.BUCKET_BUFFER_SIZE,
              roffset: 0
            };
            pipe.buckets.push(newBucket);
            newBucket.buffer.set(data.subarray(0, PIPEFS.BUCKET_BUFFER_SIZE));
            data = data.subarray(PIPEFS.BUCKET_BUFFER_SIZE, data.byteLength);
          }
  
          if (remElements > 0) {
            var newBucket = {
              buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
              offset: data.byteLength,
              roffset: 0
            };
            pipe.buckets.push(newBucket);
            newBucket.buffer.set(data);
          }
  
          pipe.readNode.notifyListeners(64 | 1);
          return dataLen;
        },
  close(stream) {
          var pipe = stream.node.pipe;
          // When the last write end closes, wake any poll/epoll waiter on the read
          // end with POLLHUP so a reader blocked on the writer dropping unblocks.
          if ((stream.flags & 2097155) === 1) {
            if (!--pipe.writerCount) {
              pipe.writeClosed = true;
              pipe.readNode.notifyListeners(16 | 64 | 1);
            }
          } else if (!--pipe.readerCount) {
            // Mirror: when the last read end closes, wake any poll/epoll waiter on
            // the write end with POLLERR (a further write would get EPIPE).
            pipe.readClosed = true;
            pipe.writeNode.notifyListeners(8 | 256 | 4);
          }
          if (!pipe.readerCount && !pipe.writerCount) {
            pipe.buckets = null;
          }
        },
  },
  nextname() {
        if (!PIPEFS.nextname.current) {
          PIPEFS.nextname.current = 0;
        }
        return 'pipe[' + (PIPEFS.nextname.current++) + ']';
      },
  };
  
  
  
  
  function ___syscall_pipe2(fdPtr, flags) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(26, 0, 1, fdPtr, flags);
  
    fdPtr = bigintToI53Checked(fdPtr);
  
  
  try {
  
      if (fdPtr == 0) {
        throw new FS.ErrnoError(21);
      }
      var validFlags = 524288 | 2048;
      if (flags & ~validFlags) {
        throw new FS.ErrnoError(138);
      }
  
      var res = PIPEFS.createPipe();
  
      if (flags & 2048) {
        FS.getStream(res.readable_fd).flags |= 2048;
        FS.getStream(res.writable_fd).flags |= 2048;
      }
  
      HEAP32[((fdPtr)/4)] = res.readable_fd;
      HEAP32[(((fdPtr)+(4))/4)] = res.writable_fd;
  
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  var pollOne = (fd, events) => {
      var stream = FS.getStream(fd);
      if (!stream) return 32;
      // Streams without a poll handler (regular files, incl. NODERAWFS/NODEFS
      // which leave stream_ops unset) are treated as always readable+writable.
      var flags = stream.stream_ops?.poll
        ? stream.stream_ops.poll(stream)
        : 5;
      return flags & (events | 8 | 16 | 32);
    };
  
  
  var doPollSync = (fds, nfds) => {
      var count = 0;
      for (var i = 0, pollfd = fds; i < nfds; i++, pollfd += 8) {
        var revents = pollOne(
          HEAP32[((pollfd)/4)],
          HEAP16[(((pollfd)+(4))/2)]);
        if (revents) count++;
        HEAP16[(((pollfd)+(6))/2)] = revents;
      }
      return count;
    };
  
  
  
  
  var doPollAsync = (fds, nfds, timeout) => new Promise((resolve) => {
      var regs = [];
      var timer;
      var done = false;
      function derive() {
        var count = 0;
        for (var i = 0, pollfd = fds; i < nfds; i++, pollfd += 8) {
          var revents = pollOne(
            HEAP32[((pollfd)/4)],
            HEAP16[(((pollfd)+(4))/2)]);
          if (revents) count++;
          HEAP16[(((pollfd)+(6))/2)] = revents;
        }
        return count;
      }
      function finish(count) {
        if (done) return;
        done = true;
        for (var r of regs) r.listeners.delete(r.entry);
        if (timer) clearTimeout(timer);
        resolve(count);
      }
      var count = derive();
      if (count || !timeout) {
        finish(count);
      } else {
        function recheck() {
          if (done) return;
          var c = derive();
          if (c) finish(c);
        }
        for (var i = 0, pollfd = fds; i < nfds; i++, pollfd += 8) {
          var stream = FS.getStream(HEAP32[((pollfd)/4)]);
          if (stream) regs.push(stream.node.addListener(recheck));
        }
        if (timeout > 0) timer = setTimeout(() => finish(0), timeout);
      }
    });
  
  
  var ___syscall_poll = 
  function(fds, nfds, timeout) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(27, 0, 2, fds, nfds, timeout);
  
    let innerFunc =  () => {
  
    fds = bigintToI53Checked(fds);
  
  
  try {
  
      const isAsyncContext = PThread.currentProxiedOperationCallerThread;
      // When proxied from a worker (PTHREADS) or able to suspend (ASYNCIFY/JSPI),
      // block on the wait-queue. This must run for every timeout (including zero):
      // a proxied syscall's return is awaited by the caller thread, so it has to
      // be a Promise even for a probe.
      if (isAsyncContext) {
        return doPollAsync(fds, nfds, timeout);
      }
      var count = doPollSync(fds, nfds);
      if (!count && timeout != 0) warnOnce('non-zero poll() timeout not supported: ' + timeout)
      return count;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  };
    if (PThread.currentProxiedOperationCallerThread) return innerFunc();
    return Asyncify.handleAsync(innerFunc);
  
  }
  ;
  ___syscall_poll.isAsync = true;

  
  
  
  function ___syscall_poll_nonblocking(fds, nfds) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(28, 0, 1, fds, nfds);
  
    fds = bigintToI53Checked(fds);
  
  
  try {
  
      return doPollSync(fds, nfds);
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  
  
  
  function ___syscall_readlinkat(dirfd, path, buf, bufsize) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(29, 0, 1, dirfd, path, buf, bufsize);
  
    path = bigintToI53Checked(path);
    buf = bigintToI53Checked(buf);
    bufsize = bigintToI53Checked(bufsize);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      if (bufsize <= 0) return -28;
      var ret = FS.readlink(path);
  
      var len = Math.min(bufsize, lengthBytesUTF8(ret));
      var endChar = HEAP8[buf+len];
      stringToUTF8(ret, buf, bufsize+1);
      // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
      // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
      HEAP8[buf+len] = endChar;
      return len;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  
  
  function ___syscall_recvfrom(fd, buf, len, flags, addr, alen) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(30, 0, 1, fd, buf, len, flags, addr, alen);
  
    buf = bigintToI53Checked(buf);
    len = bigintToI53Checked(len);
    addr = bigintToI53Checked(addr);
    alen = bigintToI53Checked(alen);
  
  
  try {
  
      var sock = getSocketFromFD(fd);
      var msg = sock.sock_ops.recvmsg(sock, len, flags);
      if (!msg) return 0; // socket is closed
      if (addr) {
        var errno = writeSockaddr(addr, sock.family, msg.addr, msg.port, alen);
        assert(!errno);
      }
      HEAPU8.set(msg.buffer, buf);
      return msg.buffer.byteLength;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  
  
  
  
  function ___syscall_recvmsg(fd, message, flags, u1, u2, u3) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(31, 0, 1, fd, message, flags, u1, u2, u3);
  
    message = bigintToI53Checked(message);
  
  
  try {
  
      var sock = getSocketFromFD(fd);
      var iov = Number(HEAPU64[(((message)+(16))/8)]);
      var num = HEAP32[(((message)+(24))/4)];
      // get the total amount of data we can read across all arrays
      var total = 0;
      for (var i = 0; i < num; i++) {
        total += HEAP32[(((iov)+((16 * i) + 8))/4)];
      }
      // try to read total data (MSG_PEEK, when set, leaves it buffered)
      var msg = sock.sock_ops.recvmsg(sock, total, flags);
      if (!msg) return 0; // socket is closed
  
      // TODO honor flags:
      // MSG_OOB
      // Requests out-of-band data. The significance and semantics of out-of-band data are protocol-specific.
      // MSG_WAITALL
      // Requests that the function block until the full amount of data requested can be returned. The function may return a smaller amount of data if a signal is caught, if the connection is terminated, if MSG_PEEK was specified, or if an error is pending for the socket.
  
      // write the source address out
      var name = Number(HEAPU64[((message)/8)]);
      if (name) {
        var namelen = message + 8;
        var errno = writeSockaddr(name, sock.family, msg.addr, msg.port, namelen);
        assert(!errno);
      }
      // write the buffer out to the scatter-gather arrays
      var bytesRead = 0;
      var bytesRemaining = msg.buffer.byteLength;
      for (var i = 0; bytesRemaining > 0 && i < num; i++) {
        var iovbase = Number(HEAPU64[(((iov)+((16 * i) + 0))/8)]);
        var iovlen = HEAP32[(((iov)+((16 * i) + 8))/4)];
        if (!iovlen) {
          continue;
        }
        var length = Math.min(iovlen, bytesRemaining);
        var buf = msg.buffer.subarray(bytesRead, bytesRead + length);
        HEAPU8.set(buf, iovbase);
        bytesRead += length;
        bytesRemaining -= length;
      }
  
      HEAP32[(((message)+(40))/4)] = 0;
      HEAP32[(((message)+(48))/4)] = 0;
  
      // TODO report truncation in msghdr.msg_flags
      // MSG_EOR
      // End of record was received (if supported by the protocol).
      // MSG_OOB
      // Out-of-band data was received.
      // MSG_TRUNC
      // Normal data was truncated.
      // MSG_CTRUNC
  
      return bytesRead;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  function ___syscall_renameat(olddirfd, oldpath, newdirfd, newpath) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(32, 0, 1, olddirfd, oldpath, newdirfd, newpath);
  
    oldpath = bigintToI53Checked(oldpath);
    newpath = bigintToI53Checked(newpath);
  
  
  try {
  
      oldpath = SYSCALLS.getStr(oldpath);
      newpath = SYSCALLS.getStr(newpath);
      oldpath = SYSCALLS.calculateAt(olddirfd, oldpath);
      newpath = SYSCALLS.calculateAt(newdirfd, newpath);
      FS.rename(oldpath, newpath);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  function ___syscall_rmdir(path) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(33, 0, 1, path);
  
    path = bigintToI53Checked(path);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      FS.rmdir(path);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  
  
  
  
  function ___syscall_sendmsg(fd, message, flags, u1, u2, u3) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(34, 0, 1, fd, message, flags, u1, u2, u3);
  
    message = bigintToI53Checked(message);
  
  
  try {
  
      var sock = getSocketFromFD(fd);
      var iov = Number(HEAPU64[(((message)+(16))/8)]);
      var num = HEAP32[(((message)+(24))/4)];
      // read the address and port to send to
      var addr, port;
      var name = Number(HEAPU64[((message)/8)]);
      var namelen = HEAP32[(((message)+(8))/4)];
      if (name) {
        var info = getSocketAddress(name, namelen);
        port = info.port;
        addr = info.addr;
      }
      // concatenate scatter-gather arrays into one message buffer
      var total = 0;
      for (var i = 0; i < num; i++) {
        total += HEAP32[(((iov)+((16 * i) + 8))/4)];
      }
      var view = new Uint8Array(total);
      var offset = 0;
      for (var i = 0; i < num; i++) {
        var iovbase = Number(HEAPU64[(((iov)+((16 * i) + 0))/8)]);
        var iovlen = HEAP32[(((iov)+((16 * i) + 8))/4)];
        for (var j = 0; j < iovlen; j++) {
          view[offset++] = HEAP8[(iovbase)+(j)];
        }
      }
      // write the buffer
      return sock.sock_ops.sendmsg(sock, view, 0, total, addr, port);
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  
  
  function ___syscall_sendto(fd, buf, len, flags, addr, alen) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(35, 0, 1, fd, buf, len, flags, addr, alen);
  
    buf = bigintToI53Checked(buf);
    len = bigintToI53Checked(len);
    addr = bigintToI53Checked(addr);
  
  
  try {
  
      var sock = getSocketFromFD(fd);
      if (!addr) {
        // send, no address provided
        return FS.write(sock.stream, HEAP8, buf, len);
      }
      var dest = getSocketAddress(addr, alen);
      // sendto an address
      return sock.sock_ops.sendmsg(sock, HEAP8, buf, len, dest.addr, dest.port);
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  function ___syscall_setsockopt(fd, level, optname, optval, optlen, unused) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(36, 0, 1, fd, level, optname, optval, optlen, unused);
  
    optval = bigintToI53Checked(optval);
  
  
  try {
  
      getSocketFromFD(fd); // validate the fd (and keep this syscall's catch reachable)
      return -50; // The option is unknown at the level indicated.
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  function ___syscall_shutdown(fd, how, u1, u2, u3, u4) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(37, 0, 1, fd, how, u1, u2, u3, u4);
  
  try {
  
      var sock = getSocketFromFD(fd);
      return -52; // unsupported feature
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  
  }
  

  
  
  function ___syscall_socket(domain, type, protocol, u1, u2, u3) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(38, 0, 1, domain, type, protocol, u1, u2, u3);
  
  try {
  
      var sock = SOCKFS.createSocket(domain, type, protocol);
      return sock.stream.fd;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  
  }
  

  
  
  
  function ___syscall_stat64(path, buf) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(39, 0, 1, path, buf);
  
    path = bigintToI53Checked(path);
    buf = bigintToI53Checked(buf);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      return SYSCALLS.writeStat(buf, FS.stat(path));
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  function ___syscall_statfs64(path, size, buf) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(40, 0, 1, path, size, buf);
  
    path = bigintToI53Checked(path);
    size = bigintToI53Checked(size);
    buf = bigintToI53Checked(buf);
  
  
  try {
  
      assert(size === 120);
      SYSCALLS.writeStatFs(buf, FS.statfs(SYSCALLS.getStr(path)));
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  function ___syscall_symlinkat(target, dirfd, linkpath) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(41, 0, 1, target, dirfd, linkpath);
  
    target = bigintToI53Checked(target);
    linkpath = bigintToI53Checked(linkpath);
  
  
  try {
  
      target = SYSCALLS.getStr(target);
      linkpath = SYSCALLS.getStr(linkpath);
      linkpath = SYSCALLS.calculateAt(dirfd, linkpath);
      FS.symlink(target, linkpath);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  function ___syscall_unlinkat(dirfd, path, flags) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(42, 0, 1, dirfd, path, flags);
  
    path = bigintToI53Checked(path);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      if (!flags) {
        FS.unlink(path);
      } else if (flags === 512) {
        FS.rmdir(path);
      } else {
        return -28;
      }
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  var __abort_js = () =>
      abort('native code called abort()');

  
  
  function __emscripten_init_main_thread_js(tb) {
    tb = bigintToI53Checked(tb);
  
  
      var can_block = !ENVIRONMENT_IS_WEB;
      // Feature detect whether the main thread can block.
      try {
        Atomics.wait(HEAP32, 0, 0, 0)
        can_block = true;
      } catch (e) {}
      // Pass the thread address to the native code where they are stored in wasm
      // globals which act as a form of TLS. Global constructors trying
      // to access this value will read the wrong value, but that is UB anyway.
      __emscripten_thread_init(
        tb,
        /*is_main=*/!ENVIRONMENT_IS_WORKER,
        /*is_runtime=*/1,
        can_block,
        /*default_stacksize=*/65536,
        /*start_profiling=*/false,
      );
      PThread.threadInitTLS();
    ;
  }

  
  
  
  
  function __emscripten_lookup_name(name) {
    name = bigintToI53Checked(name);
  
  
      // uint32_t _emscripten_lookup_name(const char *name);
      var nameString = UTF8ToString(name);
      return inetPton4(DNS.lookup_name(nameString));
    ;
  }

  var handleException = (e) => {
      // Certain exception types we do not treat as errors since they are used for
      // internal control flow.
      // 1. ExitStatus, which is thrown by exit()
      // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
      //    that wish to return to JS event loop.
      if (e instanceof ExitStatus || e == 'unwind') {
        return EXITSTATUS;
      }
      checkStackCookie();
      if (e instanceof WebAssembly.RuntimeError) {
        if (_emscripten_stack_get_current() <= 0) {
          err('Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 65536)');
        }
      }
      quit_(1, e);
    };
  
  
  
  
  var maybeExit = () => {
      if (!keepRuntimeAlive()) {
        try {
          if (ENVIRONMENT_IS_PTHREAD) {
            // exit the current thread, but only if there is one active.
            // TODO(https://github.com/emscripten-core/emscripten/issues/25076):
            // Unify this check with the runtimeExited check above
            if (_pthread_self()) __emscripten_thread_exit(EXITSTATUS);
            return;
          }
          _exit(EXITSTATUS);
        } catch (e) {
          handleException(e);
        }
      }
    };
  var callUserCallback = (func) => {
      if (ABORT) {
        err('user callback triggered after runtime exited or application aborted.  Ignoring.');
        return;
      }
      try {
        return func();
      } catch (e) {
        handleException(e);
      } finally {
        maybeExit();
      }
    };
  
  
  
  
  
  
  
  function __emscripten_thread_mailbox_await(pthread_ptr) {
    pthread_ptr = bigintToI53Checked(pthread_ptr);
  
  
      if (!waitAsyncPolyfilled) {
        // Wait on the pthread's initial self-pointer field because it is easy and
        // safe to access from sending threads that need to notify the waiting
        // thread.
        // Note: Under wasm64 only the low 32-bit of the pthread_ptr are
        // read/compared here, but we don't actually care about the exact values
        // here as long as they match.
        var wait = Atomics.waitAsync(HEAP32, ((pthread_ptr)/4), pthread_ptr);
        assert(wait.async);
        wait.value.then(checkMailbox);
        var waitingAsync = pthread_ptr + 204;
        Atomics.store(HEAP32, ((waitingAsync)/4), 1);
      }
      // If `Atomics.waitAsync` is not implemented, then we will always fall back
      // to postMessage and there is no need to do anything here.
    ;
  }
  
  var checkMailbox = () => {
      // checkMailbox can be called after the pthread has shut down. See
      // Pthread.terminateRuntime().
      // In this case we return silently without re-registering using waitAsync.
      // Perhaps there is a more universal way we can detect runtime has exited.
      // TODO(https://github.com/emscripten-core/emscripten/issues/25076)
      var pthread_ptr = _pthread_self();
      if (!pthread_ptr) return;
      callUserCallback(() => {
        // If we are using Atomics.waitAsync as our notification mechanism, wait
        // for a notification before processing the mailbox to avoid missing any
        // work that could otherwise arrive after we've finished processing the
        // mailbox and before we're ready for the next notification.
        __emscripten_thread_mailbox_await(pthread_ptr);
        __emscripten_check_mailbox();
      });
    };
  
  
  function __emscripten_notify_mailbox_postmessage(targetThread, currThreadId) {
    targetThread = bigintToI53Checked(targetThread);
    currThreadId = bigintToI53Checked(currThreadId);
  
  
      if (targetThread == currThreadId) {
        setTimeout(checkMailbox);
      } else if (ENVIRONMENT_IS_PTHREAD) {
        postMessage({targetThread, cmd: 4});
      } else {
        var worker = PThread.pthreads[targetThread];
        if (!worker) {
          err(`Cannot send message to thread with ID ${targetThread}, unknown thread ID!`);
          return;
        }
        worker.postMessage({cmd: 4});
      }
    ;
  }

  
  
  var proxiedJSCallArgs = [];
  
  
  
  
  function __emscripten_receive_on_main_thread_js(funcIndex, emAsmAddr, callingThread, bufSize, args, ctx, ctxArgs) {
    emAsmAddr = bigintToI53Checked(emAsmAddr);
    callingThread = bigintToI53Checked(callingThread);
    args = bigintToI53Checked(args);
    ctx = bigintToI53Checked(ctx);
    ctxArgs = bigintToI53Checked(ctxArgs);
  
  
      // Sometimes we need to backproxy events to the calling thread (e.g.
      // HTML5 DOM events handlers such as
      // emscripten_set_mousemove_callback()), so keep track in a globally
      // accessible variable about the thread that initiated the proxying.
      proxiedJSCallArgs.length = 0;
      var b = ((args)/8);
      var end = ((args + bufSize)/8);
      while (b < end) {
        var arg;
        if (HEAP64[b++]) {
          // It's a BigInt.
          arg = HEAP64[b++];
        } else {
          // It's a Number.
          arg = HEAPF64[b++];
        }
        proxiedJSCallArgs.push(arg);
      }
      // Proxied JS library funcs use funcIndex and EM_ASM functions use emAsmAddr
      var func = emAsmAddr ? ASM_CONSTS[emAsmAddr] : proxiedFunctionTable[funcIndex];
      assert(!(funcIndex && emAsmAddr));
      assert(func.length == proxiedJSCallArgs.length, 'Call args mismatch in _emscripten_receive_on_main_thread_js');
      PThread.currentProxiedOperationCallerThread = callingThread;
      var rtn = func(...proxiedJSCallArgs);
      PThread.currentProxiedOperationCallerThread = 0;
      if (ctx) {
        rtn.then((rtn) => __emscripten_run_js_on_main_thread_done(ctx, ctxArgs, rtn));
        return;
      }
  
      // In memory64 mode some proxied functions return bigint/pointer but
      // our return type is i53/double.
      if (typeof rtn == 'bigint') {
        rtn = bigintToI53Checked(rtn);
      }
      // Proxied functions can return any type except bigint.  All other types
      // coerce to f64/double (the return type of this function in C) but not
      // bigint.
      assert(typeof rtn != 'bigint');
      return rtn;
    ;
  }

  var __emscripten_runtime_keepalive_clear = () => {
      runtimeKeepaliveCounter = 0;
    };

  
  function __emscripten_thread_cleanup(thread) {
    thread = bigintToI53Checked(thread);
  
  
      // Called when a thread needs to be cleaned up so it can be reused.
      // A thread is considered reusable when it either returns from its
      // entry point, calls pthread_exit, or acts upon a cancellation.
      // Detached threads are responsible for calling this themselves,
      // otherwise pthread_join is responsible for calling this.
      if (!ENVIRONMENT_IS_PTHREAD) cleanupThread(thread);
      else postMessage({ cmd: 6, thread });
    ;
  }


  
  function __emscripten_thread_set_strongref(thread) {
    thread = bigintToI53Checked(thread);
  
  
      // Called when a thread needs to be strongly referenced.
      // Currently only used for:
      // - keeping the "main" thread alive in PROXY_TO_PTHREAD mode;
      // - crashed threads that need to propagate the uncaught exception
      //   back to the main thread.
    ;
  }

  var __emscripten_throw_longjmp = () => {
      throw new EmscriptenSjLj;
    };

  
  function __gmtime_js(time, tmPtr) {
    time = bigintToI53Checked(time);
    tmPtr = bigintToI53Checked(tmPtr);
  
  
      var date = new Date(time * 1000);
      if (isNaN(date.getTime())) {
        return 1;
      }
      HEAP32[((tmPtr)/4)] = date.getUTCSeconds();
      HEAP32[(((tmPtr)+(4))/4)] = date.getUTCMinutes();
      HEAP32[(((tmPtr)+(8))/4)] = date.getUTCHours();
      HEAP32[(((tmPtr)+(12))/4)] = date.getUTCDate();
      HEAP32[(((tmPtr)+(16))/4)] = date.getUTCMonth();
      HEAP32[(((tmPtr)+(20))/4)] = date.getUTCFullYear()-1900;
      HEAP32[(((tmPtr)+(24))/4)] = date.getUTCDay();
      var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
      var yday = ((date.getTime() - start) / (1000 * 60 * 60 * 24))|0;
      HEAP32[(((tmPtr)+(28))/4)] = yday;
      return 0;
    ;
  }

  var isLeapYear = (year) => year%4 === 0 && (year%100 !== 0 || year%400 === 0);
  
  var MONTH_DAYS_LEAP_CUMULATIVE = [0,31,60,91,121,152,182,213,244,274,305,335];
  
  var MONTH_DAYS_REGULAR_CUMULATIVE = [0,31,59,90,120,151,181,212,243,273,304,334];
  var ydayFromDate = (date) => {
      var leap = isLeapYear(date.getFullYear());
      var monthDaysCumulative = (leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE);
      var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1; // -1 since it's days since Jan 1
  
      return yday;
    };
  
  
  
  function __localtime_js(time, tmPtr) {
    time = bigintToI53Checked(time);
    tmPtr = bigintToI53Checked(tmPtr);
  
  
      var date = new Date(time*1000);
      if (isNaN(date.getTime())) {
        return 1;
      }
      HEAP32[((tmPtr)/4)] = date.getSeconds();
      HEAP32[(((tmPtr)+(4))/4)] = date.getMinutes();
      HEAP32[(((tmPtr)+(8))/4)] = date.getHours();
      HEAP32[(((tmPtr)+(12))/4)] = date.getDate();
      HEAP32[(((tmPtr)+(16))/4)] = date.getMonth();
      HEAP32[(((tmPtr)+(20))/4)] = date.getFullYear()-1900;
      HEAP32[(((tmPtr)+(24))/4)] = date.getDay();
  
      var yday = ydayFromDate(date)|0;
      HEAP32[(((tmPtr)+(28))/4)] = yday;
      HEAP64[(((tmPtr)+(40))/8)] = BigInt(-(date.getTimezoneOffset() * 60));
  
      // Attention: DST is in December in South, and some regions don't have DST at all.
      var start = new Date(date.getFullYear(), 0, 1);
      var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
      var winterOffset = start.getTimezoneOffset();
      var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset))|0;
      HEAP32[(((tmPtr)+(32))/4)] = dst;
      return 0;
    ;
  }

  
  
  var __mktime_js = function(tmPtr) {
    tmPtr = bigintToI53Checked(tmPtr);
  
  var ret = (() => { 
      var date = new Date(HEAP32[(((tmPtr)+(20))/4)] + 1900,
                          HEAP32[(((tmPtr)+(16))/4)],
                          HEAP32[(((tmPtr)+(12))/4)],
                          HEAP32[(((tmPtr)+(8))/4)],
                          HEAP32[(((tmPtr)+(4))/4)],
                          HEAP32[((tmPtr)/4)],
                          0);
      if (isNaN(date.getTime())) {
        return -1;
      }
  
      // There's an ambiguous hour when the time goes back; the tm_isdst field is
      // used to disambiguate it.  Date() basically guesses, so we fix it up if it
      // guessed wrong, or fill in tm_isdst with the guess if it's -1.
      var dst = HEAP32[(((tmPtr)+(32))/4)];
      var guessedOffset = date.getTimezoneOffset();
      var start = new Date(date.getFullYear(), 0, 1);
      var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
      var winterOffset = start.getTimezoneOffset();
      var dstOffset = Math.min(winterOffset, summerOffset); // DST is in December in South
      if (dst < 0) {
        // Attention: some regions don't have DST at all.
        dst = Number(summerOffset != winterOffset && dstOffset == guessedOffset);
      } else if ((dst > 0) != (dstOffset == guessedOffset)) {
        var nonDstOffset = Math.max(winterOffset, summerOffset);
        var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
        // Don't try setMinutes(date.getMinutes() + ...) -- it's messed up.
        date.setTime(date.getTime() + (trueOffset - guessedOffset)*60000);
        if (isNaN(date.getTime())) {
          return -1;
        }
      }
  
      HEAP32[(((tmPtr)+(32))/4)] = dst;
      HEAP32[(((tmPtr)+(24))/4)] = date.getDay();
      var yday = ydayFromDate(date)|0;
      HEAP32[(((tmPtr)+(28))/4)] = yday;
      // To match expected behavior, update fields from date
      HEAP32[((tmPtr)/4)] = date.getSeconds();
      HEAP32[(((tmPtr)+(4))/4)] = date.getMinutes();
      HEAP32[(((tmPtr)+(8))/4)] = date.getHours();
      HEAP32[(((tmPtr)+(12))/4)] = date.getDate();
      HEAP32[(((tmPtr)+(16))/4)] = date.getMonth();
      HEAP32[(((tmPtr)+(20))/4)] = date.getYear();
  
      // Return time in seconds
      return date.getTime() / 1000;
     })();
  return BigInt(ret);
  };

  
  
  
  
  
  
  
  
  
  function __mmap_js(len, prot, flags, fd, offset, allocated, addr) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(43, 0, 1, len, prot, flags, fd, offset, allocated, addr);
  
    len = bigintToI53Checked(len);
    offset = bigintToI53Checked(offset);
    allocated = bigintToI53Checked(allocated);
    addr = bigintToI53Checked(addr);
  
  
  try {
  
      // musl's mmap doesn't allow values over a certain limit
      // see OFF_MASK in mmap.c.
      assert(!isNaN(offset));
      var stream = SYSCALLS.getStreamFromFD(fd);
      var res = FS.mmap(stream, len, offset, prot, flags);
      var ptr = res.ptr;
      HEAP32[((allocated)/4)] = res.allocated;
      HEAPU64[((addr)/8)] = BigInt(ptr);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  function __msync_js(addr, len, prot, flags, fd, offset) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(44, 0, 1, addr, len, prot, flags, fd, offset);
  
    addr = bigintToI53Checked(addr);
    len = bigintToI53Checked(len);
    offset = bigintToI53Checked(offset);
  
  
  try {
  
      if (isNaN(offset)) return -22;
      SYSCALLS.doMsync(addr, SYSCALLS.getStreamFromFD(fd), len, flags, offset);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  function __munmap_js(addr, len, prot, flags, fd, offset) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(45, 0, 1, addr, len, prot, flags, fd, offset);
  
    addr = bigintToI53Checked(addr);
    len = bigintToI53Checked(len);
    offset = bigintToI53Checked(offset);
  
  
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      if (prot & 2) {
        SYSCALLS.doMsync(addr, stream, len, flags, offset);
      }
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  
  }
  

  
  
  
  
  var __tzset_js = function(timezone, daylight, std_name, dst_name) {
    timezone = bigintToI53Checked(timezone);
    daylight = bigintToI53Checked(daylight);
    std_name = bigintToI53Checked(std_name);
    dst_name = bigintToI53Checked(dst_name);
  
  
      // TODO: Use (malleable) environment variables instead of system settings.
      var currentYear = new Date().getFullYear();
      var winter = new Date(currentYear, 0, 1);
      var summer = new Date(currentYear, 6, 1);
      var winterOffset = winter.getTimezoneOffset();
      var summerOffset = summer.getTimezoneOffset();
  
      // Local standard timezone offset. Local standard time is not adjusted for
      // daylight savings.  This code uses the fact that getTimezoneOffset returns
      // a greater value during Standard Time versus Daylight Saving Time (DST).
      // Thus it determines the expected output during Standard Time, and it
      // compares whether the output of the given date the same (Standard) or less
      // (DST).
      var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  
      // timezone is specified as seconds west of UTC ("The external variable
      // `timezone` shall be set to the difference, in seconds, between
      // Coordinated Universal Time (UTC) and local standard time."), the same
      // as returned by stdTimezoneOffset.
      // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
      HEAPU64[((timezone)/8)] = BigInt(stdTimezoneOffset * 60);
  
      HEAP32[((daylight)/4)] = Number(winterOffset != summerOffset);
  
      var extractZone = (timezoneOffset) => {
        // Why inverse sign?
        // Read here https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
        var sign = timezoneOffset >= 0 ? '-' : '+';
  
        var absOffset = Math.abs(timezoneOffset)
        var hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
        var minutes = String(absOffset % 60).padStart(2, '0');
  
        return `UTC${sign}${hours}${minutes}`;
      }
  
      var winterName = extractZone(winterOffset);
      var summerName = extractZone(summerOffset);
      assert(winterName);
      assert(summerName);
      assert(lengthBytesUTF8(winterName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${winterName})`);
      assert(lengthBytesUTF8(summerName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${summerName})`);
      if (summerOffset < winterOffset) {
        // Northern hemisphere
        stringToUTF8(winterName, std_name, 17);
        stringToUTF8(summerName, dst_name, 17);
      } else {
        stringToUTF8(winterName, dst_name, 17);
        stringToUTF8(summerName, std_name, 17);
      }
    ;
  };

  var _emscripten_get_now = () => performance.timeOrigin + performance.now();
  
  var _emscripten_date_now = () => Date.now();
  
  var nowIsMonotonic = 1;
  
  var checkWasiClock = (clock_id) => clock_id >= 0 && clock_id <= 3;
  
  
  function _clock_time_get(clk_id, ignored_precision, ptime) {
    ignored_precision = bigintToI53Checked(ignored_precision);
    ptime = bigintToI53Checked(ptime);
  
  
      if (!checkWasiClock(clk_id)) {
        return 28;
      }
      var now;
      // all wasi clocks but realtime are monotonic
      if (clk_id === 0) {
        now = _emscripten_date_now();
      } else if (nowIsMonotonic) {
        now = _emscripten_get_now();
      } else {
        return 52;
      }
      // "now" is in ms, and wasi times are in ns.
      var nsec = Math.round(now * 1000 * 1000);
      HEAP64[((ptime)/8)] = BigInt(nsec);
      return 0;
    ;
  }

  var readEmAsmArgsArray = [];
  
  
  
  
  
  var readEmAsmArgs = (sigPtr, buf) => {
      // Nobody should have mutated _readEmAsmArgsArray underneath us to be something else than an array.
      assert(Array.isArray(readEmAsmArgsArray));
      // The input buffer is allocated on the stack, so it must be stack-aligned.
      assert(buf % 16 == 0);
      readEmAsmArgsArray.length = 0;
      var ch;
      // Most arguments are i32s, so shift the buffer pointer so it is a plain
      // index into HEAP32.
      while (ch = HEAPU8[sigPtr++]) {
        var chr = String.fromCharCode(ch);
        var validChars = ['d', 'f', 'i', 'p'];
        // In WASM_BIGINT mode we support passing i64 values as bigint.
        validChars.push('j');
        assert(validChars.includes(chr), `Invalid character ${ch}("${chr}") in readEmAsmArgs! Use only [${validChars}], and do not specify "v" for void return argument.`);
        // Floats are always passed as doubles, so all types except for 'i'
        // are 8 bytes and require alignment.
        var wide = (ch != 105);
        buf += wide && (buf % 8) ? 4 : 0;
        readEmAsmArgsArray.push(
          // Special case for pointers under wasm64 or CAN_ADDRESS_2GB mode.
          ch == 112 ? Number(HEAPU64[((buf)/8)]) :
          ch == 106 ? HEAP64[((buf)/8)] :
          ch == 105 ?
            HEAP32[((buf)/4)] :
            HEAPF64[((buf)/8)]
        );
        buf += wide ? 8 : 4;
      }
      return readEmAsmArgsArray;
    };
  var runEmAsmFunction = (code, sigPtr, argbuf) => {
      var args = readEmAsmArgs(sigPtr, argbuf);
      assert(ASM_CONSTS.hasOwnProperty(code), `No EM_ASM constant found at address ${code}.  The loaded WebAssembly file is likely out of sync with the generated JavaScript.`);
      return ASM_CONSTS[code](...args);
    };
  
  function _emscripten_asm_const_int(code, sigPtr, argbuf) {
    code = bigintToI53Checked(code);
    sigPtr = bigintToI53Checked(sigPtr);
    argbuf = bigintToI53Checked(argbuf);
  
  
      return runEmAsmFunction(code, sigPtr, argbuf);
    ;
  }

  
  var _emscripten_check_blocking_allowed = () => {
  
      if (ENVIRONMENT_IS_WORKER) return; // Blocking in a worker/pthread is fine.
  
      warnOnce('Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread');
  
    };


  
  function _emscripten_err(str) {
    str = bigintToI53Checked(str);
  
  return err(UTF8ToString(str));
  }

  var _emscripten_exit_with_live_runtime = () => {
      runtimeKeepalivePush();
      throw 'unwind';
    };

  var runAndAbortIfError = (func) => {
      try {
        return func();
      } catch (e) {
        abort(e);
      }
    };
  
  
  var createNamedFunction = (name, func) => Object.defineProperty(func, 'name', { value: name });
  
  
  
  
  
  
  
  
  var Asyncify = {
  rewindArguments:new Map,
  instrumentWasmImports(imports) {
        var importPattern = /^(ffi_call_js|invoke_.*|__asyncjs__.*)$/;
  
        for (let [x, original] of Object.entries(imports)) {
          if (typeof original == 'function') {
            let isAsyncifyImport = original.isAsync || importPattern.test(x);
            imports[x] = (...args) => {
              var originalAsyncifyState = Asyncify.state;
              try {
                return original(...args);
              } finally {
                // Only asyncify-declared imports are allowed to change the
                // state.
                // Changing the state from normal to disabled is allowed (in any
                // function) as that is what shutdown does (and we don't have an
                // explicit list of shutdown imports).
                var changedToDisabled =
                      originalAsyncifyState === Asyncify.State.Normal &&
                      Asyncify.state        === Asyncify.State.Disabled;
                // invoke_* functions are allowed to change the state if we do
                // not ignore indirect calls.
                var ignoredInvoke = x.startsWith('invoke_') &&
                                    true;
                if (Asyncify.state !== originalAsyncifyState &&
                    !isAsyncifyImport &&
                    !changedToDisabled &&
                    !ignoredInvoke) {
                  abort(`import ${x} was not in ASYNCIFY_IMPORTS, but changed the state`);
                }
              }
            };
          }
        }
      },
  saveRewindArguments(func, passedArguments) {
        return Asyncify.rewindArguments.set(func, Array.from(passedArguments));
      },
  restoreRewindArguments(func) {
        assert(Asyncify.rewindArguments.has(func));
        return Asyncify.rewindArguments.get(func);
      },
  instrumentFunction(original) {
        var wrapper = (...args) => {
          Asyncify.exportCallStack.push(original);
          try {
            Asyncify.saveRewindArguments(original, args);
            return original(...args);
          } finally {
            if (!ABORT) {
              var top = Asyncify.exportCallStack.pop();
              assert(top === original);
              Asyncify.maybeStopUnwind();
            }
          }
        };
        Asyncify.funcWrappers.set(original, wrapper);
        wrapper = createNamedFunction(`__asyncify_wrapper_${original.name}`, wrapper);
        return wrapper;
      },
  instrumentWasmExports(exports) {
        var ret = {};
        for (let [x, original] of Object.entries(exports)) {
          if (typeof original == 'function') {
            var wrapper = Asyncify.instrumentFunction(original);
            ret[x] = wrapper;
          } else {
            ret[x] = original;
          }
        }
        return ret;
      },
  State:{
  Normal:0,
  Unwinding:1,
  Rewinding:2,
  Disabled:3,
  },
  state:0,
  StackSize:4096,
  currData:null,
  handleSleepReturnValue:0,
  exportCallStack:[],
  callstackFuncToId:new Map,
  callStackIdToFunc:new Map,
  funcWrappers:new Map,
  callStackId:0,
  asyncPromiseHandlers:null,
  sleepCallbacks:[],
  getCallStackId(func) {
        assert(func);
        if (!Asyncify.callstackFuncToId.has(func)) {
          var id = Asyncify.callStackId++;
          Asyncify.callstackFuncToId.set(func, id);
          Asyncify.callStackIdToFunc.set(id, func);
        }
        return Asyncify.callstackFuncToId.get(func);
      },
  maybeStopUnwind() {
        if (Asyncify.currData &&
            Asyncify.state === Asyncify.State.Unwinding &&
            !Asyncify.exportCallStack.length) {
          // We just finished unwinding.
          // Be sure to set the state before calling any other functions to avoid
          // possible infinite recursion here (For example in debug pthread builds
          // the dbg() function itself can call back into WebAssembly to get the
          // current pthread_self() pointer).
          Asyncify.state = Asyncify.State.Normal;
          runtimeKeepalivePush();
          // Keep the runtime alive so that a re-wind can be done later.
          runAndAbortIfError(_asyncify_stop_unwind);
          if (typeof Fibers != 'undefined') {
            Fibers.trampoline();
          }
        }
      },
  whenDone() {
        assert(Asyncify.currData, 'tried to wait for an async operation when none is in progress');
        assert(!Asyncify.asyncPromiseHandlers, 'cannot have multiple async operations in flight at once');
        return new Promise((resolve, reject) => {
          Asyncify.asyncPromiseHandlers = { resolve, reject };
        });
      },
  allocateData() {
        // An asyncify data structure has three fields:
        //  0  current stack pos
        //  4  max stack pos
        //  8  id of function at bottom of the call stack (callStackIdToFunc[id] == wasm func)
        //
        // The Asyncify ABI only interprets the first two fields, the rest is for the runtime.
        // We also embed a stack in the same memory region here, right next to the structure.
        // This struct is also defined as asyncify_data_t in emscripten/fiber.h
        var ptr = _malloc(24 + Asyncify.StackSize);
        Asyncify.setDataHeader(ptr, ptr + 24, Asyncify.StackSize);
        Asyncify.setDataRewindFunc(ptr);
        return ptr;
      },
  setDataHeader(ptr, stack, stackSize) {
        HEAPU64[((ptr)/8)] = BigInt(stack);
        HEAPU64[(((ptr)+(8))/8)] = BigInt(stack + stackSize);
      },
  setDataRewindFunc(ptr) {
        var bottomOfCallStack = Asyncify.exportCallStack[0];
        assert(bottomOfCallStack, 'exportCallStack is empty');
        var rewindId = Asyncify.getCallStackId(bottomOfCallStack);
        HEAP32[(((ptr)+(16))/4)] = rewindId;
      },
  getDataRewindFunc(ptr) {
        var id = HEAP32[(((ptr)+(16))/4)];
        var func = Asyncify.callStackIdToFunc.get(id);
        assert(func, `id ${id} not found in callStackIdToFunc`);
        return func;
      },
  doRewind(ptr) {
        var original = Asyncify.getDataRewindFunc(ptr);
        var func = Asyncify.funcWrappers.get(original);
        assert(original);
        assert(func);
        // Once we have rewound and the stack we no longer need to artificially
        // keep the runtime alive.
        runtimeKeepalivePop();
        // When re-winding, the arguments to a function are ignored.  For i32 arguments we
        // can just call the function with no args at all since the engine will produce zeros
        // for all arguments.  However, for i64 arguments we get `undefined cannot be converted to
        // BigInt`.
        func = func.bind(0, ...Asyncify.restoreRewindArguments(original));
        return callUserCallback(func);
      },
  handleSleep(startAsync) {
        assert(Asyncify.state !== Asyncify.State.Disabled, 'handleSleep called after Asyncify was shut down');
        if (ABORT) return;
        if (Asyncify.state === Asyncify.State.Normal) {
          // Prepare to sleep. Call startAsync, and see what happens:
          // if the code decided to call our callback synchronously,
          // then no async operation was in fact begun, and we don't
          // need to do anything.
          var reachedCallback = false;
          var reachedAfterCallback = false;
          startAsync((handleSleepReturnValue = 0) => {
            // old emterpretify API supported other stuff
            assert(['undefined', 'number', 'boolean', 'bigint'].includes(typeof handleSleepReturnValue), `invalid type for handleSleepReturnValue: '${typeof handleSleepReturnValue}'`);
            if (ABORT) return;
            Asyncify.handleSleepReturnValue = handleSleepReturnValue;
            reachedCallback = true;
            if (!reachedAfterCallback) {
              // We are happening synchronously, so no need for async.
              return;
            }
            // This async operation did not happen synchronously, so we did
            // unwind. In that case there can be no compiled code on the stack,
            // as it might break later operations (we can rewind ok now, but if
            // we unwind again, we would unwind through the extra compiled code
            // too).
            assert(!Asyncify.exportCallStack.length, 'waking up (starting to rewind) must be done from JS, without compiled code on the stack');
            Asyncify.state = Asyncify.State.Rewinding;
            runAndAbortIfError(() => _asyncify_start_rewind(Asyncify.currData));
            if (typeof MainLoop != 'undefined' && MainLoop.func) {
              MainLoop.resume();
            }
            var asyncWasmReturnValue, isError = false;
            try {
              asyncWasmReturnValue = Asyncify.doRewind(Asyncify.currData);
            } catch (err) {
              asyncWasmReturnValue = err;
              isError = true;
            }
            // Track whether the return value was handled by any promise handlers.
            var handled = false;
            if (!Asyncify.currData) {
              // All asynchronous execution has finished.
              // `asyncWasmReturnValue` now contains the final
              // return value of the exported async WASM function.
              //
              // Note: `asyncWasmReturnValue` is distinct from
              // `Asyncify.handleSleepReturnValue`.
              // `Asyncify.handleSleepReturnValue` contains the return
              // value of the last C function to have executed
              // `Asyncify.handleSleep()`, whereas `asyncWasmReturnValue`
              // contains the return value of the exported WASM function
              // that may have called C functions that
              // call `Asyncify.handleSleep()`.
              var asyncPromiseHandlers = Asyncify.asyncPromiseHandlers;
              if (asyncPromiseHandlers) {
                Asyncify.asyncPromiseHandlers = null;
                (isError ? asyncPromiseHandlers.reject : asyncPromiseHandlers.resolve)(asyncWasmReturnValue);
                handled = true;
              }
            }
            if (isError && !handled) {
              // If there was an error and it was not handled by now, we have no choice but to
              // rethrow that error into the global scope where it can be caught only by
              // `onerror` or `onunhandledpromiserejection`.
              throw asyncWasmReturnValue;
            }
          });
          reachedAfterCallback = true;
          if (!reachedCallback) {
            // A true async operation was begun; start a sleep.
            Asyncify.state = Asyncify.State.Unwinding;
            // TODO: reuse, don't alloc/free every sleep
            Asyncify.currData = Asyncify.allocateData();
            if (typeof MainLoop != 'undefined' && MainLoop.func) {
              MainLoop.pause();
            }
            runAndAbortIfError(() => _asyncify_start_unwind(Asyncify.currData));
          }
        } else if (Asyncify.state === Asyncify.State.Rewinding) {
          // Stop a resume.
          Asyncify.state = Asyncify.State.Normal;
          runAndAbortIfError(_asyncify_stop_rewind);
          _free(Asyncify.currData);
          Asyncify.currData = null;
          // Call all sleep callbacks now that the sleep-resume is all done.
          Asyncify.sleepCallbacks.forEach(callUserCallback);
        } else {
          abort(`invalid state: ${Asyncify.state}`);
        }
        return Asyncify.handleSleepReturnValue;
      },
  handleAsync:(startAsync) => Asyncify.handleSleep(async (wakeUp) => {
        // TODO: add error handling as a second param when handleSleep implements it.
        wakeUp(await startAsync());
      }),
  };
  
  
  
  
  var Fibers = {
  nextFiber:0,
  trampolineRunning:false,
  trampoline() {
        if (!Fibers.trampolineRunning && Fibers.nextFiber) {
          Fibers.trampolineRunning = true;
          do {
            var fiber = Fibers.nextFiber;
            Fibers.nextFiber = 0;
            Fibers.finishContextSwitch(fiber);
          } while (Fibers.nextFiber);
          Fibers.trampolineRunning = false;
        }
      },
  finishContextSwitch(newFiber) {
        var stack_base = Number(HEAPU64[((newFiber)/8)]);
        var stack_max =  Number(HEAPU64[(((newFiber)+(8))/8)]);
        _emscripten_stack_set_limits(stack_base, stack_max);
  
        stackRestore(Number(HEAPU64[(((newFiber)+(16))/8)]));
  
        var entryPoint = Number(HEAPU64[(((newFiber)+(24))/8)]);
  
        if (entryPoint) {
          writeStackCookie();
          Asyncify.currData = null;
          HEAPU64[(((newFiber)+(24))/8)] = 0n;
  
          var userData = Number(HEAPU64[(((newFiber)+(32))/8)]);
          ((a1) => dynCall_vj(entryPoint, BigInt(a1)))(userData);
        } else {
          var asyncifyData = newFiber + 40;
          Asyncify.currData = asyncifyData;
  
          Asyncify.state = Asyncify.State.Rewinding;
          _asyncify_start_rewind(asyncifyData);
          Asyncify.doRewind(asyncifyData);
        }
      },
  };
  
  
  
  function _emscripten_fiber_swap(oldFiber, newFiber) {
    oldFiber = bigintToI53Checked(oldFiber);
    newFiber = bigintToI53Checked(newFiber);
  
  
      if (ABORT) return;
      if (Asyncify.state === Asyncify.State.Normal) {
        Asyncify.state = Asyncify.State.Unwinding;
  
        var asyncifyData = oldFiber + 40;
        Asyncify.setDataRewindFunc(asyncifyData);
        Asyncify.currData = asyncifyData;
  
        _asyncify_start_unwind(asyncifyData);
  
        var stackTop = stackSave();
        HEAPU64[(((oldFiber)+(16))/8)] = BigInt(stackTop);
  
        Fibers.nextFiber = newFiber;
      } else {
        assert(Asyncify.state === Asyncify.State.Rewinding);
        Asyncify.state = Asyncify.State.Normal;
        _asyncify_stop_rewind();
        Asyncify.currData = null;
      }
    ;
  }
  _emscripten_fiber_swap.isAsync = true;

  var getHeapMax = () =>
      HEAPU8.length;
  
  var _emscripten_get_heap_max = () => BigInt(getHeapMax());;


  var _emscripten_num_logical_cores = () =>
      navigator['hardwareConcurrency'];

  var abortOnCannotGrowMemory = (requestedSize) => {
      abort(`Cannot enlarge memory arrays to size ${requestedSize} bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value ${HEAP8.length}, (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0`);
    };
  
  
  function _emscripten_resize_heap(requestedSize) {
    requestedSize = bigintToI53Checked(requestedSize);
  
  
      var oldSize = HEAPU8.length;
      abortOnCannotGrowMemory(requestedSize);
    ;
  }

  var _emscripten_runtime_keepalive_check = keepRuntimeAlive;

  
  var onExits = [];
  var addOnExit = (cb) => onExits.push(cb);
  var JSEvents = {
  removeAllEventListeners() {
        while (JSEvents.eventHandlers.length) {
          JSEvents._removeHandler(JSEvents.eventHandlers.length - 1);
        }
        JSEvents.deferredCalls = [];
      },
  inEventHandler:0,
  deferredCalls:[],
  deferCall(targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
          if (arrA.length != arrB.length) return false;
  
          for (var i = 0; i < arrA.length; i++) {
            if (arrA[i] != arrB[i]) return false;
          }
          return true;
        }
        // Test if the given call was already queued, and if so, don't add it again.
        for (var call of JSEvents.deferredCalls) {
          if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
            return;
          }
        }
        JSEvents.deferredCalls.push({
          targetFunction,
          precedence,
          argsList
        });
  
        JSEvents.deferredCalls.sort((x,y) => x.precedence - y.precedence);
      },
  removeDeferredCalls(targetFunction) {
        JSEvents.deferredCalls = JSEvents.deferredCalls.filter((call) => call.targetFunction != targetFunction);
      },
  canPerformEventHandlerRequests() {
        // Browsers that support navigator.userActivation.isActive: https://developer.mozilla.org/en-US/docs/Web/API/UserActivation/isActive
        // We are targeting modern browsers where navigator.userActivation.isActive is unconditionally supported.
        return navigator.userActivation.isActive;
      },
  runDeferredCalls() {
        if (!JSEvents.canPerformEventHandlerRequests()) {
          return;
        }
        var deferredCalls = JSEvents.deferredCalls;
        JSEvents.deferredCalls = [];
        for (var call of deferredCalls) {
          call.targetFunction(...call.argsList);
        }
      },
  eventHandlers:[],
  removeAllHandlersOnTarget:(target, eventTypeString) => {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
          if (JSEvents.eventHandlers[i].target == target &&
            (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
             JSEvents._removeHandler(i--);
           }
        }
      },
  _removeHandler(i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1);
      },
  registerOrRemoveHandler(eventHandler) {
        if (!eventHandler.target) {
          err('registerOrRemoveHandler: the target element for event handler registration does not exist, when processing the following event handler registration:');
          console.dir(eventHandler);
          return -4;
        }
        if (eventHandler.callbackfunc) {
          eventHandler.eventListenerFunc = function(event) {
            // Increment nesting count for the event handler.
            ++JSEvents.inEventHandler;
            JSEvents.currentEventHandler = eventHandler;
            // Process any old deferred calls the user has placed.
            JSEvents.runDeferredCalls();
            // Process the actual event, calls back to user C code handler.
            eventHandler.handlerFunc(event);
            // Process any new deferred calls that were placed right now from this event handler.
            JSEvents.runDeferredCalls();
            // Out of event handler - restore nesting count.
            --JSEvents.inEventHandler;
          };
  
          eventHandler.target.addEventListener(eventHandler.eventTypeString,
                                               eventHandler.eventListenerFunc,
                                               eventHandler.useCapture);
          JSEvents.eventHandlers.push(eventHandler);
        } else {
          for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == eventHandler.target
             && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
               JSEvents._removeHandler(i--);
             }
          }
        }
        return 0;
      },
  removeSingleHandler(eventHandler) {
        let success = false;
        for (let i = 0; i < JSEvents.eventHandlers.length; ++i) {
          const handler = JSEvents.eventHandlers[i];
          if (handler.target === eventHandler.target
            && handler.eventTypeId === eventHandler.eventTypeId
            && handler.callbackfunc === eventHandler.callbackfunc
            && handler.userData === eventHandler.userData) {
            // in some very rare cases (ex: Safari / fullscreen events), there is more than 1 handler (eventTypeString is different)
            JSEvents._removeHandler(i--);
            success = true;
          }
        }
        return success ? 0 : -5;
      },
  getTargetThreadForEventCallback(targetThread) {
        switch (targetThread) {
          case 1:
            // The event callback for the current event should be called on the
            // main browser thread. (0 == don't proxy)
            return 0;
          case 2:
            // The event callback for the current event should be backproxied to
            // the thread that is registering the event.
            // This can be 0 in the case that the caller uses
            // EM_CALLBACK_THREAD_CONTEXT_CALLING_THREAD but on the main thread
            // itself.
            return PThread.currentProxiedOperationCallerThread;
          default:
            // The event callback for the current event should be proxied to the
            // given specific thread.
            return targetThread;
        }
      },
  getNodeNameForTarget(target) {
        if (target == window) return '#window';
        if (target == screen) return '#screen';
        return target?.nodeName ?? '';
      },
  fullscreenEnabled() {
        return document.fullscreenEnabled
         ;
      },
  };
  
  var maybeCStringToJsString = (cString) => {
      // 'cString > 2' checks if the input is a number, and isn't of the special
      // values we accept here, EMSCRIPTEN_EVENT_TARGET_* (which map to 0, 1, 2).
      // In other words, if cString > 2 then it's a pointer to a valid place in
      // memory, and points to a C string.
      return cString > 2 ? UTF8ToString(cString) : cString;
    };
  
  /** @type {Object} */
  var specialHTMLTargets = [0, globalThis.document ?? 0, globalThis.window ?? 0];
  var findEventTarget = (target) => {
      target = maybeCStringToJsString(target);
      var domElement = specialHTMLTargets[target] || globalThis.document?.querySelector(target);
      return domElement;
    };
  
  
  
  
  
  var registerKeyEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
      var eventSize = 160;
      JSEvents.keyEvent ||= _malloc(eventSize);
  
      var keyEventHandlerFunc = (e) => {
        assert(e);
  
        var keyEventData = JSEvents.keyEvent;
        HEAPF64[((keyEventData)/8)] = e.timeStamp;
  
        var idx = ((keyEventData)/4);
  
        HEAP32[idx + 2] = e.location;
        HEAP8[keyEventData + 12] = e.ctrlKey;
        HEAP8[keyEventData + 13] = e.shiftKey;
        HEAP8[keyEventData + 14] = e.altKey;
        HEAP8[keyEventData + 15] = e.metaKey;
        HEAP8[keyEventData + 16] = e.repeat;
        HEAP32[idx + 5] = e.charCode;
        HEAP32[idx + 6] = e.keyCode;
        HEAP32[idx + 7] = e.which;
        stringToUTF8(e.key ?? '', keyEventData + 32, 32);
        stringToUTF8(e.code ?? '', keyEventData + 64, 32);
        stringToUTF8(e.char ?? '', keyEventData + 96, 32);
        stringToUTF8(e.locale ?? '', keyEventData + 128, 32);
  
        if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, keyEventData, eventSize, userData);
        else
        if (((a1, a2, a3) => dynCall_iijj(callbackfunc, a1, BigInt(a2), BigInt(a3)))(eventTypeId, keyEventData, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target: findEventTarget(target),
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: keyEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  
  
  function _emscripten_set_keydown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(46, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, 'keydown', targetThread);
  
  }
  

  
  
  
  function _emscripten_set_keyup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(47, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, 'keyup', targetThread);
  
  }
  

  
  var getBoundingClientRect = (e) => specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : {'left':0,'top':0};
  
  
  
  
  var fillMouseEventData = (eventStruct, e, target) => {
      assert(eventStruct % 4 == 0);
      HEAPF64[((eventStruct)/8)] = e.timeStamp;
      var idx = ((eventStruct)/4);
      HEAP32[idx + 2] = e.screenX;
      HEAP32[idx + 3] = e.screenY;
      HEAP32[idx + 4] = e.clientX;
      HEAP32[idx + 5] = e.clientY;
      HEAP8[eventStruct + 24] = e.ctrlKey;
      HEAP8[eventStruct + 25] = e.shiftKey;
      HEAP8[eventStruct + 26] = e.altKey;
      HEAP8[eventStruct + 27] = e.metaKey;
      HEAP16[idx*2 + 14] = e.button;
      HEAP16[idx*2 + 15] = e.buttons;
      HEAP32[idx + 8] = e.movementX;
      HEAP32[idx + 9] = e.movementY;
  
      // Note: rect contains doubles (truncated to placate SAFE_HEAP, which is the same behaviour when writing to HEAP32 anyway)
      var rect = getBoundingClientRect(target);
      HEAP32[idx + 10] = e.clientX - (rect.left | 0);
      HEAP32[idx + 11] = e.clientY - (rect.top  | 0);
    };
  
  
  var registerMouseEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
      var eventSize = 64;
      JSEvents.mouseEvent ||= _malloc(eventSize);
      target = findEventTarget(target);
  
      var mouseEventHandlerFunc = (e) => {
        // TODO: Make this access thread safe, or this could update live while app is reading it.
        fillMouseEventData(JSEvents.mouseEvent, e, target);
  
        if (targetThread) {
          __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, JSEvents.mouseEvent, eventSize, userData);
        } else
        if (((a1, a2, a3) => dynCall_iijj(callbackfunc, a1, BigInt(a2), BigInt(a3)))(eventTypeId, JSEvents.mouseEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        allowsDeferredCalls: eventTypeString != 'mousemove' && eventTypeString != 'mouseenter' && eventTypeString != 'mouseleave', // Mouse move events do not allow fullscreen/pointer lock requests to be handled in them!
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: mouseEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  
  
  function _emscripten_set_mousedown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(48, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, 'mousedown', targetThread);
  
  }
  

  
  
  
  function _emscripten_set_mousemove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(49, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, 'mousemove', targetThread);
  
  }
  

  
  
  
  function _emscripten_set_mouseup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(50, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, 'mouseup', targetThread);
  
  }
  

  var ENV = {
  };
  
  var getExecutableName = () => thisProgram;
  var getEnvStrings = () => {
      if (!getEnvStrings.strings) {
        // Default values.
        var lang = (globalThis.navigator?.language ?? 'C').replace('-', '_') + '.UTF-8';
        var env = {
          'USER': 'web_user',
          'LOGNAME': 'web_user',
          'PATH': '/',
          'PWD': '/',
          'HOME': '/home/web_user',
          'LANG': lang,
          '_': getExecutableName()
        };
        // Apply the user-provided values, if any.
        for (var x in ENV) {
          // x is a key in ENV; if ENV[x] is undefined, that means it was
          // explicitly set to be so. We allow user code to do that to
          // force variables with default values to remain unset.
          if (ENV[x] === undefined) delete env[x];
          else env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(`${x}=${env[x]}`);
        }
        getEnvStrings.strings = strings;
      }
      return getEnvStrings.strings;
    };
  
  
  
  
  
  function _environ_get(__environ, environ_buf) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(51, 0, 1, __environ, environ_buf);
  
    __environ = bigintToI53Checked(__environ);
    environ_buf = bigintToI53Checked(environ_buf);
  
  
      var bufSize = 0;
      var envp = 0;
      for (var string of getEnvStrings()) {
        var ptr = environ_buf + bufSize;
        HEAPU64[(((__environ)+(envp))/8)] = BigInt(ptr);
        bufSize += stringToUTF8(string, ptr, Infinity) + 1;
        envp += 8;
      }
      return 0;
    ;
  
  }
  

  
  
  
  
  
  function _environ_sizes_get(penviron_count, penviron_buf_size) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(52, 0, 1, penviron_count, penviron_buf_size);
  
    penviron_count = bigintToI53Checked(penviron_count);
    penviron_buf_size = bigintToI53Checked(penviron_buf_size);
  
  
      var strings = getEnvStrings();
      HEAPU64[((penviron_count)/8)] = BigInt(strings.length);
      var bufSize = 0;
      for (var string of strings) {
        bufSize += lengthBytesUTF8(string) + 1;
      }
      HEAPU64[((penviron_buf_size)/8)] = BigInt(bufSize);
      return 0;
    ;
  
  }
  


  
  
  function _fd_close(fd) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(53, 0, 1, fd);
  
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  
  }
  

  
  
  
  
  
  
  function _fd_fdstat_get(fd, pbuf) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(54, 0, 1, fd, pbuf);
  
    pbuf = bigintToI53Checked(pbuf);
  
  
  try {
  
      var rightsBase = 0;
      var rightsInheriting = 0;
      var flags = 0;
      {
        var stream = SYSCALLS.getStreamFromFD(fd);
        // All character devices are terminals (other things a Linux system would
        // assume is a character device, like the mouse, we have special APIs for).
        var type = stream.tty ? 2 :
                   FS.isDir(stream.mode) ? 3 :
                   FS.isLink(stream.mode) ? 7 :
                   4;
      }
      HEAP8[pbuf] = type;
      HEAP16[(((pbuf)+(2))/2)] = flags;
      HEAP64[(((pbuf)+(8))/8)] = BigInt(rightsBase);
      HEAP64[(((pbuf)+(16))/8)] = BigInt(rightsInheriting);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  
  }
  

  
  /** @param {number=} offset */
  var doReadv = (stream, iov, iovcnt, offset) => {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = Number(HEAPU64[((iov)/8)]);
        var len = Number(HEAPU64[(((iov)+(8))/8)]);
        iov += 16;
        try {
          var curr = FS.read(stream, HEAP8, ptr, len, offset);
        } catch (e) {
          // On a non-blocking stream a subsequent read may would-block after we
          // already gathered data. POSIX readv is a single gather-read: return
          // what we have rather than failing the whole call.
          if (ret > 0 && e instanceof FS.ErrnoError &&
              (e.errno == 6 || e.errno == 6)) {
            break;
          }
          throw e;
        }
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) break; // nothing more to read
        if (typeof offset != 'undefined') {
          offset += curr;
        }
      }
      return ret;
    };
  
  
  
  
  
  function _fd_pread(fd, iov, iovcnt, offset, pnum) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(55, 0, 1, fd, iov, iovcnt, offset, pnum);
  
    iov = bigintToI53Checked(iov);
    iovcnt = bigintToI53Checked(iovcnt);
    offset = bigintToI53Checked(offset);
    pnum = bigintToI53Checked(pnum);
  
  
  try {
  
      if (isNaN(offset)) return 22;
      var stream = SYSCALLS.getStreamFromFD(fd)
      var num = doReadv(stream, iov, iovcnt, offset);
      HEAPU64[((pnum)/8)] = BigInt(num);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  
  }
  

  
  
  /** @param {number=} offset */
  var doWritev = (stream, iov, iovcnt, offset) => {
      // Gather all iovecs into one contiguous buffer and issue a single
      // FS.write, matching POSIX writev's single gather-write semantics (as
      // __syscall_sendmsg already does). Per-iovec writes fragment a stream
      // socket send into multiple segments, breaking stream byte semantics.
      if (iovcnt == 1) {
        // Single iovec: write directly from HEAP8, no gather buffer needed.
        return FS.write(stream, HEAP8, Number(HEAPU64[((iov)/8)]), Number(HEAPU64[(((iov)+(8))/8)]), offset);
      }
      var total = 0;
      for (var i = 0, p = iov; i < iovcnt; i++, p += 16) {
        total += Number(HEAPU64[(((p)+(8))/8)]);
      }
      var view = new Uint8Array(total);
      var voff = 0;
      for (var i = 0; i < iovcnt; i++, iov += 16) {
        var ptr = Number(HEAPU64[((iov)/8)]);
        var len = Number(HEAPU64[(((iov)+(8))/8)]);
        view.set(HEAPU8.subarray(ptr, ptr + len), voff);
        voff += len;
      }
      return FS.write(stream, view, 0, total, offset);
    };
  
  
  
  
  
  function _fd_pwrite(fd, iov, iovcnt, offset, pnum) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(56, 0, 1, fd, iov, iovcnt, offset, pnum);
  
    iov = bigintToI53Checked(iov);
    iovcnt = bigintToI53Checked(iovcnt);
    offset = bigintToI53Checked(offset);
    pnum = bigintToI53Checked(pnum);
  
  
  try {
  
      if (isNaN(offset)) return 22;
      var stream = SYSCALLS.getStreamFromFD(fd)
      var num = doWritev(stream, iov, iovcnt, offset);
      HEAPU64[((pnum)/8)] = BigInt(num);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  
  }
  

  
  
  
  
  
  function _fd_read(fd, iov, iovcnt, pnum) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(57, 0, 1, fd, iov, iovcnt, pnum);
  
    iov = bigintToI53Checked(iov);
    iovcnt = bigintToI53Checked(iovcnt);
    pnum = bigintToI53Checked(pnum);
  
  
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doReadv(stream, iov, iovcnt);
      HEAPU64[((pnum)/8)] = BigInt(num);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  
  }
  

  
  
  
  
  function _fd_seek(fd, offset, whence, newOffset) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(58, 0, 1, fd, offset, whence, newOffset);
  
    offset = bigintToI53Checked(offset);
    newOffset = bigintToI53Checked(newOffset);
  
  
  try {
  
      if (isNaN(offset)) return 22;
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.llseek(stream, offset, whence);
      HEAP64[((newOffset)/8)] = BigInt(stream.position);
      if (stream.getdents && !offset && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  
  }
  

  
  var _fd_sync = 
  function(fd) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(59, 0, 2, fd);
  
    let innerFunc =  () => {
  
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var rtn = stream.stream_ops?.fsync?.(stream);
      return new Promise((resolve) => {
        var mount = stream.node.mount;
        if (mount?.type.syncfs) {
          mount.type.syncfs(mount, false, (err) => resolve(err ? 29 : 0));
        } else {
          resolve(rtn);
        }
      });
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  
  };
    if (PThread.currentProxiedOperationCallerThread) return innerFunc();
    return Asyncify.handleAsync(innerFunc);
  
  }
  ;
  _fd_sync.isAsync = true;

  
  
  
  
  
  function _fd_write(fd, iov, iovcnt, pnum) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(60, 0, 1, fd, iov, iovcnt, pnum);
  
    iov = bigintToI53Checked(iov);
    iovcnt = bigintToI53Checked(iovcnt);
    pnum = bigintToI53Checked(pnum);
  
  
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doWritev(stream, iov, iovcnt);
      HEAPU64[((pnum)/8)] = BigInt(num);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  
  }
  

  
  
  
  
  
  
  
  
  
  
  
  
  
  function _getaddrinfo(node, service, hint, out) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(61, 0, 1, node, service, hint, out);
  
    node = bigintToI53Checked(node);
    service = bigintToI53Checked(service);
    hint = bigintToI53Checked(hint);
    out = bigintToI53Checked(out);
  
  
      // Note getaddrinfo currently only returns a single addrinfo with ai_next defaulting to NULL. When NULL
      // hints are specified or ai_family set to AF_UNSPEC or ai_socktype or ai_protocol set to 0 then we
      // really should provide a linked list of suitable addrinfo values.
      var addrs = [];
      var canon = null;
      var addr = 0;
      var port = 0;
      var flags = 0;
      var family = 0;
      var type = 0;
      var proto = 0;
      var ai, last;
  
      function allocaddrinfo(family, type, proto, canon, addr, port) {
        var sa, salen, ai;
        var errno;
  
        salen = family === 10 ?
          28 :
          16;
        addr = family === 10 ?
          inetNtop6(addr) :
          inetNtop4(addr);
        sa = _malloc(salen);
        errno = writeSockaddr(sa, family, addr, port);
        assert(!errno);
  
        ai = _malloc(48);
        HEAP32[(((ai)+(4))/4)] = family;
        HEAP32[(((ai)+(8))/4)] = type;
        HEAP32[(((ai)+(12))/4)] = proto;
        HEAPU64[(((ai)+(32))/8)] = BigInt(canon);
        HEAPU64[(((ai)+(24))/8)] = BigInt(sa);
        if (family === 10) {
          HEAP32[(((ai)+(16))/4)] = 28;
        } else {
          HEAP32[(((ai)+(16))/4)] = 16;
        }
        HEAP32[(((ai)+(40))/4)] = 0;
  
        return ai;
      }
  
      if (hint) {
        flags = HEAP32[((hint)/4)];
        family = HEAP32[(((hint)+(4))/4)];
        type = HEAP32[(((hint)+(8))/4)];
        proto = HEAP32[(((hint)+(12))/4)];
      }
      if (type && !proto) {
        proto = type === 2 ? 17 : 6;
      }
      if (!type && proto) {
        type = proto === 17 ? 2 : 1;
      }
  
      // If type or proto are set to zero in hints we should really be returning multiple addrinfo values, but for
      // now default to a TCP STREAM socket so we can at least return a sensible addrinfo given NULL hints.
      if (!proto) {
        proto = 6;
      }
      if (!type) {
        type = 1;
      }
  
      if (!node && !service) {
        return -2;
      }
      if (flags & ~(1|2|4|
          1024|8|16|32)) {
        return -1;
      }
      if (hint && (HEAP32[((hint)/4)] & 2) && !node) {
        return -1;
      }
      if (flags & 32) {
        // TODO
        return -2;
      }
      if (type && type !== 1 && type !== 2) {
        return -7;
      }
      if (family !== 0 && family !== 2 && family !== 10) {
        return -6;
      }
  
      if (service) {
        service = UTF8ToString(service);
        port = parseInt(service, 10);
  
        if (isNaN(port)) {
          if (flags & 1024) {
            return -2;
          }
          // TODO support resolving well-known service names from:
          // http://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.txt
          return -8;
        }
      }
  
      if (!node) {
        if (family === 0) {
          family = 2;
        }
        if (!(flags & 1)) {
          if (family === 2) {
            addr = _htonl(2130706433);
          } else {
            addr = [0, 0, 0, _htonl(1)];
          }
        }
        ai = allocaddrinfo(family, type, proto, null, addr, port);
        HEAPU64[((out)/8)] = BigInt(ai);
        return 0;
      }
  
      //
      // try as a numeric address
      //
      node = UTF8ToString(node);
      addr = inetPton4(node);
      if (addr !== null) {
        // incoming node is a valid ipv4 address
        if (family === 0 || family === 2) {
          family = 2;
        }
        else if (family === 10 && (flags & 8)) {
          addr = [0, 0, _htonl(0xffff), addr];
          family = 10;
        } else {
          return -2;
        }
      } else {
        addr = inetPton6(node);
        if (addr !== null) {
          // incoming node is a valid ipv6 address
          if (family === 0 || family === 10) {
            family = 10;
          } else {
            return -2;
          }
        }
      }
      if (addr != null) {
        ai = allocaddrinfo(family, type, proto, node, addr, port);
        HEAPU64[((out)/8)] = BigInt(ai);
        return 0;
      }
      if (flags & 4) {
        return -2;
      }
  
      //
      // try as a hostname
      //
      // resolve the hostname to a temporary fake address
      node = DNS.lookup_name(node);
      addr = inetPton4(node);
      if (family === 0) {
        family = 2;
      } else if (family === 10) {
        addr = [0, 0, _htonl(0xffff), addr];
      }
      ai = allocaddrinfo(family, type, proto, null, addr, port);
      HEAPU64[((out)/8)] = BigInt(ai);
      return 0;
    ;
  
  }
  

  
  
  
  function _getnameinfo(sa, salen, node, nodelen, serv, servlen, flags) {
    sa = bigintToI53Checked(sa);
    node = bigintToI53Checked(node);
    serv = bigintToI53Checked(serv);
  
  
      var info = readSockaddr(sa, salen);
      if (info.errno) {
        return -6;
      }
      var port = info.port;
      var addr = info.addr;
  
      var overflowed = false;
  
      if (node && nodelen) {
        var lookup;
        if ((flags & 1) || !(lookup = DNS.lookup_addr(addr))) {
          if (flags & 8) {
            return -2;
          }
        } else {
          addr = lookup;
        }
        var numBytesWrittenExclNull = stringToUTF8(addr, node, nodelen);
  
        if (numBytesWrittenExclNull+1 >= nodelen) {
          overflowed = true;
        }
      }
  
      if (serv && servlen) {
        port = '' + port;
        var numBytesWrittenExclNull = stringToUTF8(port, serv, servlen);
  
        if (numBytesWrittenExclNull+1 >= servlen) {
          overflowed = true;
        }
      }
  
      if (overflowed) {
        // Note: even when we overflow, getnameinfo() is specced to write out the truncated results.
        return -12;
      }
  
      return 0;
    ;
  }




  
  
  var stringToUTF8OnStack = (str) => {
      var size = lengthBytesUTF8(str) + 1;
      var ret = stackAlloc(size);
      stringToUTF8(str, ret, size);
      return ret;
    };


  var wasmTableMirror = [];
  
  
  var getWasmTableEntry = (funcPtr) => {
      // Function pointers should show up as numbers, even under wasm64, but
      // we still have some places where bigint values can flow here.
      // https://github.com/emscripten-core/emscripten/issues/18200
      funcPtr = Number(funcPtr);
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        /** @suppress {checkTypes} */
        wasmTableMirror[funcPtr] = func = wasmTable.get(BigInt(funcPtr));
      }
      /** @suppress {checkTypes} */
      assert(wasmTable.get(BigInt(funcPtr)) == func, 'table mirror is out of date');
      return func;
    };

  
  var setWasmTableEntry = (idx, func) => {
      /** @suppress {checkTypes} */
      wasmTable.set(BigInt(idx), func);
      // With ABORT_ON_WASM_EXCEPTIONS wasmTable.get is overridden to return wrapped
      // functions so we need to call it here to retrieve the potential wrapper correctly
      // instead of just storing 'func' directly into wasmTableMirror
      /** @suppress {checkTypes} */
      wasmTableMirror[idx] = wasmTable.get(BigInt(idx));
    };

  var freeTableIndexes = [];
  
  var getEmptyTableSlot = () => {
      // Reuse a free index if there is one, otherwise grow.
      if (freeTableIndexes.length) {
        return freeTableIndexes.pop();
      }
      try {
        // Grow the table
        return wasmTable['grow'](1n);
      } catch (err) {
        if (!(err instanceof RangeError)) {
          throw err;
        }
        abort('Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.');
      }
    };

  var uleb128EncodeWithLen = (arr) => {
      const n = arr.length;
      assert(n < 16384);
      // Note: this LEB128 length encoding produces extra byte for n < 128,
      // but we don't care as it's only used in a temporary representation.
      return [(n % 128) | 128, n >> 7, ...arr];
    };
  
  
  var wasmTypeCodes = {
      'i': 0x7f, // i32
      'p': 0x7e, // i64
      'j': 0x7e, // i64
      'f': 0x7d, // f32
      'd': 0x7c, // f64
      'e': 0x6f, // externref
    };
  var generateTypePack = (types) => uleb128EncodeWithLen(Array.from(types, (type) => {
      var code = wasmTypeCodes[type];
      assert(code, `invalid signature char: ${type}`);
      return code;
    }));
  var convertJsFunctionToWasm = (func, sig) => {
      // TODO: If the type reflection proposal ever makes progress we can use
      // it here instead of creatign a new module.
      var bytes = Uint8Array.of(
        0x00, 0x61, 0x73, 0x6d, // magic ("\0asm")
        0x01, 0x00, 0x00, 0x00, // version: 1
        0x01, // Type section code
          // The module is static, with the exception of the type section, which is
          // generated based on the signature passed in.
          ...uleb128EncodeWithLen([
            0x01, // count: 1
            0x60 /* form: func */,
            // param types
            ...generateTypePack(sig.slice(1)),
            // return types (for now only supporting [] if `void` and single [T] otherwise)
            ...generateTypePack(sig[0] === 'v' ? '' : sig[0])
          ]),
        // The rest of the module is static
        0x02, 0x07, // import section
          // (import "e" "f" (func 0 (type 0)))
          0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
        0x07, 0x05, // export section
          // (export "f" (func 0 (type 0)))
          0x01, 0x01, 0x66, 0x00, 0x00,
      );
  
      // We can compile this wasm module synchronously because it is very small.
      // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
      var module = new WebAssembly.Module(bytes);
      var instance = new WebAssembly.Instance(module, { 'e': { 'f': func } });
      var wrappedFunc = instance.exports['f'];
      return wrappedFunc;
    };












  /** @type {!Float32Array} */
  var HEAPF32;













  
  var updateTableMap = (offset, count) => {
      if (functionsInTableMap) {
        for (var i = offset; i < offset + count; i++) {
          var item = getWasmTableEntry(i);
          // Ignore null values.
          if (item) {
            functionsInTableMap.set(item, i);
          }
        }
      }
    };
  
  var functionsInTableMap;
  
  var getFunctionAddress = (func) => {
      // First, create the map if this is the first use.
      if (!functionsInTableMap) {
        functionsInTableMap = new WeakMap();
        updateTableMap(0, Number(wasmTable.length));
      }
      return functionsInTableMap.get(func) || 0;
    };
  
  
  
  
  /** @param {string=} sig */
  var addFunction = (func, sig) => {
      assert(typeof func != 'undefined');
      // Check if the function is already in the table, to ensure each function
      // gets a unique index.
      var rtn = getFunctionAddress(func);
      if (rtn) {
        return rtn;
      }
  
      // It's not in the table, add it now.
  
      var ret = getEmptyTableSlot();
  
      // Set the new value.
      try {
        // Attempting to call this with JS function will cause table.set() to fail
        setWasmTableEntry(ret, func);
      } catch (err) {
        if (!(err instanceof TypeError)) {
          throw err;
        }
        assert(typeof sig != 'undefined', 'Missing signature argument to addFunction: ' + func);
        var wrapped = convertJsFunctionToWasm(func, sig);
        setWasmTableEntry(ret, wrapped);
      }
  
      functionsInTableMap.set(func, ret);
  
      return ret;
    };

  
  
  
  
  var removeFunction = (index) => {
      functionsInTableMap.delete(getWasmTableEntry(index));
      setWasmTableEntry(index, null);
      freeTableIndexes.push(index);
    };




  var FS_createPath = (...args) => FS.createPath(...args);



  var FS_unlink = (...args) => FS.unlink(...args);

  var FS_createLazyFile = (...args) => FS.createLazyFile(...args);

  var FS_createDevice = (...args) => FS.createDevice(...args);


PThread.init();;

  FS.createPreloadedFile = FS_createPreloadedFile;
  FS.preloadFile = FS_preloadFile;
  FS.staticInit();;
// End JS library code

// include: postlibrary.js
// This file is included after the automatically-generated JS library code
// but before the wasm module is created.

{
  // With WASM_ESM_INTEGRATION this has to happen at the top level and not
  // delayed until processModuleArgs.
  initMemory();

  // Begin ATMODULES hooks
  
if (Module['print']) out = Module['print'];
if (Module['printErr']) err = Module['printErr'];
  // End ATMODULES hooks

  checkIncomingModuleAPI();

  if (Module['arguments']) programArgs = Module['arguments'];
  

  // Assertions on removed incoming Module JS APIs.
  assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['read'] == 'undefined', 'Module.read option was removed');
  assert(typeof Module['readAsync'] == 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
  assert(typeof Module['readBinary'] == 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
  assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)');
  assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
  assert(typeof Module['ENVIRONMENT'] == 'undefined', 'Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
  assert(typeof Module['STACK_SIZE'] == 'undefined', 'STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time')

}

// Begin runtime exports
  Module['addRunDependency'] = addRunDependency;
  Module['removeRunDependency'] = removeRunDependency;
  Module['addFunction'] = addFunction;
  Module['removeFunction'] = removeFunction;
  Module['FS_preloadFile'] = FS_preloadFile;
  Module['FS_unlink'] = FS_unlink;
  Module['FS_createPath'] = FS_createPath;
  Module['FS_createDevice'] = FS_createDevice;
  Module['FS'] = FS;
  Module['FS_createDataFile'] = FS_createDataFile;
  Module['FS_createLazyFile'] = FS_createLazyFile;
  Module['TTY'] = TTY;
  var missingLibrarySymbols = [
  'writeI53ToI64',
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'readI53FromI64',
  'readI53FromU64',
  'convertI32PairToI53',
  'convertI32PairToI53Checked',
  'convertU32PairToI53',
  'getTempRet0',
  'setTempRet0',
  'growMemory',
  'withStackSave',
  'runMainThreadEmAsm',
  'jstoi_q',
  'autoResumeAudioContext',
  'getDynCaller',
  'asmjsMangle',
  'HandleAllocator',
  'addOnInit',
  'addOnPostCtor',
  'addOnPreMain',
  'addOnPostRun',
  'STACK_SIZE',
  'STACK_ALIGN',
  'POINTER_SIZE',
  'ASSERTIONS',
  'ccall',
  'cwrap',
  'setValue',
  'getValue',
  'intArrayToString',
  'AsciiToString',
  'stringToAscii',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'stringToNewUTF8',
  'writeArrayToMemory',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'callCanvasResizedCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'setLetterbox',
  'currentFullscreenStrategy',
  'softFullscreenResizeWebGLRenderTarget',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'registerPointerlockErrorEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'registerBatteryEventCallback',
  'setCanvasElementSizeCallingThread',
  'setCanvasElementSizeMainThread',
  'setCanvasElementSize',
  'getCanvasSizeCallingThread',
  'getCanvasSizeMainThread',
  'getCanvasElementSize',
  'jsStackTrace',
  'getCallstack',
  'convertPCtoSourceLocation',
  'wasiRightsToMuslOFlags',
  'wasiOFlagsToMuslOFlags',
  'safeSetTimeout',
  'setImmediateWrapped',
  'safeRequestAnimationFrame',
  'clearImmediateWrapped',
  'registerPostMainLoop',
  'registerPreMainLoop',
  'getPromise',
  'makePromise',
  'addPromise',
  'idsToPromises',
  'makePromiseCallback',
  'Browser_asyncPrepareDataCounter',
  'arraySum',
  'addDays',
  'FS_mkdirTree',
  '_setNetworkCallback',
  'heapObjectForWebGLType',
  'toTypedArrayIndex',
  'webgl_enable_ANGLE_instanced_arrays',
  'webgl_enable_OES_vertex_array_object',
  'webgl_enable_WEBGL_draw_buffers',
  'webgl_enable_WEBGL_multi_draw',
  'webgl_enable_EXT_polygon_offset_clamp',
  'webgl_enable_EXT_clip_control',
  'webgl_enable_WEBGL_polygon_mode',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'colorChannelsInGlTextureFormat',
  'emscriptenWebGLGetTexPixelData',
  'emscriptenWebGLGetUniform',
  'webglGetProgramUniformLocation',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  '__glGetActiveAttribOrUniform',
  'writeGLArray',
  'emscripten_webgl_destroy_context_before_on_calling_thread',
  'registerWebGlEventCallback',
  'writeStringToMemory',
  'writeAsciiToMemory',
  'allocateUTF8',
  'allocateUTF8OnStack',
  'stackTrace',
  'getNativeTypeSize',
  'proxyToMainThreadPtr',
];
missingLibrarySymbols.forEach(missingLibrarySymbol)

  var unexportedSymbols = [
  'run',
  'out',
  'err',
  'callMain',
  'abort',
  'wasmExports',
  'writeStackCookie',
  'checkStackCookie',
  'INT53_MAX',
  'INT53_MIN',
  'bigintToI53Checked',
  'HEAP8',
  'HEAP16',
  'HEAPU16',
  'HEAP32',
  'HEAPU32',
  'HEAPF32',
  'HEAPF64',
  'HEAP64',
  'HEAPU64',
  'stackSave',
  'stackRestore',
  'stackAlloc',
  'createNamedFunction',
  'ptrToString',
  'zeroMemory',
  'exitJS',
  'getHeapMax',
  'abortOnCannotGrowMemory',
  'ENV',
  'ERRNO_CODES',
  'strError',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'DNS',
  'Protocols',
  'Sockets',
  'timers',
  'warnOnce',
  'readEmAsmArgsArray',
  'readEmAsmArgs',
  'runEmAsmFunction',
  'getExecutableName',
  'dynCallLegacy',
  'dynCall',
  'handleException',
  'keepRuntimeAlive',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'callUserCallback',
  'maybeExit',
  'asyncLoad',
  'alignMemory',
  'mmapAlloc',
  'wasmTable',
  'wasmMemory',
  'getUniqueRunDependency',
  'noExitRuntime',
  'addOnPreRun',
  'addOnExit',
  'convertJsFunctionToWasm',
  'freeTableIndexes',
  'functionsInTableMap',
  'getEmptyTableSlot',
  'updateTableMap',
  'getFunctionAddress',
  'PATH',
  'PATH_FS',
  'UTF8Decoder',
  'UTF8ArrayToString',
  'UTF8ToString',
  'stringToUTF8Array',
  'stringToUTF8',
  'lengthBytesUTF8',
  'intArrayFromString',
  'UTF16Decoder',
  'stringToUTF8OnStack',
  'JSEvents',
  'registerKeyEventCallback',
  'specialHTMLTargets',
  'maybeCStringToJsString',
  'findEventTarget',
  'findCanvasEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'restoreOldWindowedStyle',
  'UNWIND_CACHE',
  'ExitStatus',
  'getEnvStrings',
  'checkWasiClock',
  'doReadv',
  'doWritev',
  'initRandomFill',
  'randomFill',
  'emSetImmediate',
  'emClearImmediate_deps',
  'emClearImmediate',
  'promiseMap',
  'Browser',
  'requestFullscreen',
  'setCanvasSize',
  'getUserMedia',
  'createContext',
  'getPreloadedImageData__data',
  'wget',
  'MONTH_DAYS_REGULAR',
  'MONTH_DAYS_LEAP',
  'MONTH_DAYS_REGULAR_CUMULATIVE',
  'MONTH_DAYS_LEAP_CUMULATIVE',
  'isLeapYear',
  'ydayFromDate',
  'SYSCALLS',
  'getSocketFromFD',
  'getSocketAddress',
  'preloadPlugins',
  'FS_createPreloadedFile',
  'FS_modeStringToFlags',
  'FS_getMode',
  'FS_fileDataToTypedArray',
  'FS_stdin_getChar_buffer',
  'FS_stdin_getChar',
  'FS_readFile',
  'FS_root',
  'FS_mounts',
  'FS_devices',
  'FS_streams',
  'FS_nextInode',
  'FS_nameTable',
  'FS_currentPath',
  'FS_initialized',
  'FS_ignorePermissions',
  'FS_filesystems',
  'FS_syncFSRequests',
  'FS_lookupPath',
  'FS_getPath',
  'FS_hashName',
  'FS_hashAddNode',
  'FS_hashRemoveNode',
  'FS_lookupNode',
  'FS_createNode',
  'FS_destroyNode',
  'FS_isRoot',
  'FS_isMountpoint',
  'FS_isFile',
  'FS_isDir',
  'FS_isLink',
  'FS_isChrdev',
  'FS_isBlkdev',
  'FS_isFIFO',
  'FS_isSocket',
  'FS_flagsToPermissionString',
  'FS_nodePermissions',
  'FS_mayLookup',
  'FS_mayCreate',
  'FS_mayDelete',
  'FS_mayOpen',
  'FS_checkOpExists',
  'FS_nextfd',
  'FS_getStreamChecked',
  'FS_getStream',
  'FS_createStream',
  'FS_closeStream',
  'FS_dupStream',
  'FS_doSetAttr',
  'FS_chrdev_stream_ops',
  'FS_major',
  'FS_minor',
  'FS_makedev',
  'FS_registerDevice',
  'FS_getDevice',
  'FS_getMounts',
  'FS_syncfs',
  'FS_mount',
  'FS_unmount',
  'FS_lookup',
  'FS_mknod',
  'FS_statfs',
  'FS_statfsStream',
  'FS_statfsNode',
  'FS_create',
  'FS_mkdir',
  'FS_mkdev',
  'FS_symlink',
  'FS_link',
  'FS_rename',
  'FS_rmdir',
  'FS_readdir',
  'FS_readlink',
  'FS_stat',
  'FS_fstat',
  'FS_lstat',
  'FS_doChmod',
  'FS_chmod',
  'FS_lchmod',
  'FS_fchmod',
  'FS_doChown',
  'FS_chown',
  'FS_lchown',
  'FS_fchown',
  'FS_doTruncate',
  'FS_truncate',
  'FS_ftruncate',
  'FS_utime',
  'FS_open',
  'FS_close',
  'FS_isClosed',
  'FS_llseek',
  'FS_read',
  'FS_write',
  'FS_mmap',
  'FS_msync',
  'FS_ioctl',
  'FS_writeFile',
  'FS_cwd',
  'FS_chdir',
  'FS_createDefaultDirectories',
  'FS_createDefaultDevices',
  'FS_createSpecialDirectories',
  'FS_createStandardStreams',
  'FS_staticInit',
  'FS_init',
  'FS_quit',
  'FS_findObject',
  'FS_analyzePath',
  'FS_createFile',
  'FS_forceLoadFile',
  'MEMFS',
  'PIPEFS',
  'SOCKFS',
  'tempFixedLengthArray',
  'miniTempWebGLFloatBuffers',
  'miniTempWebGLIntBuffers',
  'GL',
  'AL',
  'GLUT',
  'EGL',
  'GLEW',
  'IDBStore',
  'runAndAbortIfError',
  'Asyncify',
  'Fibers',
  'SDL',
  'SDL_gfx',
  'waitAsyncPolyfilled',
  'print',
  'printErr',
  'jstoi_s',
  'PThread',
  'terminateWorker',
  'cleanupThread',
  'registerTLSInit',
  'spawnThread',
  'exitOnMainThread',
  'proxyToMainThread',
  'proxiedJSCallArgs',
  'invokeEntryPoint',
  'checkMailbox',
];
unexportedSymbols.forEach(unexportedRuntimeSymbol);

  // End runtime exports
  // Begin JS library exports
  // End JS library exports

// end include: postlibrary.js


// proxiedFunctionTable specifies the list of functions that can be called
// either synchronously or asynchronously from other threads in postMessage()d
// or internally queued events. This way a pthread in a Worker can synchronously
// access e.g. the DOM on the main thread.
var proxiedFunctionTable = [
  _proc_exit,
  exitOnMainThread,
  pthreadCreateProxied,
  ___syscall_accept4,
  ___syscall_bind,
  ___syscall_chdir,
  ___syscall_connect,
  ___syscall_dup,
  ___syscall_dup3,
  ___syscall_faccessat,
  ___syscall_fallocate,
  ___syscall_fcntl64,
  ___syscall_fstat64,
  ___syscall_ftruncate64,
  ___syscall_getcwd,
  ___syscall_getdents64,
  ___syscall_getpeername,
  ___syscall_getsockname,
  ___syscall_getsockopt,
  ___syscall_getuid32,
  ___syscall_ioctl,
  ___syscall_listen,
  ___syscall_lstat64,
  ___syscall_mkdirat,
  ___syscall_newfstatat,
  ___syscall_openat,
  ___syscall_pipe2,
  ___syscall_poll,
  ___syscall_poll_nonblocking,
  ___syscall_readlinkat,
  ___syscall_recvfrom,
  ___syscall_recvmsg,
  ___syscall_renameat,
  ___syscall_rmdir,
  ___syscall_sendmsg,
  ___syscall_sendto,
  ___syscall_setsockopt,
  ___syscall_shutdown,
  ___syscall_socket,
  ___syscall_stat64,
  ___syscall_statfs64,
  ___syscall_symlinkat,
  ___syscall_unlinkat,
  __mmap_js,
  __msync_js,
  __munmap_js,
  _emscripten_set_keydown_callback_on_thread,
  _emscripten_set_keyup_callback_on_thread,
  _emscripten_set_mousedown_callback_on_thread,
  _emscripten_set_mousemove_callback_on_thread,
  _emscripten_set_mouseup_callback_on_thread,
  _environ_get,
  _environ_sizes_get,
  _fd_close,
  _fd_fdstat_get,
  _fd_pread,
  _fd_pwrite,
  _fd_read,
  _fd_seek,
  _fd_sync,
  _fd_write,
  _getaddrinfo
];

function checkIncomingModuleAPI() {
  ignoredModuleProp('ENVIRONMENT');
  ignoredModuleProp('dynamicLibraries');
  ignoredModuleProp('elementPointerLock');
  ignoredModuleProp('instantiateWasm');
  ignoredModuleProp('monitorRunDependencies');
  ignoredModuleProp('noExitRuntime');
  ignoredModuleProp('noInitialRun');
  ignoredModuleProp('onRuntimeInitialized');
  ignoredModuleProp('postRun');
  ignoredModuleProp('preInit');
  ignoredModuleProp('statusMessage');
  ignoredModuleProp('stderr');
  ignoredModuleProp('stdin');
  ignoredModuleProp('stdout');
  ignoredModuleProp('thisProgram');
  ignoredModuleProp('wasm');
  ignoredModuleProp('websocket');
  ignoredModuleProp('fetchSettings');
  ignoredModuleProp('logReadFiles');
  ignoredModuleProp('loadSplitModule');
  ignoredModuleProp('onMalloc');
  ignoredModuleProp('onRealloc');
  ignoredModuleProp('onFree');
  ignoredModuleProp('onSbrkGrow');
  ignoredModuleProp('onCOSCacheHit');
  ignoredModuleProp('onCOSCacheMiss');
  ignoredModuleProp('onCOSStore');
  ignoredModuleProp('GL_MAX_TEXTURE_IMAGE_UNITS');
  ignoredModuleProp('SDL_canPlayWithWebAudio');
  ignoredModuleProp('SDL_numSimultaneouslyQueuedBuffers');
  ignoredModuleProp('freePreloadedMediaOnUse');
  ignoredModuleProp('preinitializedWebGLContext');
  ignoredModuleProp('keyboardListeningElement');
  ignoredModuleProp('doNotCaptureKeyboard');
  ignoredModuleProp('extraStackTrace');
  ignoredModuleProp('preloadPlugins');
  ignoredModuleProp('preMainLoop');
  ignoredModuleProp('postMainLoop');
  ignoredModuleProp('forcedAspectRatio');
  ignoredModuleProp('mainScriptUrlOrBlob');
  ignoredModuleProp('onFullScreen');
  ignoredModuleProp('INITIAL_MEMORY');
  ignoredModuleProp('wasmMemory');
  ignoredModuleProp('wasmBinary');
}
var ASM_CONSTS = {
  17272112: ($0, $1, $2, $3) => { Module.printErr?.("pc110-web-frame:" + $0 + ":" + $1 + ":" + $2 + ":" + $3); }
};
function unbox_small_structs(type_ptr) { type_ptr = bigintToI53Checked(type_ptr); var type_id = HEAPU16[(type_ptr + 10 >> 1) + 0]; while (type_id === 13) { if (bigintToI53Checked(HEAPU64[(type_ptr >> 3) + 0]) > 16) { break; } var elements = bigintToI53Checked(HEAPU64[(type_ptr + 16 >> 3) + 0]); var first_element = bigintToI53Checked(HEAPU64[(elements >> 3) + 0]); if (first_element === 0) { type_id = 0; break; } else if (bigintToI53Checked(HEAPU64[(elements >> 3) + 1]) === 0) { type_ptr = first_element; type_id = HEAPU16[(first_element + 10 >> 1) + 0]; } else { break; } } return [type_ptr, type_id]; }
function ffi_call_js(cif,fn,rvalue,avalue) { cif = bigintToI53Checked(cif); fn = bigintToI53Checked(fn); rvalue = bigintToI53Checked(rvalue); avalue = bigintToI53Checked(avalue); var abi = HEAPU32[(cif >> 2) + 0]; var nargs = HEAPU32[(cif + 4 >> 2) + 0]; var nfixedargs = HEAPU32[(cif + 32 >> 2) + 0]; var arg_types_ptr = bigintToI53Checked(HEAPU64[(cif + 8 >> 3) + 0]); var flags = HEAPU32[(cif + 28 >> 2) + 0]; var rtype_unboxed = unbox_small_structs(HEAPU64[(cif + 16 >> 3) + 0]); var rtype_ptr = rtype_unboxed[0]; var rtype_id = rtype_unboxed[1]; var orig_stack_ptr = stackSave(); var cur_stack_ptr = orig_stack_ptr; var args = []; var ret_by_arg = (!!0); if (rtype_id === 15) { throw new Error('complex ret marshalling nyi'); } if (rtype_id < 0 || rtype_id > 15) { throw new Error('Unexpected rtype ' + rtype_id); } if (rtype_id === 4 || rtype_id === 13) { args.push(BigInt(rvalue)); ret_by_arg = (!!1); } for (var i = 0; i < nfixedargs; i++) { var arg_ptr = bigintToI53Checked(HEAPU64[(avalue >> 3) + i]); var arg_unboxed = unbox_small_structs(HEAPU64[(arg_types_ptr >> 3) + i]); var arg_type_ptr = arg_unboxed[0]; var arg_type_id = arg_unboxed[1]; switch (arg_type_id) { case 1: case 10: case 9: args.push(HEAPU32[(arg_ptr >> 2) + 0]); break; case 2: args.push(HEAPF32[(arg_ptr >> 2) + 0]); break; case 3: args.push(HEAPF64[(arg_ptr >> 3) + 0]); break; case 5: args.push(HEAPU8[arg_ptr + 0]); break; case 6: args.push(HEAP8[arg_ptr + 0]); break; case 7: args.push(HEAPU16[(arg_ptr >> 1) + 0]); break; case 8: args.push(HEAP16[(arg_ptr >> 1) + 0]); break; case 11: case 12: args.push(HEAPU64[(arg_ptr >> 3) + 0]); break; case 4: args.push(HEAPU64[(arg_ptr >> 3) + 0]); args.push(HEAPU64[(arg_ptr >> 3) + 1]); break; case 13: var size = bigintToI53Checked(HEAPU64[(arg_type_ptr >> 3) + 0]); var align = HEAPU16[(arg_type_ptr + 8 >> 1) + 0]; ((cur_stack_ptr -= (size)), (cur_stack_ptr &= (~((align) - 1)))); HEAP8.subarray(cur_stack_ptr, cur_stack_ptr+size).set(HEAP8.subarray(arg_ptr, arg_ptr + size)); args.push(BigInt(cur_stack_ptr)); break; case 14: args.push(HEAPU64[(arg_ptr >> 3) + 0]); break; case 15: throw new Error('complex marshalling nyi'); default: throw new Error('Unexpected type ' + arg_type_id); } } if (flags & 1) { var struct_arg_info = []; for (var i = nargs - 1; i >= nfixedargs; i--) { var arg_ptr = bigintToI53Checked(HEAPU64[(avalue >> 3) + i]); var arg_unboxed = unbox_small_structs(HEAPU64[(arg_types_ptr >> 3) + i]); var arg_type_ptr = arg_unboxed[0]; var arg_type_id = arg_unboxed[1]; switch (arg_type_id) { case 5: case 6: ((cur_stack_ptr -= (1)), (cur_stack_ptr &= (~((1) - 1)))); HEAPU8[cur_stack_ptr + 0] = HEAPU8[arg_ptr + 0]; break; case 7: case 8: ((cur_stack_ptr -= (2)), (cur_stack_ptr &= (~((2) - 1)))); HEAPU16[(cur_stack_ptr >> 1) + 0] = HEAPU16[(arg_ptr >> 1) + 0]; break; case 1: case 9: case 10: case 2: ((cur_stack_ptr -= (4)), (cur_stack_ptr &= (~((4) - 1)))); HEAPU32[(cur_stack_ptr >> 2) + 0] = HEAPU32[(arg_ptr >> 2) + 0]; break; case 3: case 11: case 12: ((cur_stack_ptr -= (8)), (cur_stack_ptr &= (~((8) - 1)))); HEAPU32[(cur_stack_ptr >> 2) + 0] = HEAPU32[(arg_ptr >> 2) + 0]; HEAPU32[(cur_stack_ptr >> 2) + 1] = HEAPU32[(arg_ptr >> 2) + 1]; break; case 4: ((cur_stack_ptr -= (16)), (cur_stack_ptr &= (~((8) - 1)))); HEAPU32[(cur_stack_ptr >> 2) + 0] = HEAPU32[(arg_ptr >> 2) + 0]; HEAPU32[(cur_stack_ptr >> 2) + 1] = HEAPU32[(arg_ptr >> 2) + 1]; HEAPU32[(cur_stack_ptr >> 2) + 2] = HEAPU32[(arg_ptr >> 2) + 2]; HEAPU32[(cur_stack_ptr >> 2) + 3] = HEAPU32[(arg_ptr >> 2) + 3]; break; case 13: ((cur_stack_ptr -= (8)), (cur_stack_ptr &= (~((8) - 1)))); struct_arg_info.push([cur_stack_ptr, arg_ptr, bigintToI53Checked(HEAPU64[(arg_type_ptr >> 3) + 0]), HEAPU16[(arg_type_ptr + 8 >> 1) + 0]]); break; case 14: ((cur_stack_ptr -= (8)), (cur_stack_ptr &= (~((8) - 1)))); HEAPU64[(cur_stack_ptr >> 3) + 0] = HEAPU64[(arg_ptr >> 3) + 0]; break; case 15: throw new Error('complex arg marshalling nyi'); default: throw new Error('Unexpected argtype ' + arg_type_id); } } args.push(BigInt(cur_stack_ptr)); for (var i = 0; i < struct_arg_info.length; i++) { var struct_info = struct_arg_info[i]; var arg_target = struct_info[0]; var arg_ptr = struct_info[1]; var size = struct_info[2]; var align = struct_info[3]; ((cur_stack_ptr -= (size)), (cur_stack_ptr &= (~((align) - 1)))); HEAP8.subarray(cur_stack_ptr, cur_stack_ptr+size).set(HEAP8.subarray(arg_ptr, arg_ptr + size)); HEAPU64[(arg_target >> 3) + 0] = BigInt(cur_stack_ptr); } } stackRestore(cur_stack_ptr); stackAlloc(0); 0; var result = getWasmTableEntry(fn).apply(null, args); stackRestore(orig_stack_ptr); if (ret_by_arg) { return; } switch (rtype_id) { case 0: break; case 1: case 9: case 10: HEAPU32[(rvalue >> 2) + 0] = result; break; case 2: HEAPF32[(rvalue >> 2) + 0] = result; break; case 3: HEAPF64[(rvalue >> 3) + 0] = result; break; case 5: case 6: HEAPU8[rvalue + 0] = result; break; case 7: case 8: HEAPU16[(rvalue >> 1) + 0] = result; break; case 11: case 12: HEAPU64[(rvalue >> 3) + 0] = result; break; case 14: HEAPU64[(rvalue >> 3) + 0] = result; break; case 15: throw new Error('complex ret marshalling nyi'); default: throw new Error('Unexpected rtype ' + rtype_id); } }
function ffi_closure_alloc_js(size,code) { size = bigintToI53Checked(size); code = bigintToI53Checked(code); var closure = _malloc(size); var index = getEmptyTableSlot(); HEAPU64[(code >> 3) + 0] = BigInt(index); HEAPU64[(closure >> 3) + 0] = BigInt(index); return BigInt(closure); }
function ffi_closure_free_js(closure) { closure = bigintToI53Checked(closure); var index = bigintToI53Checked(HEAPU64[(closure >> 3) + 0]); freeTableIndexes.push(index); _free(closure); }
function ffi_prep_closure_loc_js(closure,cif,fun,user_data,codeloc) { closure = bigintToI53Checked(closure); cif = bigintToI53Checked(cif); fun = bigintToI53Checked(fun); user_data = bigintToI53Checked(user_data); codeloc = bigintToI53Checked(codeloc); var abi = HEAPU32[(cif >> 2) + 0]; var nargs = HEAPU32[(cif + 4 >> 2) + 0]; var nfixedargs = HEAPU32[(cif + 32 >> 2) + 0]; var arg_types_ptr = bigintToI53Checked(HEAPU64[(cif + 8 >> 3) + 0]); var rtype_unboxed = unbox_small_structs(HEAPU64[(cif + 16 >> 3) + 0]); var rtype_ptr = rtype_unboxed[0]; var rtype_id = rtype_unboxed[1]; var sig; var ret_by_arg = (!!0); switch (rtype_id) { case 0: sig = 'v'; break; case 13: case 4: sig = 'v' + 'j'; ret_by_arg = (!!1); break; case 1: case 5: case 6: case 7: case 8: case 9: case 10: sig = 'i'; break; case 2: sig = 'f'; break; case 3: sig = 'd'; break; case 11: case 12: sig = 'j'; break; case 14: sig = 'j'; break; case 15: throw new Error('complex ret marshalling nyi'); default: throw new Error('Unexpected rtype ' + rtype_id); } var unboxed_arg_type_id_list = []; var unboxed_arg_type_info_list = []; for (var i = 0; i < nargs; i++) { var arg_unboxed = unbox_small_structs(HEAPU64[(arg_types_ptr >> 3) + i]); var arg_type_ptr = arg_unboxed[0]; var arg_type_id = arg_unboxed[1]; unboxed_arg_type_id_list.push(arg_type_id); unboxed_arg_type_info_list.push([bigintToI53Checked(HEAPU64[(arg_type_ptr >> 3) + 0]), HEAPU16[(arg_type_ptr + 8 >> 1) + 0]]); } for (var i = 0; i < nfixedargs; i++) { switch (unboxed_arg_type_id_list[i]) { case 1: case 5: case 6: case 7: case 8: case 9: case 10: sig += 'i'; break; case 2: sig += 'f'; break; case 3: sig += 'd'; break; case 4: sig += 'jj'; break; case 11: case 12: sig += 'j'; break; case 13: case 14: sig += 'j'; break; case 15: throw new Error('complex marshalling nyi'); default: throw new Error('Unexpected argtype ' + arg_type_id); } } if (nfixedargs < nargs) { sig += 'j'; } 0; function trampoline() { var args = Array.prototype.slice.call(arguments); var size = 0; var orig_stack_ptr = stackSave(); var cur_ptr = orig_stack_ptr; var ret_ptr; var jsarg_idx = 0; if (ret_by_arg) { ret_ptr = args[jsarg_idx++]; } else { ((cur_ptr -= (8)), (cur_ptr &= (~((8) - 1)))); ret_ptr = cur_ptr; } cur_ptr -= 8 * nargs; var args_ptr = cur_ptr; var carg_idx = 0; for (; carg_idx < nfixedargs; carg_idx++) { var cur_arg = args[jsarg_idx++]; var arg_type_info = unboxed_arg_type_info_list[carg_idx]; var arg_size = arg_type_info[0]; var arg_align = arg_type_info[1]; var arg_type_id = unboxed_arg_type_id_list[carg_idx]; switch (arg_type_id) { case 5: case 6: ((cur_ptr -= (1)), (cur_ptr &= (~((4) - 1)))); HEAPU64[(args_ptr >> 3) + carg_idx] = BigInt(cur_ptr); HEAPU8[cur_ptr + 0] = cur_arg; break; case 7: case 8: ((cur_ptr -= (2)), (cur_ptr &= (~((4) - 1)))); HEAPU64[(args_ptr >> 3) + carg_idx] = BigInt(cur_ptr); HEAPU16[(cur_ptr >> 1) + 0] = cur_arg; break; case 1: case 9: case 10: ((cur_ptr -= (4)), (cur_ptr &= (~((4) - 1)))); HEAPU64[(args_ptr >> 3) + carg_idx] = BigInt(cur_ptr); HEAPU32[(cur_ptr >> 2) + 0] = cur_arg; break; case 13: ((cur_ptr -= (arg_size)), (cur_ptr &= (~((arg_align) - 1)))); HEAP8.subarray(cur_ptr, cur_ptr + arg_size).set(HEAP8.subarray(bigintToI53Checked(cur_arg), bigintToI53Checked(cur_arg) + arg_size)); HEAPU64[(args_ptr >> 3) + carg_idx] = BigInt(cur_ptr); break; case 2: ((cur_ptr -= (4)), (cur_ptr &= (~((4) - 1)))); HEAPU64[(args_ptr >> 3) + carg_idx] = BigInt(cur_ptr); HEAPF32[(cur_ptr >> 2) + 0] = cur_arg; break; case 3: ((cur_ptr -= (8)), (cur_ptr &= (~((8) - 1)))); HEAPU64[(args_ptr >> 3) + carg_idx] = BigInt(cur_ptr); HEAPF64[(cur_ptr >> 3) + 0] = cur_arg; break; case 11: case 12: ((cur_ptr -= (8)), (cur_ptr &= (~((8) - 1)))); HEAPU64[(args_ptr >> 3) + carg_idx] = BigInt(cur_ptr); HEAPU64[(cur_ptr >> 3) + 0] = cur_arg; break; case 4: ((cur_ptr -= (16)), (cur_ptr &= (~((8) - 1)))); HEAPU64[(args_ptr >> 3) + carg_idx] = BigInt(cur_ptr); HEAPU64[(cur_ptr >> 3) + 0] = cur_arg; cur_arg = args[jsarg_idx++]; HEAPU64[(cur_ptr >> 3) + 1] = cur_arg; break; case 14: ((cur_ptr -= (8)), (cur_ptr &= (~((8) - 1)))); HEAPU64[(args_ptr >> 3) + carg_idx] = BigInt(cur_ptr); HEAPU64[(cur_ptr >> 3) + 0] = cur_arg; break; } } var varargs = bigintToI53Checked(args[args.length - 1]); for (; carg_idx < nargs; carg_idx++) { var arg_type_id = unboxed_arg_type_id_list[carg_idx]; var arg_type_info = unboxed_arg_type_info_list[carg_idx]; var arg_size = arg_type_info[0]; var arg_align = arg_type_info[1]; if (arg_type_id === 13) { var struct_ptr = bigintToI53Checked(HEAPU64[(varargs >> 3) + 0]); ((cur_ptr -= (arg_size)), (cur_ptr &= (~((arg_align) - 1)))); HEAP8.subarray(cur_ptr, cur_ptr + arg_size).set(HEAP8.subarray(struct_ptr, struct_ptr + arg_size)); HEAPU64[(args_ptr >> 3) + carg_idx] = BigInt(cur_ptr); } else { HEAPU64[(args_ptr >> 3) + carg_idx] = BigInt(varargs); } varargs += 8; } stackRestore(cur_ptr); stackAlloc(0); 0; getWasmTableEntry(HEAPU64[(closure >> 3) + 2])( HEAPU64[(closure >> 3) + 1], BigInt(ret_ptr), BigInt(args_ptr), HEAPU64[(closure >> 3) + 3] ); stackRestore(orig_stack_ptr); if (!ret_by_arg) { switch (sig[0]) { case 'i': return HEAPU32[(ret_ptr >> 2) + 0]; case 'j': return HEAPU64[(ret_ptr >> 3) + 0]; case 'd': return HEAPF64[(ret_ptr >> 3) + 0]; case 'f': return HEAPF32[(ret_ptr >> 2) + 0]; } } } try { var wasm_trampoline = convertJsFunctionToWasm(trampoline, sig); } catch(e) { return 1; } setWasmTableEntry(codeloc, wasm_trampoline); HEAPU64[(closure >> 3) + 1] = BigInt(cif); HEAPU64[(closure >> 3) + 2] = BigInt(fun); HEAPU64[(closure >> 3) + 3] = BigInt(user_data); return 0; }

// Imports from the Wasm binary.
var _ntohs = makeInvalidEarlyAccess('_ntohs');
var _htonl = makeInvalidEarlyAccess('_htonl');
var _htons = makeInvalidEarlyAccess('_htons');
var _pthread_self = makeInvalidEarlyAccess('_pthread_self');
var _strerror = makeInvalidEarlyAccess('_strerror');
var _malloc = makeInvalidEarlyAccess('_malloc');
var _free = makeInvalidEarlyAccess('_free');
var _fflush = makeInvalidEarlyAccess('_fflush');
var _main = Module['_main'] = makeInvalidEarlyAccess('_main');
var __emscripten_tls_init = makeInvalidEarlyAccess('__emscripten_tls_init');
var _emscripten_builtin_memalign = makeInvalidEarlyAccess('_emscripten_builtin_memalign');
var __emscripten_proxy_main = Module['__emscripten_proxy_main'] = makeInvalidEarlyAccess('__emscripten_proxy_main');
var _emscripten_stack_get_base = makeInvalidEarlyAccess('_emscripten_stack_get_base');
var _emscripten_stack_get_end = makeInvalidEarlyAccess('_emscripten_stack_get_end');
var __emscripten_run_callback_on_thread = makeInvalidEarlyAccess('__emscripten_run_callback_on_thread');
var __emscripten_thread_init = makeInvalidEarlyAccess('__emscripten_thread_init');
var ___set_thread_state = makeInvalidEarlyAccess('___set_thread_state');
var __emscripten_thread_crashed = makeInvalidEarlyAccess('__emscripten_thread_crashed');
var __emscripten_run_js_on_main_thread_done = makeInvalidEarlyAccess('__emscripten_run_js_on_main_thread_done');
var __emscripten_run_js_on_main_thread = makeInvalidEarlyAccess('__emscripten_run_js_on_main_thread');
var __emscripten_thread_free_data = makeInvalidEarlyAccess('__emscripten_thread_free_data');
var __emscripten_thread_exit = makeInvalidEarlyAccess('__emscripten_thread_exit');
var __emscripten_check_mailbox = makeInvalidEarlyAccess('__emscripten_check_mailbox');
var _setThrew = makeInvalidEarlyAccess('_setThrew');
var _emscripten_stack_init = makeInvalidEarlyAccess('_emscripten_stack_init');
var _emscripten_stack_set_limits = makeInvalidEarlyAccess('_emscripten_stack_set_limits');
var _emscripten_stack_get_free = makeInvalidEarlyAccess('_emscripten_stack_get_free');
var __emscripten_stack_restore = makeInvalidEarlyAccess('__emscripten_stack_restore');
var __emscripten_stack_alloc = makeInvalidEarlyAccess('__emscripten_stack_alloc');
var _emscripten_stack_get_current = makeInvalidEarlyAccess('_emscripten_stack_get_current');
var dynCall_vjj = makeInvalidEarlyAccess('dynCall_vjj');
var dynCall_v = makeInvalidEarlyAccess('dynCall_v');
var dynCall_ijji = makeInvalidEarlyAccess('dynCall_ijji');
var dynCall_jj = makeInvalidEarlyAccess('dynCall_jj');
var dynCall_vjjj = makeInvalidEarlyAccess('dynCall_vjjj');
var dynCall_vj = makeInvalidEarlyAccess('dynCall_vj');
var dynCall_vji = makeInvalidEarlyAccess('dynCall_vji');
var dynCall_ijjij = makeInvalidEarlyAccess('dynCall_ijjij');
var dynCall_ijj = makeInvalidEarlyAccess('dynCall_ijj');
var dynCall_ijjj = makeInvalidEarlyAccess('dynCall_ijjj');
var dynCall_vijj = makeInvalidEarlyAccess('dynCall_vijj');
var dynCall_vjjjj = makeInvalidEarlyAccess('dynCall_vjjjj');
var dynCall_vjjjjj = makeInvalidEarlyAccess('dynCall_vjjjjj');
var dynCall_jjj = makeInvalidEarlyAccess('dynCall_jjj');
var dynCall_ijij = makeInvalidEarlyAccess('dynCall_ijij');
var dynCall_iijj = makeInvalidEarlyAccess('dynCall_iijj');
var dynCall_vjiiii = makeInvalidEarlyAccess('dynCall_vjiiii');
var dynCall_iji = makeInvalidEarlyAccess('dynCall_iji');
var dynCall_ijiij = makeInvalidEarlyAccess('dynCall_ijiij');
var dynCall_ij = makeInvalidEarlyAccess('dynCall_ij');
var dynCall_iiii = makeInvalidEarlyAccess('dynCall_iiii');
var dynCall_vjji = makeInvalidEarlyAccess('dynCall_vjji');
var dynCall_vjjijj = makeInvalidEarlyAccess('dynCall_vjjijj');
var dynCall_i = makeInvalidEarlyAccess('dynCall_i');
var dynCall_vjjij = makeInvalidEarlyAccess('dynCall_vjjij');
var dynCall_jjjj = makeInvalidEarlyAccess('dynCall_jjjj');
var dynCall_iii = makeInvalidEarlyAccess('dynCall_iii');
var dynCall_ii = makeInvalidEarlyAccess('dynCall_ii');
var dynCall_jjij = makeInvalidEarlyAccess('dynCall_jjij');
var dynCall_vjjji = makeInvalidEarlyAccess('dynCall_vjjji');
var dynCall_ijjiii = makeInvalidEarlyAccess('dynCall_ijjiii');
var dynCall_jjjjji = makeInvalidEarlyAccess('dynCall_jjjjji');
var dynCall_ijjii = makeInvalidEarlyAccess('dynCall_ijjii');
var dynCall_jjjji = makeInvalidEarlyAccess('dynCall_jjjji');
var dynCall_vjii = makeInvalidEarlyAccess('dynCall_vjii');
var dynCall_vjij = makeInvalidEarlyAccess('dynCall_vjij');
var dynCall_j = makeInvalidEarlyAccess('dynCall_j');
var dynCall_ijijj = makeInvalidEarlyAccess('dynCall_ijijj');
var dynCall_jjji = makeInvalidEarlyAccess('dynCall_jjji');
var dynCall_vjiii = makeInvalidEarlyAccess('dynCall_vjiii');
var dynCall_vij = makeInvalidEarlyAccess('dynCall_vij');
var dynCall_vjid = makeInvalidEarlyAccess('dynCall_vjid');
var dynCall_ijiii = makeInvalidEarlyAccess('dynCall_ijiii');
var dynCall_vjijj = makeInvalidEarlyAccess('dynCall_vjijj');
var dynCall_ijiiji = makeInvalidEarlyAccess('dynCall_ijiiji');
var dynCall_ijjjij = makeInvalidEarlyAccess('dynCall_ijjjij');
var dynCall_jjii = makeInvalidEarlyAccess('dynCall_jjii');
var dynCall_ijjjjjj = makeInvalidEarlyAccess('dynCall_ijjjjjj');
var dynCall_vjiiiiii = makeInvalidEarlyAccess('dynCall_vjiiiiii');
var dynCall_jjjiii = makeInvalidEarlyAccess('dynCall_jjjiii');
var dynCall_ijijii = makeInvalidEarlyAccess('dynCall_ijijii');
var dynCall_jjjjjj = makeInvalidEarlyAccess('dynCall_jjjjjj');
var dynCall_ijii = makeInvalidEarlyAccess('dynCall_ijii');
var dynCall_vjiji = makeInvalidEarlyAccess('dynCall_vjiji');
var dynCall_vjjiii = makeInvalidEarlyAccess('dynCall_vjjiii');
var dynCall_jjjjj = makeInvalidEarlyAccess('dynCall_jjjjj');
var dynCall_vjjjii = makeInvalidEarlyAccess('dynCall_vjjjii');
var dynCall_vjjiji = makeInvalidEarlyAccess('dynCall_vjjiji');
var dynCall_ijjjj = makeInvalidEarlyAccess('dynCall_ijjjj');
var dynCall_ijjjjj = makeInvalidEarlyAccess('dynCall_ijjjjj');
var dynCall_jjiji = makeInvalidEarlyAccess('dynCall_jjiji');
var dynCall_ijjiij = makeInvalidEarlyAccess('dynCall_ijjiij');
var dynCall_jjiijj = makeInvalidEarlyAccess('dynCall_jjiijj');
var dynCall_vjjiij = makeInvalidEarlyAccess('dynCall_vjjiij');
var dynCall_vjjiiiij = makeInvalidEarlyAccess('dynCall_vjjiiiij');
var dynCall_jji = makeInvalidEarlyAccess('dynCall_jji');
var dynCall_ijiji = makeInvalidEarlyAccess('dynCall_ijiji');
var dynCall_ijjijj = makeInvalidEarlyAccess('dynCall_ijjijj');
var dynCall_vi = makeInvalidEarlyAccess('dynCall_vi');
var dynCall_vjjijjjjj = makeInvalidEarlyAccess('dynCall_vjjijjjjj');
var dynCall_ijjjji = makeInvalidEarlyAccess('dynCall_ijjjji');
var dynCall_ijjji = makeInvalidEarlyAccess('dynCall_ijjji');
var dynCall_ijjjiijj = makeInvalidEarlyAccess('dynCall_ijjjiijj');
var dynCall_vjijjj = makeInvalidEarlyAccess('dynCall_vjijjj');
var dynCall_iijjijij = makeInvalidEarlyAccess('dynCall_iijjijij');
var dynCall_ijjjiij = makeInvalidEarlyAccess('dynCall_ijjjiij');
var dynCall_iiiij = makeInvalidEarlyAccess('dynCall_iiiij');
var dynCall_jjjjjjij = makeInvalidEarlyAccess('dynCall_jjjjjjij');
var dynCall_jjjij = makeInvalidEarlyAccess('dynCall_jjjij');
var dynCall_vjjjjjj = makeInvalidEarlyAccess('dynCall_vjjjjjj');
var dynCall_jjjijij = makeInvalidEarlyAccess('dynCall_jjjijij');
var dynCall_jjijij = makeInvalidEarlyAccess('dynCall_jjijij');
var dynCall_vjiiiij = makeInvalidEarlyAccess('dynCall_vjiiiij');
var dynCall_vjiiiii = makeInvalidEarlyAccess('dynCall_vjiiiii');
var dynCall_vjiiij = makeInvalidEarlyAccess('dynCall_vjiiij');
var dynCall_vjiiiijijiji = makeInvalidEarlyAccess('dynCall_vjiiiijijiji');
var dynCall_vijjj = makeInvalidEarlyAccess('dynCall_vijjj');
var dynCall_vjjijjj = makeInvalidEarlyAccess('dynCall_vjjijjj');
var dynCall_jjjiiiijjijjj = makeInvalidEarlyAccess('dynCall_jjjiiiijjijjj');
var dynCall_vjjii = makeInvalidEarlyAccess('dynCall_vjjii');
var dynCall_ijjiiiijiiii = makeInvalidEarlyAccess('dynCall_ijjiiiijiiii');
var dynCall_vijji = makeInvalidEarlyAccess('dynCall_vijji');
var dynCall_ijjiiiij = makeInvalidEarlyAccess('dynCall_ijjiiiij');
var dynCall_jjijj = makeInvalidEarlyAccess('dynCall_jjijj');
var dynCall_ijjjjii = makeInvalidEarlyAccess('dynCall_ijjjjii');
var dynCall_iij = makeInvalidEarlyAccess('dynCall_iij');
var dynCall_ji = makeInvalidEarlyAccess('dynCall_ji');
var dynCall_vjjjjjjj = makeInvalidEarlyAccess('dynCall_vjjjjjjj');
var dynCall_iiiii = makeInvalidEarlyAccess('dynCall_iiiii');
var dynCall_vjiijj = makeInvalidEarlyAccess('dynCall_vjiijj');
var dynCall_vjjjji = makeInvalidEarlyAccess('dynCall_vjjjji');
var dynCall_vjjjjji = makeInvalidEarlyAccess('dynCall_vjjjjji');
var dynCall_vjjjjjii = makeInvalidEarlyAccess('dynCall_vjjjjjii');
var dynCall_vjjjjiii = makeInvalidEarlyAccess('dynCall_vjjjjiii');
var dynCall_ijjjjjij = makeInvalidEarlyAccess('dynCall_ijjjjjij');
var dynCall_ijjjjjjj = makeInvalidEarlyAccess('dynCall_ijjjjjjj');
var dynCall_jij = makeInvalidEarlyAccess('dynCall_jij');
var dynCall_viijjij = makeInvalidEarlyAccess('dynCall_viijjij');
var dynCall_ijijjjjj = makeInvalidEarlyAccess('dynCall_ijijjjjj');
var dynCall_ijjjjji = makeInvalidEarlyAccess('dynCall_ijjjjji');
var dynCall_ijjjjij = makeInvalidEarlyAccess('dynCall_ijjjjij');
var dynCall_ijjiiij = makeInvalidEarlyAccess('dynCall_ijjiiij');
var dynCall_jjjjjijj = makeInvalidEarlyAccess('dynCall_jjjjjijj');
var dynCall_ijjjjjjii = makeInvalidEarlyAccess('dynCall_ijjjjjjii');
var dynCall_ijjjjjijj = makeInvalidEarlyAccess('dynCall_ijjjjjijj');
var dynCall_ijjiji = makeInvalidEarlyAccess('dynCall_ijjiji');
var dynCall_jjiiiiijj = makeInvalidEarlyAccess('dynCall_jjiiiiijj');
var dynCall_jjjjjjj = makeInvalidEarlyAccess('dynCall_jjjjjjj');
var dynCall_vjiiijj = makeInvalidEarlyAccess('dynCall_vjiiijj');
var dynCall_vjijjji = makeInvalidEarlyAccess('dynCall_vjijjji');
var dynCall_ijjiiiiiii = makeInvalidEarlyAccess('dynCall_ijjiiiiiii');
var dynCall_ijjjjjii = makeInvalidEarlyAccess('dynCall_ijjjjjii');
var dynCall_iijjj = makeInvalidEarlyAccess('dynCall_iijjj');
var dynCall_jjjiij = makeInvalidEarlyAccess('dynCall_jjjiij');
var dynCall_ijdiiiii = makeInvalidEarlyAccess('dynCall_ijdiiiii');
var _asyncify_start_unwind = makeInvalidEarlyAccess('_asyncify_start_unwind');
var _asyncify_stop_unwind = makeInvalidEarlyAccess('_asyncify_stop_unwind');
var _asyncify_start_rewind = makeInvalidEarlyAccess('_asyncify_start_rewind');
var _asyncify_stop_rewind = makeInvalidEarlyAccess('_asyncify_stop_rewind');
var __indirect_function_table = makeInvalidEarlyAccess('__indirect_function_table');
var wasmTable = makeInvalidEarlyAccess('wasmTable');

function assignWasmExports(wasmExports) {
  assert(typeof wasmExports['ntohs'] != 'undefined', 'missing Wasm export: ntohs');
  assert(typeof wasmExports['htonl'] != 'undefined', 'missing Wasm export: htonl');
  assert(typeof wasmExports['htons'] != 'undefined', 'missing Wasm export: htons');
  assert(typeof wasmExports['pthread_self'] != 'undefined', 'missing Wasm export: pthread_self');
  assert(typeof wasmExports['strerror'] != 'undefined', 'missing Wasm export: strerror');
  assert(typeof wasmExports['malloc'] != 'undefined', 'missing Wasm export: malloc');
  assert(typeof wasmExports['free'] != 'undefined', 'missing Wasm export: free');
  assert(typeof wasmExports['fflush'] != 'undefined', 'missing Wasm export: fflush');
  assert(typeof wasmExports['__main_argc_argv'] != 'undefined', 'missing Wasm export: __main_argc_argv');
  assert(typeof wasmExports['_emscripten_tls_init'] != 'undefined', 'missing Wasm export: _emscripten_tls_init');
  assert(typeof wasmExports['emscripten_builtin_memalign'] != 'undefined', 'missing Wasm export: emscripten_builtin_memalign');
  assert(typeof wasmExports['_emscripten_proxy_main'] != 'undefined', 'missing Wasm export: _emscripten_proxy_main');
  assert(typeof wasmExports['emscripten_stack_get_base'] != 'undefined', 'missing Wasm export: emscripten_stack_get_base');
  assert(typeof wasmExports['emscripten_stack_get_end'] != 'undefined', 'missing Wasm export: emscripten_stack_get_end');
  assert(typeof wasmExports['_emscripten_run_callback_on_thread'] != 'undefined', 'missing Wasm export: _emscripten_run_callback_on_thread');
  assert(typeof wasmExports['_emscripten_thread_init'] != 'undefined', 'missing Wasm export: _emscripten_thread_init');
  assert(typeof wasmExports['__set_thread_state'] != 'undefined', 'missing Wasm export: __set_thread_state');
  assert(typeof wasmExports['_emscripten_thread_crashed'] != 'undefined', 'missing Wasm export: _emscripten_thread_crashed');
  assert(typeof wasmExports['_emscripten_run_js_on_main_thread_done'] != 'undefined', 'missing Wasm export: _emscripten_run_js_on_main_thread_done');
  assert(typeof wasmExports['_emscripten_run_js_on_main_thread'] != 'undefined', 'missing Wasm export: _emscripten_run_js_on_main_thread');
  assert(typeof wasmExports['_emscripten_thread_free_data'] != 'undefined', 'missing Wasm export: _emscripten_thread_free_data');
  assert(typeof wasmExports['_emscripten_thread_exit'] != 'undefined', 'missing Wasm export: _emscripten_thread_exit');
  assert(typeof wasmExports['_emscripten_check_mailbox'] != 'undefined', 'missing Wasm export: _emscripten_check_mailbox');
  assert(typeof wasmExports['setThrew'] != 'undefined', 'missing Wasm export: setThrew');
  assert(typeof wasmExports['emscripten_stack_init'] != 'undefined', 'missing Wasm export: emscripten_stack_init');
  assert(typeof wasmExports['emscripten_stack_set_limits'] != 'undefined', 'missing Wasm export: emscripten_stack_set_limits');
  assert(typeof wasmExports['emscripten_stack_get_free'] != 'undefined', 'missing Wasm export: emscripten_stack_get_free');
  assert(typeof wasmExports['_emscripten_stack_restore'] != 'undefined', 'missing Wasm export: _emscripten_stack_restore');
  assert(typeof wasmExports['_emscripten_stack_alloc'] != 'undefined', 'missing Wasm export: _emscripten_stack_alloc');
  assert(typeof wasmExports['emscripten_stack_get_current'] != 'undefined', 'missing Wasm export: emscripten_stack_get_current');
  assert(typeof wasmExports['dynCall_vjj'] != 'undefined', 'missing Wasm export: dynCall_vjj');
  assert(typeof wasmExports['dynCall_v'] != 'undefined', 'missing Wasm export: dynCall_v');
  assert(typeof wasmExports['dynCall_ijji'] != 'undefined', 'missing Wasm export: dynCall_ijji');
  assert(typeof wasmExports['dynCall_jj'] != 'undefined', 'missing Wasm export: dynCall_jj');
  assert(typeof wasmExports['dynCall_vjjj'] != 'undefined', 'missing Wasm export: dynCall_vjjj');
  assert(typeof wasmExports['dynCall_vj'] != 'undefined', 'missing Wasm export: dynCall_vj');
  assert(typeof wasmExports['dynCall_vji'] != 'undefined', 'missing Wasm export: dynCall_vji');
  assert(typeof wasmExports['dynCall_ijjij'] != 'undefined', 'missing Wasm export: dynCall_ijjij');
  assert(typeof wasmExports['dynCall_ijj'] != 'undefined', 'missing Wasm export: dynCall_ijj');
  assert(typeof wasmExports['dynCall_ijjj'] != 'undefined', 'missing Wasm export: dynCall_ijjj');
  assert(typeof wasmExports['dynCall_vijj'] != 'undefined', 'missing Wasm export: dynCall_vijj');
  assert(typeof wasmExports['dynCall_vjjjj'] != 'undefined', 'missing Wasm export: dynCall_vjjjj');
  assert(typeof wasmExports['dynCall_vjjjjj'] != 'undefined', 'missing Wasm export: dynCall_vjjjjj');
  assert(typeof wasmExports['dynCall_jjj'] != 'undefined', 'missing Wasm export: dynCall_jjj');
  assert(typeof wasmExports['dynCall_ijij'] != 'undefined', 'missing Wasm export: dynCall_ijij');
  assert(typeof wasmExports['dynCall_iijj'] != 'undefined', 'missing Wasm export: dynCall_iijj');
  assert(typeof wasmExports['dynCall_vjiiii'] != 'undefined', 'missing Wasm export: dynCall_vjiiii');
  assert(typeof wasmExports['dynCall_iji'] != 'undefined', 'missing Wasm export: dynCall_iji');
  assert(typeof wasmExports['dynCall_ijiij'] != 'undefined', 'missing Wasm export: dynCall_ijiij');
  assert(typeof wasmExports['dynCall_ij'] != 'undefined', 'missing Wasm export: dynCall_ij');
  assert(typeof wasmExports['dynCall_iiii'] != 'undefined', 'missing Wasm export: dynCall_iiii');
  assert(typeof wasmExports['dynCall_vjji'] != 'undefined', 'missing Wasm export: dynCall_vjji');
  assert(typeof wasmExports['dynCall_vjjijj'] != 'undefined', 'missing Wasm export: dynCall_vjjijj');
  assert(typeof wasmExports['dynCall_i'] != 'undefined', 'missing Wasm export: dynCall_i');
  assert(typeof wasmExports['dynCall_vjjij'] != 'undefined', 'missing Wasm export: dynCall_vjjij');
  assert(typeof wasmExports['dynCall_jjjj'] != 'undefined', 'missing Wasm export: dynCall_jjjj');
  assert(typeof wasmExports['dynCall_iii'] != 'undefined', 'missing Wasm export: dynCall_iii');
  assert(typeof wasmExports['dynCall_ii'] != 'undefined', 'missing Wasm export: dynCall_ii');
  assert(typeof wasmExports['dynCall_jjij'] != 'undefined', 'missing Wasm export: dynCall_jjij');
  assert(typeof wasmExports['dynCall_vjjji'] != 'undefined', 'missing Wasm export: dynCall_vjjji');
  assert(typeof wasmExports['dynCall_ijjiii'] != 'undefined', 'missing Wasm export: dynCall_ijjiii');
  assert(typeof wasmExports['dynCall_jjjjji'] != 'undefined', 'missing Wasm export: dynCall_jjjjji');
  assert(typeof wasmExports['dynCall_ijjii'] != 'undefined', 'missing Wasm export: dynCall_ijjii');
  assert(typeof wasmExports['dynCall_jjjji'] != 'undefined', 'missing Wasm export: dynCall_jjjji');
  assert(typeof wasmExports['dynCall_vjii'] != 'undefined', 'missing Wasm export: dynCall_vjii');
  assert(typeof wasmExports['dynCall_vjij'] != 'undefined', 'missing Wasm export: dynCall_vjij');
  assert(typeof wasmExports['dynCall_j'] != 'undefined', 'missing Wasm export: dynCall_j');
  assert(typeof wasmExports['dynCall_ijijj'] != 'undefined', 'missing Wasm export: dynCall_ijijj');
  assert(typeof wasmExports['dynCall_jjji'] != 'undefined', 'missing Wasm export: dynCall_jjji');
  assert(typeof wasmExports['dynCall_vjiii'] != 'undefined', 'missing Wasm export: dynCall_vjiii');
  assert(typeof wasmExports['dynCall_vij'] != 'undefined', 'missing Wasm export: dynCall_vij');
  assert(typeof wasmExports['dynCall_vjid'] != 'undefined', 'missing Wasm export: dynCall_vjid');
  assert(typeof wasmExports['dynCall_ijiii'] != 'undefined', 'missing Wasm export: dynCall_ijiii');
  assert(typeof wasmExports['dynCall_vjijj'] != 'undefined', 'missing Wasm export: dynCall_vjijj');
  assert(typeof wasmExports['dynCall_ijiiji'] != 'undefined', 'missing Wasm export: dynCall_ijiiji');
  assert(typeof wasmExports['dynCall_ijjjij'] != 'undefined', 'missing Wasm export: dynCall_ijjjij');
  assert(typeof wasmExports['dynCall_jjii'] != 'undefined', 'missing Wasm export: dynCall_jjii');
  assert(typeof wasmExports['dynCall_ijjjjjj'] != 'undefined', 'missing Wasm export: dynCall_ijjjjjj');
  assert(typeof wasmExports['dynCall_vjiiiiii'] != 'undefined', 'missing Wasm export: dynCall_vjiiiiii');
  assert(typeof wasmExports['dynCall_jjjiii'] != 'undefined', 'missing Wasm export: dynCall_jjjiii');
  assert(typeof wasmExports['dynCall_ijijii'] != 'undefined', 'missing Wasm export: dynCall_ijijii');
  assert(typeof wasmExports['dynCall_jjjjjj'] != 'undefined', 'missing Wasm export: dynCall_jjjjjj');
  assert(typeof wasmExports['dynCall_ijii'] != 'undefined', 'missing Wasm export: dynCall_ijii');
  assert(typeof wasmExports['dynCall_vjiji'] != 'undefined', 'missing Wasm export: dynCall_vjiji');
  assert(typeof wasmExports['dynCall_vjjiii'] != 'undefined', 'missing Wasm export: dynCall_vjjiii');
  assert(typeof wasmExports['dynCall_jjjjj'] != 'undefined', 'missing Wasm export: dynCall_jjjjj');
  assert(typeof wasmExports['dynCall_vjjjii'] != 'undefined', 'missing Wasm export: dynCall_vjjjii');
  assert(typeof wasmExports['dynCall_vjjiji'] != 'undefined', 'missing Wasm export: dynCall_vjjiji');
  assert(typeof wasmExports['dynCall_ijjjj'] != 'undefined', 'missing Wasm export: dynCall_ijjjj');
  assert(typeof wasmExports['dynCall_ijjjjj'] != 'undefined', 'missing Wasm export: dynCall_ijjjjj');
  assert(typeof wasmExports['dynCall_jjiji'] != 'undefined', 'missing Wasm export: dynCall_jjiji');
  assert(typeof wasmExports['dynCall_ijjiij'] != 'undefined', 'missing Wasm export: dynCall_ijjiij');
  assert(typeof wasmExports['dynCall_jjiijj'] != 'undefined', 'missing Wasm export: dynCall_jjiijj');
  assert(typeof wasmExports['dynCall_vjjiij'] != 'undefined', 'missing Wasm export: dynCall_vjjiij');
  assert(typeof wasmExports['dynCall_vjjiiiij'] != 'undefined', 'missing Wasm export: dynCall_vjjiiiij');
  assert(typeof wasmExports['dynCall_jji'] != 'undefined', 'missing Wasm export: dynCall_jji');
  assert(typeof wasmExports['dynCall_ijiji'] != 'undefined', 'missing Wasm export: dynCall_ijiji');
  assert(typeof wasmExports['dynCall_ijjijj'] != 'undefined', 'missing Wasm export: dynCall_ijjijj');
  assert(typeof wasmExports['dynCall_vi'] != 'undefined', 'missing Wasm export: dynCall_vi');
  assert(typeof wasmExports['dynCall_vjjijjjjj'] != 'undefined', 'missing Wasm export: dynCall_vjjijjjjj');
  assert(typeof wasmExports['dynCall_ijjjji'] != 'undefined', 'missing Wasm export: dynCall_ijjjji');
  assert(typeof wasmExports['dynCall_ijjji'] != 'undefined', 'missing Wasm export: dynCall_ijjji');
  assert(typeof wasmExports['dynCall_ijjjiijj'] != 'undefined', 'missing Wasm export: dynCall_ijjjiijj');
  assert(typeof wasmExports['dynCall_vjijjj'] != 'undefined', 'missing Wasm export: dynCall_vjijjj');
  assert(typeof wasmExports['dynCall_iijjijij'] != 'undefined', 'missing Wasm export: dynCall_iijjijij');
  assert(typeof wasmExports['dynCall_ijjjiij'] != 'undefined', 'missing Wasm export: dynCall_ijjjiij');
  assert(typeof wasmExports['dynCall_iiiij'] != 'undefined', 'missing Wasm export: dynCall_iiiij');
  assert(typeof wasmExports['dynCall_jjjjjjij'] != 'undefined', 'missing Wasm export: dynCall_jjjjjjij');
  assert(typeof wasmExports['dynCall_jjjij'] != 'undefined', 'missing Wasm export: dynCall_jjjij');
  assert(typeof wasmExports['dynCall_vjjjjjj'] != 'undefined', 'missing Wasm export: dynCall_vjjjjjj');
  assert(typeof wasmExports['dynCall_jjjijij'] != 'undefined', 'missing Wasm export: dynCall_jjjijij');
  assert(typeof wasmExports['dynCall_jjijij'] != 'undefined', 'missing Wasm export: dynCall_jjijij');
  assert(typeof wasmExports['dynCall_vjiiiij'] != 'undefined', 'missing Wasm export: dynCall_vjiiiij');
  assert(typeof wasmExports['dynCall_vjiiiii'] != 'undefined', 'missing Wasm export: dynCall_vjiiiii');
  assert(typeof wasmExports['dynCall_vjiiij'] != 'undefined', 'missing Wasm export: dynCall_vjiiij');
  assert(typeof wasmExports['dynCall_vjiiiijijiji'] != 'undefined', 'missing Wasm export: dynCall_vjiiiijijiji');
  assert(typeof wasmExports['dynCall_vijjj'] != 'undefined', 'missing Wasm export: dynCall_vijjj');
  assert(typeof wasmExports['dynCall_vjjijjj'] != 'undefined', 'missing Wasm export: dynCall_vjjijjj');
  assert(typeof wasmExports['dynCall_jjjiiiijjijjj'] != 'undefined', 'missing Wasm export: dynCall_jjjiiiijjijjj');
  assert(typeof wasmExports['dynCall_vjjii'] != 'undefined', 'missing Wasm export: dynCall_vjjii');
  assert(typeof wasmExports['dynCall_ijjiiiijiiii'] != 'undefined', 'missing Wasm export: dynCall_ijjiiiijiiii');
  assert(typeof wasmExports['dynCall_vijji'] != 'undefined', 'missing Wasm export: dynCall_vijji');
  assert(typeof wasmExports['dynCall_ijjiiiij'] != 'undefined', 'missing Wasm export: dynCall_ijjiiiij');
  assert(typeof wasmExports['dynCall_jjijj'] != 'undefined', 'missing Wasm export: dynCall_jjijj');
  assert(typeof wasmExports['dynCall_ijjjjii'] != 'undefined', 'missing Wasm export: dynCall_ijjjjii');
  assert(typeof wasmExports['dynCall_iij'] != 'undefined', 'missing Wasm export: dynCall_iij');
  assert(typeof wasmExports['dynCall_ji'] != 'undefined', 'missing Wasm export: dynCall_ji');
  assert(typeof wasmExports['dynCall_vjjjjjjj'] != 'undefined', 'missing Wasm export: dynCall_vjjjjjjj');
  assert(typeof wasmExports['dynCall_iiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiii');
  assert(typeof wasmExports['dynCall_vjiijj'] != 'undefined', 'missing Wasm export: dynCall_vjiijj');
  assert(typeof wasmExports['dynCall_vjjjji'] != 'undefined', 'missing Wasm export: dynCall_vjjjji');
  assert(typeof wasmExports['dynCall_vjjjjji'] != 'undefined', 'missing Wasm export: dynCall_vjjjjji');
  assert(typeof wasmExports['dynCall_vjjjjjii'] != 'undefined', 'missing Wasm export: dynCall_vjjjjjii');
  assert(typeof wasmExports['dynCall_vjjjjiii'] != 'undefined', 'missing Wasm export: dynCall_vjjjjiii');
  assert(typeof wasmExports['dynCall_ijjjjjij'] != 'undefined', 'missing Wasm export: dynCall_ijjjjjij');
  assert(typeof wasmExports['dynCall_ijjjjjjj'] != 'undefined', 'missing Wasm export: dynCall_ijjjjjjj');
  assert(typeof wasmExports['dynCall_jij'] != 'undefined', 'missing Wasm export: dynCall_jij');
  assert(typeof wasmExports['dynCall_viijjij'] != 'undefined', 'missing Wasm export: dynCall_viijjij');
  assert(typeof wasmExports['dynCall_ijijjjjj'] != 'undefined', 'missing Wasm export: dynCall_ijijjjjj');
  assert(typeof wasmExports['dynCall_ijjjjji'] != 'undefined', 'missing Wasm export: dynCall_ijjjjji');
  assert(typeof wasmExports['dynCall_ijjjjij'] != 'undefined', 'missing Wasm export: dynCall_ijjjjij');
  assert(typeof wasmExports['dynCall_ijjiiij'] != 'undefined', 'missing Wasm export: dynCall_ijjiiij');
  assert(typeof wasmExports['dynCall_jjjjjijj'] != 'undefined', 'missing Wasm export: dynCall_jjjjjijj');
  assert(typeof wasmExports['dynCall_ijjjjjjii'] != 'undefined', 'missing Wasm export: dynCall_ijjjjjjii');
  assert(typeof wasmExports['dynCall_ijjjjjijj'] != 'undefined', 'missing Wasm export: dynCall_ijjjjjijj');
  assert(typeof wasmExports['dynCall_ijjiji'] != 'undefined', 'missing Wasm export: dynCall_ijjiji');
  assert(typeof wasmExports['dynCall_jjiiiiijj'] != 'undefined', 'missing Wasm export: dynCall_jjiiiiijj');
  assert(typeof wasmExports['dynCall_jjjjjjj'] != 'undefined', 'missing Wasm export: dynCall_jjjjjjj');
  assert(typeof wasmExports['dynCall_vjiiijj'] != 'undefined', 'missing Wasm export: dynCall_vjiiijj');
  assert(typeof wasmExports['dynCall_vjijjji'] != 'undefined', 'missing Wasm export: dynCall_vjijjji');
  assert(typeof wasmExports['dynCall_ijjiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_ijjiiiiiii');
  assert(typeof wasmExports['dynCall_ijjjjjii'] != 'undefined', 'missing Wasm export: dynCall_ijjjjjii');
  assert(typeof wasmExports['dynCall_iijjj'] != 'undefined', 'missing Wasm export: dynCall_iijjj');
  assert(typeof wasmExports['dynCall_jjjiij'] != 'undefined', 'missing Wasm export: dynCall_jjjiij');
  assert(typeof wasmExports['dynCall_ijdiiiii'] != 'undefined', 'missing Wasm export: dynCall_ijdiiiii');
  assert(typeof wasmExports['asyncify_start_unwind'] != 'undefined', 'missing Wasm export: asyncify_start_unwind');
  assert(typeof wasmExports['asyncify_stop_unwind'] != 'undefined', 'missing Wasm export: asyncify_stop_unwind');
  assert(typeof wasmExports['asyncify_start_rewind'] != 'undefined', 'missing Wasm export: asyncify_start_rewind');
  assert(typeof wasmExports['asyncify_stop_rewind'] != 'undefined', 'missing Wasm export: asyncify_stop_rewind');
  assert(typeof wasmExports['__indirect_function_table'] != 'undefined', 'missing Wasm export: __indirect_function_table');
  _ntohs = createExportWrapper('ntohs', wasmExports['ntohs'], 1);
  _htonl = createExportWrapper('htonl', wasmExports['htonl'], 1);
  _htons = createExportWrapper('htons', wasmExports['htons'], 1);
  _pthread_self = wasmExports['pthread_self'];
  _strerror = createExportWrapper('strerror', wasmExports['strerror'], 1);
  _malloc = createExportWrapper('malloc', wasmExports['malloc'], 1);
  _free = createExportWrapper('free', wasmExports['free'], 1);
  _fflush = createExportWrapper('fflush', wasmExports['fflush'], 1);
  _main = Module['_main'] = createExportWrapper('__main_argc_argv', wasmExports['__main_argc_argv'], 2);
  __emscripten_tls_init = createExportWrapper('_emscripten_tls_init', wasmExports['_emscripten_tls_init'], 0);
  _emscripten_builtin_memalign = createExportWrapper('emscripten_builtin_memalign', wasmExports['emscripten_builtin_memalign'], 2);
  __emscripten_proxy_main = Module['__emscripten_proxy_main'] = createExportWrapper('_emscripten_proxy_main', wasmExports['_emscripten_proxy_main'], 2);
  _emscripten_stack_get_base = wasmExports['emscripten_stack_get_base'];
  _emscripten_stack_get_end = wasmExports['emscripten_stack_get_end'];
  __emscripten_run_callback_on_thread = createExportWrapper('_emscripten_run_callback_on_thread', wasmExports['_emscripten_run_callback_on_thread'], 6);
  __emscripten_thread_init = createExportWrapper('_emscripten_thread_init', wasmExports['_emscripten_thread_init'], 6);
  ___set_thread_state = createExportWrapper('__set_thread_state', wasmExports['__set_thread_state'], 4);
  __emscripten_thread_crashed = createExportWrapper('_emscripten_thread_crashed', wasmExports['_emscripten_thread_crashed'], 0);
  __emscripten_run_js_on_main_thread_done = createExportWrapper('_emscripten_run_js_on_main_thread_done', wasmExports['_emscripten_run_js_on_main_thread_done'], 3);
  __emscripten_run_js_on_main_thread = createExportWrapper('_emscripten_run_js_on_main_thread', wasmExports['_emscripten_run_js_on_main_thread'], 5);
  __emscripten_thread_free_data = createExportWrapper('_emscripten_thread_free_data', wasmExports['_emscripten_thread_free_data'], 1);
  __emscripten_thread_exit = createExportWrapper('_emscripten_thread_exit', wasmExports['_emscripten_thread_exit'], 1);
  __emscripten_check_mailbox = createExportWrapper('_emscripten_check_mailbox', wasmExports['_emscripten_check_mailbox'], 0);
  _setThrew = createExportWrapper('setThrew', wasmExports['setThrew'], 2);
  _emscripten_stack_init = wasmExports['emscripten_stack_init'];
  _emscripten_stack_set_limits = wasmExports['emscripten_stack_set_limits'];
  _emscripten_stack_get_free = wasmExports['emscripten_stack_get_free'];
  __emscripten_stack_restore = wasmExports['_emscripten_stack_restore'];
  __emscripten_stack_alloc = wasmExports['_emscripten_stack_alloc'];
  _emscripten_stack_get_current = wasmExports['emscripten_stack_get_current'];
  dynCall_vjj = dynCalls['vjj'] = createExportWrapper('dynCall_vjj', wasmExports['dynCall_vjj'], 3);
  dynCall_v = dynCalls['v'] = createExportWrapper('dynCall_v', wasmExports['dynCall_v'], 1);
  dynCall_ijji = dynCalls['ijji'] = createExportWrapper('dynCall_ijji', wasmExports['dynCall_ijji'], 4);
  dynCall_jj = dynCalls['jj'] = createExportWrapper('dynCall_jj', wasmExports['dynCall_jj'], 2);
  dynCall_vjjj = dynCalls['vjjj'] = createExportWrapper('dynCall_vjjj', wasmExports['dynCall_vjjj'], 4);
  dynCall_vj = dynCalls['vj'] = createExportWrapper('dynCall_vj', wasmExports['dynCall_vj'], 2);
  dynCall_vji = dynCalls['vji'] = createExportWrapper('dynCall_vji', wasmExports['dynCall_vji'], 3);
  dynCall_ijjij = dynCalls['ijjij'] = createExportWrapper('dynCall_ijjij', wasmExports['dynCall_ijjij'], 5);
  dynCall_ijj = dynCalls['ijj'] = createExportWrapper('dynCall_ijj', wasmExports['dynCall_ijj'], 3);
  dynCall_ijjj = dynCalls['ijjj'] = createExportWrapper('dynCall_ijjj', wasmExports['dynCall_ijjj'], 4);
  dynCall_vijj = dynCalls['vijj'] = createExportWrapper('dynCall_vijj', wasmExports['dynCall_vijj'], 4);
  dynCall_vjjjj = dynCalls['vjjjj'] = createExportWrapper('dynCall_vjjjj', wasmExports['dynCall_vjjjj'], 5);
  dynCall_vjjjjj = dynCalls['vjjjjj'] = createExportWrapper('dynCall_vjjjjj', wasmExports['dynCall_vjjjjj'], 6);
  dynCall_jjj = dynCalls['jjj'] = createExportWrapper('dynCall_jjj', wasmExports['dynCall_jjj'], 3);
  dynCall_ijij = dynCalls['ijij'] = createExportWrapper('dynCall_ijij', wasmExports['dynCall_ijij'], 4);
  dynCall_iijj = dynCalls['iijj'] = createExportWrapper('dynCall_iijj', wasmExports['dynCall_iijj'], 4);
  dynCall_vjiiii = dynCalls['vjiiii'] = createExportWrapper('dynCall_vjiiii', wasmExports['dynCall_vjiiii'], 6);
  dynCall_iji = dynCalls['iji'] = createExportWrapper('dynCall_iji', wasmExports['dynCall_iji'], 3);
  dynCall_ijiij = dynCalls['ijiij'] = createExportWrapper('dynCall_ijiij', wasmExports['dynCall_ijiij'], 5);
  dynCall_ij = dynCalls['ij'] = createExportWrapper('dynCall_ij', wasmExports['dynCall_ij'], 2);
  dynCall_iiii = dynCalls['iiii'] = createExportWrapper('dynCall_iiii', wasmExports['dynCall_iiii'], 4);
  dynCall_vjji = dynCalls['vjji'] = createExportWrapper('dynCall_vjji', wasmExports['dynCall_vjji'], 4);
  dynCall_vjjijj = dynCalls['vjjijj'] = createExportWrapper('dynCall_vjjijj', wasmExports['dynCall_vjjijj'], 6);
  dynCall_i = dynCalls['i'] = createExportWrapper('dynCall_i', wasmExports['dynCall_i'], 1);
  dynCall_vjjij = dynCalls['vjjij'] = createExportWrapper('dynCall_vjjij', wasmExports['dynCall_vjjij'], 5);
  dynCall_jjjj = dynCalls['jjjj'] = createExportWrapper('dynCall_jjjj', wasmExports['dynCall_jjjj'], 4);
  dynCall_iii = dynCalls['iii'] = createExportWrapper('dynCall_iii', wasmExports['dynCall_iii'], 3);
  dynCall_ii = dynCalls['ii'] = createExportWrapper('dynCall_ii', wasmExports['dynCall_ii'], 2);
  dynCall_jjij = dynCalls['jjij'] = createExportWrapper('dynCall_jjij', wasmExports['dynCall_jjij'], 4);
  dynCall_vjjji = dynCalls['vjjji'] = createExportWrapper('dynCall_vjjji', wasmExports['dynCall_vjjji'], 5);
  dynCall_ijjiii = dynCalls['ijjiii'] = createExportWrapper('dynCall_ijjiii', wasmExports['dynCall_ijjiii'], 6);
  dynCall_jjjjji = dynCalls['jjjjji'] = createExportWrapper('dynCall_jjjjji', wasmExports['dynCall_jjjjji'], 6);
  dynCall_ijjii = dynCalls['ijjii'] = createExportWrapper('dynCall_ijjii', wasmExports['dynCall_ijjii'], 5);
  dynCall_jjjji = dynCalls['jjjji'] = createExportWrapper('dynCall_jjjji', wasmExports['dynCall_jjjji'], 5);
  dynCall_vjii = dynCalls['vjii'] = createExportWrapper('dynCall_vjii', wasmExports['dynCall_vjii'], 4);
  dynCall_vjij = dynCalls['vjij'] = createExportWrapper('dynCall_vjij', wasmExports['dynCall_vjij'], 4);
  dynCall_j = dynCalls['j'] = createExportWrapper('dynCall_j', wasmExports['dynCall_j'], 1);
  dynCall_ijijj = dynCalls['ijijj'] = createExportWrapper('dynCall_ijijj', wasmExports['dynCall_ijijj'], 5);
  dynCall_jjji = dynCalls['jjji'] = createExportWrapper('dynCall_jjji', wasmExports['dynCall_jjji'], 4);
  dynCall_vjiii = dynCalls['vjiii'] = createExportWrapper('dynCall_vjiii', wasmExports['dynCall_vjiii'], 5);
  dynCall_vij = dynCalls['vij'] = createExportWrapper('dynCall_vij', wasmExports['dynCall_vij'], 3);
  dynCall_vjid = dynCalls['vjid'] = createExportWrapper('dynCall_vjid', wasmExports['dynCall_vjid'], 4);
  dynCall_ijiii = dynCalls['ijiii'] = createExportWrapper('dynCall_ijiii', wasmExports['dynCall_ijiii'], 5);
  dynCall_vjijj = dynCalls['vjijj'] = createExportWrapper('dynCall_vjijj', wasmExports['dynCall_vjijj'], 5);
  dynCall_ijiiji = dynCalls['ijiiji'] = createExportWrapper('dynCall_ijiiji', wasmExports['dynCall_ijiiji'], 6);
  dynCall_ijjjij = dynCalls['ijjjij'] = createExportWrapper('dynCall_ijjjij', wasmExports['dynCall_ijjjij'], 6);
  dynCall_jjii = dynCalls['jjii'] = createExportWrapper('dynCall_jjii', wasmExports['dynCall_jjii'], 4);
  dynCall_ijjjjjj = dynCalls['ijjjjjj'] = createExportWrapper('dynCall_ijjjjjj', wasmExports['dynCall_ijjjjjj'], 7);
  dynCall_vjiiiiii = dynCalls['vjiiiiii'] = createExportWrapper('dynCall_vjiiiiii', wasmExports['dynCall_vjiiiiii'], 8);
  dynCall_jjjiii = dynCalls['jjjiii'] = createExportWrapper('dynCall_jjjiii', wasmExports['dynCall_jjjiii'], 6);
  dynCall_ijijii = dynCalls['ijijii'] = createExportWrapper('dynCall_ijijii', wasmExports['dynCall_ijijii'], 6);
  dynCall_jjjjjj = dynCalls['jjjjjj'] = createExportWrapper('dynCall_jjjjjj', wasmExports['dynCall_jjjjjj'], 6);
  dynCall_ijii = dynCalls['ijii'] = createExportWrapper('dynCall_ijii', wasmExports['dynCall_ijii'], 4);
  dynCall_vjiji = dynCalls['vjiji'] = createExportWrapper('dynCall_vjiji', wasmExports['dynCall_vjiji'], 5);
  dynCall_vjjiii = dynCalls['vjjiii'] = createExportWrapper('dynCall_vjjiii', wasmExports['dynCall_vjjiii'], 6);
  dynCall_jjjjj = dynCalls['jjjjj'] = createExportWrapper('dynCall_jjjjj', wasmExports['dynCall_jjjjj'], 5);
  dynCall_vjjjii = dynCalls['vjjjii'] = createExportWrapper('dynCall_vjjjii', wasmExports['dynCall_vjjjii'], 6);
  dynCall_vjjiji = dynCalls['vjjiji'] = createExportWrapper('dynCall_vjjiji', wasmExports['dynCall_vjjiji'], 6);
  dynCall_ijjjj = dynCalls['ijjjj'] = createExportWrapper('dynCall_ijjjj', wasmExports['dynCall_ijjjj'], 5);
  dynCall_ijjjjj = dynCalls['ijjjjj'] = createExportWrapper('dynCall_ijjjjj', wasmExports['dynCall_ijjjjj'], 6);
  dynCall_jjiji = dynCalls['jjiji'] = createExportWrapper('dynCall_jjiji', wasmExports['dynCall_jjiji'], 5);
  dynCall_ijjiij = dynCalls['ijjiij'] = createExportWrapper('dynCall_ijjiij', wasmExports['dynCall_ijjiij'], 6);
  dynCall_jjiijj = dynCalls['jjiijj'] = createExportWrapper('dynCall_jjiijj', wasmExports['dynCall_jjiijj'], 6);
  dynCall_vjjiij = dynCalls['vjjiij'] = createExportWrapper('dynCall_vjjiij', wasmExports['dynCall_vjjiij'], 6);
  dynCall_vjjiiiij = dynCalls['vjjiiiij'] = createExportWrapper('dynCall_vjjiiiij', wasmExports['dynCall_vjjiiiij'], 8);
  dynCall_jji = dynCalls['jji'] = createExportWrapper('dynCall_jji', wasmExports['dynCall_jji'], 3);
  dynCall_ijiji = dynCalls['ijiji'] = createExportWrapper('dynCall_ijiji', wasmExports['dynCall_ijiji'], 5);
  dynCall_ijjijj = dynCalls['ijjijj'] = createExportWrapper('dynCall_ijjijj', wasmExports['dynCall_ijjijj'], 6);
  dynCall_vi = dynCalls['vi'] = createExportWrapper('dynCall_vi', wasmExports['dynCall_vi'], 2);
  dynCall_vjjijjjjj = dynCalls['vjjijjjjj'] = createExportWrapper('dynCall_vjjijjjjj', wasmExports['dynCall_vjjijjjjj'], 9);
  dynCall_ijjjji = dynCalls['ijjjji'] = createExportWrapper('dynCall_ijjjji', wasmExports['dynCall_ijjjji'], 6);
  dynCall_ijjji = dynCalls['ijjji'] = createExportWrapper('dynCall_ijjji', wasmExports['dynCall_ijjji'], 5);
  dynCall_ijjjiijj = dynCalls['ijjjiijj'] = createExportWrapper('dynCall_ijjjiijj', wasmExports['dynCall_ijjjiijj'], 8);
  dynCall_vjijjj = dynCalls['vjijjj'] = createExportWrapper('dynCall_vjijjj', wasmExports['dynCall_vjijjj'], 6);
  dynCall_iijjijij = dynCalls['iijjijij'] = createExportWrapper('dynCall_iijjijij', wasmExports['dynCall_iijjijij'], 8);
  dynCall_ijjjiij = dynCalls['ijjjiij'] = createExportWrapper('dynCall_ijjjiij', wasmExports['dynCall_ijjjiij'], 7);
  dynCall_iiiij = dynCalls['iiiij'] = createExportWrapper('dynCall_iiiij', wasmExports['dynCall_iiiij'], 5);
  dynCall_jjjjjjij = dynCalls['jjjjjjij'] = createExportWrapper('dynCall_jjjjjjij', wasmExports['dynCall_jjjjjjij'], 8);
  dynCall_jjjij = dynCalls['jjjij'] = createExportWrapper('dynCall_jjjij', wasmExports['dynCall_jjjij'], 5);
  dynCall_vjjjjjj = dynCalls['vjjjjjj'] = createExportWrapper('dynCall_vjjjjjj', wasmExports['dynCall_vjjjjjj'], 7);
  dynCall_jjjijij = dynCalls['jjjijij'] = createExportWrapper('dynCall_jjjijij', wasmExports['dynCall_jjjijij'], 7);
  dynCall_jjijij = dynCalls['jjijij'] = createExportWrapper('dynCall_jjijij', wasmExports['dynCall_jjijij'], 6);
  dynCall_vjiiiij = dynCalls['vjiiiij'] = createExportWrapper('dynCall_vjiiiij', wasmExports['dynCall_vjiiiij'], 7);
  dynCall_vjiiiii = dynCalls['vjiiiii'] = createExportWrapper('dynCall_vjiiiii', wasmExports['dynCall_vjiiiii'], 7);
  dynCall_vjiiij = dynCalls['vjiiij'] = createExportWrapper('dynCall_vjiiij', wasmExports['dynCall_vjiiij'], 6);
  dynCall_vjiiiijijiji = dynCalls['vjiiiijijiji'] = createExportWrapper('dynCall_vjiiiijijiji', wasmExports['dynCall_vjiiiijijiji'], 12);
  dynCall_vijjj = dynCalls['vijjj'] = createExportWrapper('dynCall_vijjj', wasmExports['dynCall_vijjj'], 5);
  dynCall_vjjijjj = dynCalls['vjjijjj'] = createExportWrapper('dynCall_vjjijjj', wasmExports['dynCall_vjjijjj'], 7);
  dynCall_jjjiiiijjijjj = dynCalls['jjjiiiijjijjj'] = createExportWrapper('dynCall_jjjiiiijjijjj', wasmExports['dynCall_jjjiiiijjijjj'], 13);
  dynCall_vjjii = dynCalls['vjjii'] = createExportWrapper('dynCall_vjjii', wasmExports['dynCall_vjjii'], 5);
  dynCall_ijjiiiijiiii = dynCalls['ijjiiiijiiii'] = createExportWrapper('dynCall_ijjiiiijiiii', wasmExports['dynCall_ijjiiiijiiii'], 12);
  dynCall_vijji = dynCalls['vijji'] = createExportWrapper('dynCall_vijji', wasmExports['dynCall_vijji'], 5);
  dynCall_ijjiiiij = dynCalls['ijjiiiij'] = createExportWrapper('dynCall_ijjiiiij', wasmExports['dynCall_ijjiiiij'], 8);
  dynCall_jjijj = dynCalls['jjijj'] = createExportWrapper('dynCall_jjijj', wasmExports['dynCall_jjijj'], 5);
  dynCall_ijjjjii = dynCalls['ijjjjii'] = createExportWrapper('dynCall_ijjjjii', wasmExports['dynCall_ijjjjii'], 7);
  dynCall_iij = dynCalls['iij'] = createExportWrapper('dynCall_iij', wasmExports['dynCall_iij'], 3);
  dynCall_ji = dynCalls['ji'] = createExportWrapper('dynCall_ji', wasmExports['dynCall_ji'], 2);
  dynCall_vjjjjjjj = dynCalls['vjjjjjjj'] = createExportWrapper('dynCall_vjjjjjjj', wasmExports['dynCall_vjjjjjjj'], 8);
  dynCall_iiiii = dynCalls['iiiii'] = createExportWrapper('dynCall_iiiii', wasmExports['dynCall_iiiii'], 5);
  dynCall_vjiijj = dynCalls['vjiijj'] = createExportWrapper('dynCall_vjiijj', wasmExports['dynCall_vjiijj'], 6);
  dynCall_vjjjji = dynCalls['vjjjji'] = createExportWrapper('dynCall_vjjjji', wasmExports['dynCall_vjjjji'], 6);
  dynCall_vjjjjji = dynCalls['vjjjjji'] = createExportWrapper('dynCall_vjjjjji', wasmExports['dynCall_vjjjjji'], 7);
  dynCall_vjjjjjii = dynCalls['vjjjjjii'] = createExportWrapper('dynCall_vjjjjjii', wasmExports['dynCall_vjjjjjii'], 8);
  dynCall_vjjjjiii = dynCalls['vjjjjiii'] = createExportWrapper('dynCall_vjjjjiii', wasmExports['dynCall_vjjjjiii'], 8);
  dynCall_ijjjjjij = dynCalls['ijjjjjij'] = createExportWrapper('dynCall_ijjjjjij', wasmExports['dynCall_ijjjjjij'], 8);
  dynCall_ijjjjjjj = dynCalls['ijjjjjjj'] = createExportWrapper('dynCall_ijjjjjjj', wasmExports['dynCall_ijjjjjjj'], 8);
  dynCall_jij = dynCalls['jij'] = createExportWrapper('dynCall_jij', wasmExports['dynCall_jij'], 3);
  dynCall_viijjij = dynCalls['viijjij'] = createExportWrapper('dynCall_viijjij', wasmExports['dynCall_viijjij'], 7);
  dynCall_ijijjjjj = dynCalls['ijijjjjj'] = createExportWrapper('dynCall_ijijjjjj', wasmExports['dynCall_ijijjjjj'], 8);
  dynCall_ijjjjji = dynCalls['ijjjjji'] = createExportWrapper('dynCall_ijjjjji', wasmExports['dynCall_ijjjjji'], 7);
  dynCall_ijjjjij = dynCalls['ijjjjij'] = createExportWrapper('dynCall_ijjjjij', wasmExports['dynCall_ijjjjij'], 7);
  dynCall_ijjiiij = dynCalls['ijjiiij'] = createExportWrapper('dynCall_ijjiiij', wasmExports['dynCall_ijjiiij'], 7);
  dynCall_jjjjjijj = dynCalls['jjjjjijj'] = createExportWrapper('dynCall_jjjjjijj', wasmExports['dynCall_jjjjjijj'], 8);
  dynCall_ijjjjjjii = dynCalls['ijjjjjjii'] = createExportWrapper('dynCall_ijjjjjjii', wasmExports['dynCall_ijjjjjjii'], 9);
  dynCall_ijjjjjijj = dynCalls['ijjjjjijj'] = createExportWrapper('dynCall_ijjjjjijj', wasmExports['dynCall_ijjjjjijj'], 9);
  dynCall_ijjiji = dynCalls['ijjiji'] = createExportWrapper('dynCall_ijjiji', wasmExports['dynCall_ijjiji'], 6);
  dynCall_jjiiiiijj = dynCalls['jjiiiiijj'] = createExportWrapper('dynCall_jjiiiiijj', wasmExports['dynCall_jjiiiiijj'], 9);
  dynCall_jjjjjjj = dynCalls['jjjjjjj'] = createExportWrapper('dynCall_jjjjjjj', wasmExports['dynCall_jjjjjjj'], 7);
  dynCall_vjiiijj = dynCalls['vjiiijj'] = createExportWrapper('dynCall_vjiiijj', wasmExports['dynCall_vjiiijj'], 7);
  dynCall_vjijjji = dynCalls['vjijjji'] = createExportWrapper('dynCall_vjijjji', wasmExports['dynCall_vjijjji'], 7);
  dynCall_ijjiiiiiii = dynCalls['ijjiiiiiii'] = createExportWrapper('dynCall_ijjiiiiiii', wasmExports['dynCall_ijjiiiiiii'], 10);
  dynCall_ijjjjjii = dynCalls['ijjjjjii'] = createExportWrapper('dynCall_ijjjjjii', wasmExports['dynCall_ijjjjjii'], 8);
  dynCall_iijjj = dynCalls['iijjj'] = createExportWrapper('dynCall_iijjj', wasmExports['dynCall_iijjj'], 5);
  dynCall_jjjiij = dynCalls['jjjiij'] = createExportWrapper('dynCall_jjjiij', wasmExports['dynCall_jjjiij'], 6);
  dynCall_ijdiiiii = dynCalls['ijdiiiii'] = createExportWrapper('dynCall_ijdiiiii', wasmExports['dynCall_ijdiiiii'], 8);
  _asyncify_start_unwind = createExportWrapper('asyncify_start_unwind', wasmExports['asyncify_start_unwind'], 1);
  _asyncify_stop_unwind = createExportWrapper('asyncify_stop_unwind', wasmExports['asyncify_stop_unwind'], 0);
  _asyncify_start_rewind = createExportWrapper('asyncify_start_rewind', wasmExports['asyncify_start_rewind'], 1);
  _asyncify_stop_rewind = createExportWrapper('asyncify_stop_rewind', wasmExports['asyncify_stop_rewind'], 0);
  __indirect_function_table = wasmTable = wasmExports['__indirect_function_table'];
}

  var wasmImports;
  function assignWasmImports() {
    wasmImports = {
    /** @export */
    __assert_fail: ___assert_fail,
    /** @export */
    __call_sighandler: ___call_sighandler,
    /** @export */
    __pthread_create_js: ___pthread_create_js,
    /** @export */
    __syscall_accept4: ___syscall_accept4,
    /** @export */
    __syscall_bind: ___syscall_bind,
    /** @export */
    __syscall_chdir: ___syscall_chdir,
    /** @export */
    __syscall_connect: ___syscall_connect,
    /** @export */
    __syscall_dup: ___syscall_dup,
    /** @export */
    __syscall_dup3: ___syscall_dup3,
    /** @export */
    __syscall_faccessat: ___syscall_faccessat,
    /** @export */
    __syscall_fallocate: ___syscall_fallocate,
    /** @export */
    __syscall_fcntl64: ___syscall_fcntl64,
    /** @export */
    __syscall_fstat64: ___syscall_fstat64,
    /** @export */
    __syscall_ftruncate64: ___syscall_ftruncate64,
    /** @export */
    __syscall_getcwd: ___syscall_getcwd,
    /** @export */
    __syscall_getdents64: ___syscall_getdents64,
    /** @export */
    __syscall_getpeername: ___syscall_getpeername,
    /** @export */
    __syscall_getsockname: ___syscall_getsockname,
    /** @export */
    __syscall_getsockopt: ___syscall_getsockopt,
    /** @export */
    __syscall_getuid32: ___syscall_getuid32,
    /** @export */
    __syscall_ioctl: ___syscall_ioctl,
    /** @export */
    __syscall_listen: ___syscall_listen,
    /** @export */
    __syscall_lstat64: ___syscall_lstat64,
    /** @export */
    __syscall_mkdirat: ___syscall_mkdirat,
    /** @export */
    __syscall_newfstatat: ___syscall_newfstatat,
    /** @export */
    __syscall_openat: ___syscall_openat,
    /** @export */
    __syscall_pipe2: ___syscall_pipe2,
    /** @export */
    __syscall_poll: ___syscall_poll,
    /** @export */
    __syscall_poll_nonblocking: ___syscall_poll_nonblocking,
    /** @export */
    __syscall_readlinkat: ___syscall_readlinkat,
    /** @export */
    __syscall_recvfrom: ___syscall_recvfrom,
    /** @export */
    __syscall_recvmsg: ___syscall_recvmsg,
    /** @export */
    __syscall_renameat: ___syscall_renameat,
    /** @export */
    __syscall_rmdir: ___syscall_rmdir,
    /** @export */
    __syscall_sendmsg: ___syscall_sendmsg,
    /** @export */
    __syscall_sendto: ___syscall_sendto,
    /** @export */
    __syscall_setsockopt: ___syscall_setsockopt,
    /** @export */
    __syscall_shutdown: ___syscall_shutdown,
    /** @export */
    __syscall_socket: ___syscall_socket,
    /** @export */
    __syscall_stat64: ___syscall_stat64,
    /** @export */
    __syscall_statfs64: ___syscall_statfs64,
    /** @export */
    __syscall_symlinkat: ___syscall_symlinkat,
    /** @export */
    __syscall_unlinkat: ___syscall_unlinkat,
    /** @export */
    _abort_js: __abort_js,
    /** @export */
    _emscripten_init_main_thread_js: __emscripten_init_main_thread_js,
    /** @export */
    _emscripten_lookup_name: __emscripten_lookup_name,
    /** @export */
    _emscripten_notify_mailbox_postmessage: __emscripten_notify_mailbox_postmessage,
    /** @export */
    _emscripten_receive_on_main_thread_js: __emscripten_receive_on_main_thread_js,
    /** @export */
    _emscripten_runtime_keepalive_clear: __emscripten_runtime_keepalive_clear,
    /** @export */
    _emscripten_thread_cleanup: __emscripten_thread_cleanup,
    /** @export */
    _emscripten_thread_mailbox_await: __emscripten_thread_mailbox_await,
    /** @export */
    _emscripten_thread_set_strongref: __emscripten_thread_set_strongref,
    /** @export */
    _emscripten_throw_longjmp: __emscripten_throw_longjmp,
    /** @export */
    _gmtime_js: __gmtime_js,
    /** @export */
    _localtime_js: __localtime_js,
    /** @export */
    _mktime_js: __mktime_js,
    /** @export */
    _mmap_js: __mmap_js,
    /** @export */
    _msync_js: __msync_js,
    /** @export */
    _munmap_js: __munmap_js,
    /** @export */
    _tzset_js: __tzset_js,
    /** @export */
    clock_time_get: _clock_time_get,
    /** @export */
    emscripten_asm_const_int: _emscripten_asm_const_int,
    /** @export */
    emscripten_check_blocking_allowed: _emscripten_check_blocking_allowed,
    /** @export */
    emscripten_date_now: _emscripten_date_now,
    /** @export */
    emscripten_err: _emscripten_err,
    /** @export */
    emscripten_exit_with_live_runtime: _emscripten_exit_with_live_runtime,
    /** @export */
    emscripten_fiber_swap: _emscripten_fiber_swap,
    /** @export */
    emscripten_get_heap_max: _emscripten_get_heap_max,
    /** @export */
    emscripten_get_now: _emscripten_get_now,
    /** @export */
    emscripten_num_logical_cores: _emscripten_num_logical_cores,
    /** @export */
    emscripten_resize_heap: _emscripten_resize_heap,
    /** @export */
    emscripten_runtime_keepalive_check: _emscripten_runtime_keepalive_check,
    /** @export */
    emscripten_set_keydown_callback_on_thread: _emscripten_set_keydown_callback_on_thread,
    /** @export */
    emscripten_set_keyup_callback_on_thread: _emscripten_set_keyup_callback_on_thread,
    /** @export */
    emscripten_set_mousedown_callback_on_thread: _emscripten_set_mousedown_callback_on_thread,
    /** @export */
    emscripten_set_mousemove_callback_on_thread: _emscripten_set_mousemove_callback_on_thread,
    /** @export */
    emscripten_set_mouseup_callback_on_thread: _emscripten_set_mouseup_callback_on_thread,
    /** @export */
    environ_get: _environ_get,
    /** @export */
    environ_sizes_get: _environ_sizes_get,
    /** @export */
    exit: _exit,
    /** @export */
    fd_close: _fd_close,
    /** @export */
    fd_fdstat_get: _fd_fdstat_get,
    /** @export */
    fd_pread: _fd_pread,
    /** @export */
    fd_pwrite: _fd_pwrite,
    /** @export */
    fd_read: _fd_read,
    /** @export */
    fd_seek: _fd_seek,
    /** @export */
    fd_sync: _fd_sync,
    /** @export */
    fd_write: _fd_write,
    /** @export */
    ffi_call_js,
    /** @export */
    getaddrinfo: _getaddrinfo,
    /** @export */
    getnameinfo: _getnameinfo,
    /** @export */
    invoke_i,
    /** @export */
    invoke_ii,
    /** @export */
    invoke_iij,
    /** @export */
    invoke_iijj,
    /** @export */
    invoke_ij,
    /** @export */
    invoke_iji,
    /** @export */
    invoke_ijj,
    /** @export */
    invoke_ijjij,
    /** @export */
    invoke_ijjj,
    /** @export */
    invoke_ijjjjii,
    /** @export */
    invoke_j,
    /** @export */
    invoke_ji,
    /** @export */
    invoke_jj,
    /** @export */
    invoke_jjj,
    /** @export */
    invoke_jjji,
    /** @export */
    invoke_jjjj,
    /** @export */
    invoke_v,
    /** @export */
    invoke_vj,
    /** @export */
    invoke_vji,
    /** @export */
    invoke_vjii,
    /** @export */
    invoke_vjj,
    /** @export */
    invoke_vjji,
    /** @export */
    invoke_vjjij,
    /** @export */
    invoke_vjjijj,
    /** @export */
    invoke_vjjji,
    /** @export */
    invoke_vjjjj,
    /** @export */
    invoke_vjjjjj,
    /** @export */
    memory: wasmMemory,
    /** @export */
    proc_exit: _proc_exit
  };
  }

function invoke_v(index) {
  var sp = stackSave();
  try {
    dynCall_v(Number(index));
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjjijj(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    dynCall_vjjijj(Number(index),a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjj(index,a1,a2) {
  var sp = stackSave();
  try {
    dynCall_vjj(Number(index),a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ij(index,a1) {
  var sp = stackSave();
  try {
    return dynCall_ij(Number(index),a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vj(index,a1) {
  var sp = stackSave();
  try {
    dynCall_vj(Number(index),a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_i(index) {
  var sp = stackSave();
  try {
    return dynCall_i(Number(index));
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jjj(index,a1,a2) {
  var sp = stackSave();
  try {
    return dynCall_jjj(Number(index),a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_vjjij(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    dynCall_vjjij(Number(index),a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jjjj(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_jjjj(Number(index),a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_ijj(index,a1,a2) {
  var sp = stackSave();
  try {
    return dynCall_ijj(Number(index),a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjjjjj(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    dynCall_vjjjjj(Number(index),a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ijjj(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_ijjj(Number(index),a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jj(index,a1) {
  var sp = stackSave();
  try {
    return dynCall_jj(Number(index),a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_jjji(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_jjji(Number(index),a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_vjjjj(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    dynCall_vjjjj(Number(index),a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ijjij(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_ijjij(Number(index),a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ijjjjii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return dynCall_ijjjjii(Number(index),a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vji(index,a1,a2) {
  var sp = stackSave();
  try {
    dynCall_vji(Number(index),a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_j(index) {
  var sp = stackSave();
  try {
    return dynCall_j(Number(index));
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_iij(index,a1,a2) {
  var sp = stackSave();
  try {
    return dynCall_iij(Number(index),a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ji(index,a1) {
  var sp = stackSave();
  try {
    return dynCall_ji(Number(index),a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_vjii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    dynCall_vjii(Number(index),a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ii(index,a1) {
  var sp = stackSave();
  try {
    return dynCall_ii(Number(index),a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjji(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    dynCall_vjji(Number(index),a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjjji(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    dynCall_vjjji(Number(index),a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iji(index,a1,a2) {
  var sp = stackSave();
  try {
    return dynCall_iji(Number(index),a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iijj(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_iijj(Number(index),a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}


// Argument name here must shadow the `wasmExports` global so
// that it is recognised by metadce and minify-import-export-names
// passes.
function applySignatureConversions(wasmExports) {
  // First, make a copy of the incoming exports object
  wasmExports = Object.assign({}, wasmExports);
  var makeWrapper_p = (f) => () => Number(f());
  var makeWrapper_p_ = (f) => (a0) => Number(f(a0));
  var makeWrapper_pp = (f) => (a0) => Number(f(BigInt(a0)));
  var makeWrapper__p = (f) => (a0) => f(BigInt(a0));
  var makeWrapper___PP = (f) => (a0, a1, a2) => f(a0, BigInt(a1 ? a1 : 0), BigInt(a2 ? a2 : 0));
  var makeWrapper_ppp = (f) => (a0, a1) => Number(f(BigInt(a0), BigInt(a1)));
  var makeWrapper__pp_ppp = (f) => (a0, a1, a2, a3, a4, a5) => f(BigInt(a0), BigInt(a1), a2, BigInt(a3), BigInt(a4), BigInt(a5));
  var makeWrapper__p_____ = (f) => (a0, a1, a2, a3, a4, a5) => f(BigInt(a0), a1, a2, a3, a4, a5);
  var makeWrapper__p___ = (f) => (a0, a1, a2, a3) => f(BigInt(a0), a1, a2, a3);
  var makeWrapper__pp_ = (f) => (a0, a1, a2) => f(BigInt(a0), BigInt(a1), a2);
  var makeWrapper___p_p_ = (f) => (a0, a1, a2, a3, a4) => f(a0, BigInt(a1), a2, BigInt(a3), a4);
  var makeWrapper__p_ = (f) => (a0, a1) => f(BigInt(a0), a1);
  var makeWrapper__pp = (f) => (a0, a1) => f(BigInt(a0), BigInt(a1));
  var makeWrapper__p__ = (f) => (a0, a1, a2) => f(BigInt(a0), a1, a2);
  var makeWrapper__p____ = (f) => (a0, a1, a2, a3, a4) => f(BigInt(a0), a1, a2, a3, a4);
  var makeWrapper__p______ = (f) => (a0, a1, a2, a3, a4, a5, a6) => f(BigInt(a0), a1, a2, a3, a4, a5, a6);
  var makeWrapper__p_______ = (f) => (a0, a1, a2, a3, a4, a5, a6, a7) => f(BigInt(a0), a1, a2, a3, a4, a5, a6, a7);
  var makeWrapper__p________ = (f) => (a0, a1, a2, a3, a4, a5, a6, a7, a8) => f(BigInt(a0), a1, a2, a3, a4, a5, a6, a7, a8);
  var makeWrapper__p___________ = (f) => (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) => f(BigInt(a0), a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  var makeWrapper__p____________ = (f) => (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) => f(BigInt(a0), a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  var makeWrapper__p_________ = (f) => (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) => f(BigInt(a0), a1, a2, a3, a4, a5, a6, a7, a8, a9);

  wasmExports['pthread_self'] = makeWrapper_p(wasmExports['pthread_self']);
  wasmExports['strerror'] = makeWrapper_p_(wasmExports['strerror']);
  wasmExports['malloc'] = makeWrapper_pp(wasmExports['malloc']);
  wasmExports['free'] = makeWrapper__p(wasmExports['free']);
  wasmExports['fflush'] = makeWrapper__p(wasmExports['fflush']);
  wasmExports['__main_argc_argv'] = makeWrapper___PP(wasmExports['__main_argc_argv']);
  wasmExports['_emscripten_tls_init'] = makeWrapper_p(wasmExports['_emscripten_tls_init']);
  wasmExports['emscripten_builtin_memalign'] = makeWrapper_ppp(wasmExports['emscripten_builtin_memalign']);
  wasmExports['emscripten_stack_get_base'] = makeWrapper_p(wasmExports['emscripten_stack_get_base']);
  wasmExports['emscripten_stack_get_end'] = makeWrapper_p(wasmExports['emscripten_stack_get_end']);
  wasmExports['_emscripten_run_callback_on_thread'] = makeWrapper__pp_ppp(wasmExports['_emscripten_run_callback_on_thread']);
  wasmExports['_emscripten_thread_init'] = makeWrapper__p_____(wasmExports['_emscripten_thread_init']);
  wasmExports['__set_thread_state'] = makeWrapper__p___(wasmExports['__set_thread_state']);
  wasmExports['_emscripten_run_js_on_main_thread_done'] = makeWrapper__pp_(wasmExports['_emscripten_run_js_on_main_thread_done']);
  wasmExports['_emscripten_run_js_on_main_thread'] = makeWrapper___p_p_(wasmExports['_emscripten_run_js_on_main_thread']);
  wasmExports['_emscripten_thread_free_data'] = makeWrapper__p(wasmExports['_emscripten_thread_free_data']);
  wasmExports['_emscripten_thread_exit'] = makeWrapper__p(wasmExports['_emscripten_thread_exit']);
  wasmExports['setThrew'] = makeWrapper__p_(wasmExports['setThrew']);
  wasmExports['emscripten_stack_set_limits'] = makeWrapper__pp(wasmExports['emscripten_stack_set_limits']);
  wasmExports['emscripten_stack_get_free'] = makeWrapper_p(wasmExports['emscripten_stack_get_free']);
  wasmExports['_emscripten_stack_restore'] = makeWrapper__p(wasmExports['_emscripten_stack_restore']);
  wasmExports['_emscripten_stack_alloc'] = makeWrapper_pp(wasmExports['_emscripten_stack_alloc']);
  wasmExports['emscripten_stack_get_current'] = makeWrapper_p(wasmExports['emscripten_stack_get_current']);
  wasmExports['dynCall_vjj'] = makeWrapper__p__(wasmExports['dynCall_vjj']);
  wasmExports['dynCall_v'] = makeWrapper__p(wasmExports['dynCall_v']);
  wasmExports['dynCall_ijji'] = makeWrapper__p___(wasmExports['dynCall_ijji']);
  wasmExports['dynCall_jj'] = makeWrapper__p_(wasmExports['dynCall_jj']);
  wasmExports['dynCall_vjjj'] = makeWrapper__p___(wasmExports['dynCall_vjjj']);
  wasmExports['dynCall_vj'] = makeWrapper__p_(wasmExports['dynCall_vj']);
  wasmExports['dynCall_vji'] = makeWrapper__p__(wasmExports['dynCall_vji']);
  wasmExports['dynCall_ijjij'] = makeWrapper__p____(wasmExports['dynCall_ijjij']);
  wasmExports['dynCall_ijj'] = makeWrapper__p__(wasmExports['dynCall_ijj']);
  wasmExports['dynCall_ijjj'] = makeWrapper__p___(wasmExports['dynCall_ijjj']);
  wasmExports['dynCall_vijj'] = makeWrapper__p___(wasmExports['dynCall_vijj']);
  wasmExports['dynCall_vjjjj'] = makeWrapper__p____(wasmExports['dynCall_vjjjj']);
  wasmExports['dynCall_vjjjjj'] = makeWrapper__p_____(wasmExports['dynCall_vjjjjj']);
  wasmExports['dynCall_jjj'] = makeWrapper__p__(wasmExports['dynCall_jjj']);
  wasmExports['dynCall_ijij'] = makeWrapper__p___(wasmExports['dynCall_ijij']);
  wasmExports['dynCall_iijj'] = makeWrapper__p___(wasmExports['dynCall_iijj']);
  wasmExports['dynCall_vjiiii'] = makeWrapper__p_____(wasmExports['dynCall_vjiiii']);
  wasmExports['dynCall_iji'] = makeWrapper__p__(wasmExports['dynCall_iji']);
  wasmExports['dynCall_ijiij'] = makeWrapper__p____(wasmExports['dynCall_ijiij']);
  wasmExports['dynCall_ij'] = makeWrapper__p_(wasmExports['dynCall_ij']);
  wasmExports['dynCall_iiii'] = makeWrapper__p___(wasmExports['dynCall_iiii']);
  wasmExports['dynCall_vjji'] = makeWrapper__p___(wasmExports['dynCall_vjji']);
  wasmExports['dynCall_vjjijj'] = makeWrapper__p_____(wasmExports['dynCall_vjjijj']);
  wasmExports['dynCall_i'] = makeWrapper__p(wasmExports['dynCall_i']);
  wasmExports['dynCall_vjjij'] = makeWrapper__p____(wasmExports['dynCall_vjjij']);
  wasmExports['dynCall_jjjj'] = makeWrapper__p___(wasmExports['dynCall_jjjj']);
  wasmExports['dynCall_iii'] = makeWrapper__p__(wasmExports['dynCall_iii']);
  wasmExports['dynCall_ii'] = makeWrapper__p_(wasmExports['dynCall_ii']);
  wasmExports['dynCall_jjij'] = makeWrapper__p___(wasmExports['dynCall_jjij']);
  wasmExports['dynCall_vjjji'] = makeWrapper__p____(wasmExports['dynCall_vjjji']);
  wasmExports['dynCall_ijjiii'] = makeWrapper__p_____(wasmExports['dynCall_ijjiii']);
  wasmExports['dynCall_jjjjji'] = makeWrapper__p_____(wasmExports['dynCall_jjjjji']);
  wasmExports['dynCall_ijjii'] = makeWrapper__p____(wasmExports['dynCall_ijjii']);
  wasmExports['dynCall_jjjji'] = makeWrapper__p____(wasmExports['dynCall_jjjji']);
  wasmExports['dynCall_vjii'] = makeWrapper__p___(wasmExports['dynCall_vjii']);
  wasmExports['dynCall_vjij'] = makeWrapper__p___(wasmExports['dynCall_vjij']);
  wasmExports['dynCall_j'] = makeWrapper__p(wasmExports['dynCall_j']);
  wasmExports['dynCall_ijijj'] = makeWrapper__p____(wasmExports['dynCall_ijijj']);
  wasmExports['dynCall_jjji'] = makeWrapper__p___(wasmExports['dynCall_jjji']);
  wasmExports['dynCall_vjiii'] = makeWrapper__p____(wasmExports['dynCall_vjiii']);
  wasmExports['dynCall_vij'] = makeWrapper__p__(wasmExports['dynCall_vij']);
  wasmExports['dynCall_vjid'] = makeWrapper__p___(wasmExports['dynCall_vjid']);
  wasmExports['dynCall_ijiii'] = makeWrapper__p____(wasmExports['dynCall_ijiii']);
  wasmExports['dynCall_vjijj'] = makeWrapper__p____(wasmExports['dynCall_vjijj']);
  wasmExports['dynCall_ijiiji'] = makeWrapper__p_____(wasmExports['dynCall_ijiiji']);
  wasmExports['dynCall_ijjjij'] = makeWrapper__p_____(wasmExports['dynCall_ijjjij']);
  wasmExports['dynCall_jjii'] = makeWrapper__p___(wasmExports['dynCall_jjii']);
  wasmExports['dynCall_ijjjjjj'] = makeWrapper__p______(wasmExports['dynCall_ijjjjjj']);
  wasmExports['dynCall_vjiiiiii'] = makeWrapper__p_______(wasmExports['dynCall_vjiiiiii']);
  wasmExports['dynCall_jjjiii'] = makeWrapper__p_____(wasmExports['dynCall_jjjiii']);
  wasmExports['dynCall_ijijii'] = makeWrapper__p_____(wasmExports['dynCall_ijijii']);
  wasmExports['dynCall_jjjjjj'] = makeWrapper__p_____(wasmExports['dynCall_jjjjjj']);
  wasmExports['dynCall_ijii'] = makeWrapper__p___(wasmExports['dynCall_ijii']);
  wasmExports['dynCall_vjiji'] = makeWrapper__p____(wasmExports['dynCall_vjiji']);
  wasmExports['dynCall_vjjiii'] = makeWrapper__p_____(wasmExports['dynCall_vjjiii']);
  wasmExports['dynCall_jjjjj'] = makeWrapper__p____(wasmExports['dynCall_jjjjj']);
  wasmExports['dynCall_vjjjii'] = makeWrapper__p_____(wasmExports['dynCall_vjjjii']);
  wasmExports['dynCall_vjjiji'] = makeWrapper__p_____(wasmExports['dynCall_vjjiji']);
  wasmExports['dynCall_ijjjj'] = makeWrapper__p____(wasmExports['dynCall_ijjjj']);
  wasmExports['dynCall_ijjjjj'] = makeWrapper__p_____(wasmExports['dynCall_ijjjjj']);
  wasmExports['dynCall_jjiji'] = makeWrapper__p____(wasmExports['dynCall_jjiji']);
  wasmExports['dynCall_ijjiij'] = makeWrapper__p_____(wasmExports['dynCall_ijjiij']);
  wasmExports['dynCall_jjiijj'] = makeWrapper__p_____(wasmExports['dynCall_jjiijj']);
  wasmExports['dynCall_vjjiij'] = makeWrapper__p_____(wasmExports['dynCall_vjjiij']);
  wasmExports['dynCall_vjjiiiij'] = makeWrapper__p_______(wasmExports['dynCall_vjjiiiij']);
  wasmExports['dynCall_jji'] = makeWrapper__p__(wasmExports['dynCall_jji']);
  wasmExports['dynCall_ijiji'] = makeWrapper__p____(wasmExports['dynCall_ijiji']);
  wasmExports['dynCall_ijjijj'] = makeWrapper__p_____(wasmExports['dynCall_ijjijj']);
  wasmExports['dynCall_vi'] = makeWrapper__p_(wasmExports['dynCall_vi']);
  wasmExports['dynCall_vjjijjjjj'] = makeWrapper__p________(wasmExports['dynCall_vjjijjjjj']);
  wasmExports['dynCall_ijjjji'] = makeWrapper__p_____(wasmExports['dynCall_ijjjji']);
  wasmExports['dynCall_ijjji'] = makeWrapper__p____(wasmExports['dynCall_ijjji']);
  wasmExports['dynCall_ijjjiijj'] = makeWrapper__p_______(wasmExports['dynCall_ijjjiijj']);
  wasmExports['dynCall_vjijjj'] = makeWrapper__p_____(wasmExports['dynCall_vjijjj']);
  wasmExports['dynCall_iijjijij'] = makeWrapper__p_______(wasmExports['dynCall_iijjijij']);
  wasmExports['dynCall_ijjjiij'] = makeWrapper__p______(wasmExports['dynCall_ijjjiij']);
  wasmExports['dynCall_iiiij'] = makeWrapper__p____(wasmExports['dynCall_iiiij']);
  wasmExports['dynCall_jjjjjjij'] = makeWrapper__p_______(wasmExports['dynCall_jjjjjjij']);
  wasmExports['dynCall_jjjij'] = makeWrapper__p____(wasmExports['dynCall_jjjij']);
  wasmExports['dynCall_vjjjjjj'] = makeWrapper__p______(wasmExports['dynCall_vjjjjjj']);
  wasmExports['dynCall_jjjijij'] = makeWrapper__p______(wasmExports['dynCall_jjjijij']);
  wasmExports['dynCall_jjijij'] = makeWrapper__p_____(wasmExports['dynCall_jjijij']);
  wasmExports['dynCall_vjiiiij'] = makeWrapper__p______(wasmExports['dynCall_vjiiiij']);
  wasmExports['dynCall_vjiiiii'] = makeWrapper__p______(wasmExports['dynCall_vjiiiii']);
  wasmExports['dynCall_vjiiij'] = makeWrapper__p_____(wasmExports['dynCall_vjiiij']);
  wasmExports['dynCall_vjiiiijijiji'] = makeWrapper__p___________(wasmExports['dynCall_vjiiiijijiji']);
  wasmExports['dynCall_vijjj'] = makeWrapper__p____(wasmExports['dynCall_vijjj']);
  wasmExports['dynCall_vjjijjj'] = makeWrapper__p______(wasmExports['dynCall_vjjijjj']);
  wasmExports['dynCall_jjjiiiijjijjj'] = makeWrapper__p____________(wasmExports['dynCall_jjjiiiijjijjj']);
  wasmExports['dynCall_vjjii'] = makeWrapper__p____(wasmExports['dynCall_vjjii']);
  wasmExports['dynCall_ijjiiiijiiii'] = makeWrapper__p___________(wasmExports['dynCall_ijjiiiijiiii']);
  wasmExports['dynCall_vijji'] = makeWrapper__p____(wasmExports['dynCall_vijji']);
  wasmExports['dynCall_ijjiiiij'] = makeWrapper__p_______(wasmExports['dynCall_ijjiiiij']);
  wasmExports['dynCall_jjijj'] = makeWrapper__p____(wasmExports['dynCall_jjijj']);
  wasmExports['dynCall_ijjjjii'] = makeWrapper__p______(wasmExports['dynCall_ijjjjii']);
  wasmExports['dynCall_iij'] = makeWrapper__p__(wasmExports['dynCall_iij']);
  wasmExports['dynCall_ji'] = makeWrapper__p_(wasmExports['dynCall_ji']);
  wasmExports['dynCall_vjjjjjjj'] = makeWrapper__p_______(wasmExports['dynCall_vjjjjjjj']);
  wasmExports['dynCall_iiiii'] = makeWrapper__p____(wasmExports['dynCall_iiiii']);
  wasmExports['dynCall_vjiijj'] = makeWrapper__p_____(wasmExports['dynCall_vjiijj']);
  wasmExports['dynCall_vjjjji'] = makeWrapper__p_____(wasmExports['dynCall_vjjjji']);
  wasmExports['dynCall_vjjjjji'] = makeWrapper__p______(wasmExports['dynCall_vjjjjji']);
  wasmExports['dynCall_vjjjjjii'] = makeWrapper__p_______(wasmExports['dynCall_vjjjjjii']);
  wasmExports['dynCall_vjjjjiii'] = makeWrapper__p_______(wasmExports['dynCall_vjjjjiii']);
  wasmExports['dynCall_ijjjjjij'] = makeWrapper__p_______(wasmExports['dynCall_ijjjjjij']);
  wasmExports['dynCall_ijjjjjjj'] = makeWrapper__p_______(wasmExports['dynCall_ijjjjjjj']);
  wasmExports['dynCall_jij'] = makeWrapper__p__(wasmExports['dynCall_jij']);
  wasmExports['dynCall_viijjij'] = makeWrapper__p______(wasmExports['dynCall_viijjij']);
  wasmExports['dynCall_ijijjjjj'] = makeWrapper__p_______(wasmExports['dynCall_ijijjjjj']);
  wasmExports['dynCall_ijjjjji'] = makeWrapper__p______(wasmExports['dynCall_ijjjjji']);
  wasmExports['dynCall_ijjjjij'] = makeWrapper__p______(wasmExports['dynCall_ijjjjij']);
  wasmExports['dynCall_ijjiiij'] = makeWrapper__p______(wasmExports['dynCall_ijjiiij']);
  wasmExports['dynCall_jjjjjijj'] = makeWrapper__p_______(wasmExports['dynCall_jjjjjijj']);
  wasmExports['dynCall_ijjjjjjii'] = makeWrapper__p________(wasmExports['dynCall_ijjjjjjii']);
  wasmExports['dynCall_ijjjjjijj'] = makeWrapper__p________(wasmExports['dynCall_ijjjjjijj']);
  wasmExports['dynCall_ijjiji'] = makeWrapper__p_____(wasmExports['dynCall_ijjiji']);
  wasmExports['dynCall_jjiiiiijj'] = makeWrapper__p________(wasmExports['dynCall_jjiiiiijj']);
  wasmExports['dynCall_jjjjjjj'] = makeWrapper__p______(wasmExports['dynCall_jjjjjjj']);
  wasmExports['dynCall_vjiiijj'] = makeWrapper__p______(wasmExports['dynCall_vjiiijj']);
  wasmExports['dynCall_vjijjji'] = makeWrapper__p______(wasmExports['dynCall_vjijjji']);
  wasmExports['dynCall_ijjiiiiiii'] = makeWrapper__p_________(wasmExports['dynCall_ijjiiiiiii']);
  wasmExports['dynCall_ijjjjjii'] = makeWrapper__p_______(wasmExports['dynCall_ijjjjjii']);
  wasmExports['dynCall_iijjj'] = makeWrapper__p____(wasmExports['dynCall_iijjj']);
  wasmExports['dynCall_jjjiij'] = makeWrapper__p_____(wasmExports['dynCall_jjjiij']);
  wasmExports['dynCall_ijdiiiii'] = makeWrapper__p_______(wasmExports['dynCall_ijdiiiii']);
  wasmExports['asyncify_start_unwind'] = makeWrapper__p(wasmExports['asyncify_start_unwind']);
  wasmExports['asyncify_start_rewind'] = makeWrapper__p(wasmExports['asyncify_start_rewind']);
  return wasmExports;
}


// include: postamble.js
// === Auto-generated postamble setup entry stuff ===

var calledRun;

function callMain(args = []) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
  assert(typeof onPreRuns === 'undefined' || onPreRuns.length == 0, 'cannot call main when preRun functions remain to be called');

  var entryFunction = __emscripten_proxy_main;

  // With PROXY_TO_PTHREAD make sure we keep the runtime alive until the
  // proxied main calls exit (see exitOnMainThread() for where Pop is called).
  runtimeKeepalivePush();

  args.unshift(thisProgram);

  var argc = args.length;
  var argv = stackAlloc((argc + 1) * 8);
  var argv_ptr = argv;
  for (var arg of args) {
    HEAPU64[((argv_ptr)/8)] = BigInt(stringToUTF8OnStack(arg));
    argv_ptr += 8;
  }
  HEAPU64[((argv_ptr)/8)] = 0n;

  try {

    var ret = entryFunction(argc, BigInt(argv));

    // if we're not running an evented main loop, it's time to exit
    exitJS(ret, /* implicit = */ true);
    return ret;
  } catch (e) {
    return handleException(e);
  }
}

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  // See $establishStackSpace for the equivalent code that runs on a thread
  assert(!ENVIRONMENT_IS_PTHREAD);
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

async function run(args = programArgs) {
  assert(!calledRun);
  calledRun = true;

  if ((ENVIRONMENT_IS_PTHREAD)) {
    initRuntime();
    return;
  }

  stackCheckInit();

  preRun();

  if (runDependencies) {
    await resolveRunDependencies();
  }

  var setStatus = Module['setStatus'];
  if (setStatus) {
    setStatus('Running...');
    // Yield to the event loop to allow the browser to paint "Running..."
    await new Promise((resolve) => setTimeout(resolve, 1));
    // Then we want to clear the status text, but only after the rest of this function runs.
    setTimeout(setStatus, 1, '');
  }

  if (ABORT) return;

  initRuntime();

  // No ATMAINS hooks

  var noInitialRun = false;
  if (!noInitialRun) callMain(args);

  postRun();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    _fflush(0);
    // also flush in the JS FS layer
    for (var name of ['stdout', 'stderr']) {
      var info = FS.analyzePath('/dev/' + name);
      if (!info) return;
      var stream = info.object;
      var rdev = stream.rdev;
      var tty = TTY.ttys[rdev];
      if (tty?.output?.length) {
        has = true;
      }
    }
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.');
  }
}

var wasmExports;

if ((!(ENVIRONMENT_IS_PTHREAD))) {
// Call createWasm on startup if we are the main thread.
// Worker threads call this once they receive the module via postMessage

// In modularize mode the generated code is within a factory function so we
// can use await here (since it's not top-level-await).
wasmExports = await createWasm();
await run();

}

// end include: postamble.js

// include: postamble_modularize.js
// In MODULARIZE mode we wrap the generated code in a factory function
// and return either the Module itself, or a promise of the module.

// Assertion for attempting to access module properties on the incoming
// moduleArg.  In the past we used this object as the prototype of the module
// and assigned properties to it, but now we return a distinct object.  This
// keeps the instance private until it is ready (i.e the promise has been
// resolved).
for (const prop of Object.keys(Module)) {
  if (!(prop in moduleArg)) {
    Object.defineProperty(moduleArg, prop, {
      configurable: true,
      get() {
        abort(`Access to module property ('${prop}') is no longer possible via the module constructor argument; Instead, use the result of the module constructor.`)
      }
    });
  }
}
// end include: postamble_modularize.js



  return Module;
}

// Export using a UMD style export, or ES6 exports if selected
export default Module;

// Create code for detecting if we are running in a pthread.
// Normally this detection is done when the module is itself run but
// when running in MODULARIZE mode we need use this to know if we should
// run the module constructor on startup (true only for pthreads).
var isPthread = globalThis.name?.startsWith('em-pthread');

isPthread && Module();

