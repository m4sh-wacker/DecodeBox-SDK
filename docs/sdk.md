# DecodeBox JavaScript SDK

DecodeBox executes inside the consuming JavaScript runtime. Loading the single classic file
installs `globalThis.DecodeBox` synchronously. The same file runs in browsers and Java-enabled
GraalJS. The ESM file exports the same object as both `default` and `DecodeBox`, along with its
named methods. Each distribution contains the engine and its dependencies. Processing does not
fetch code, send inputs, start workers, or access browser storage.

## Load a distribution

The paths below describe the GitHub Pages build layout. The deployment observations below
record the status measured on the public site.

```html
<script src="https://decodebox.m4sh.ir/api"></script>
<script>
  DecodeBox.ready.then(async () => {
    const text = await DecodeBox.executeOperation("from-base64", "SGVsbG8=");
    console.log(text);
  });
</script>
```

```js
// GraalJS with URL loading and Java interop enabled
load("https://decodebox.m4sh.ir/api");
DecodeBox.ready.then(() => DecodeBox.executeOperation("to-base64", "Hello")).then(print);
```

```js
import DecodeBox from "https://decodebox.m4sh.ir/sdk/decodebox.mjs";
await DecodeBox.ready;
const result = await DecodeBox.bake(Uint8Array.of(0, 128, 255), [
  { opId: "gzip" },
  { opId: "gunzip" },
  { opId: "to-base64" },
]);
if (result.error) throw new Error(result.error.message);
console.log(result.output); // AID/
```

| Format | Public paths |
| --- | --- |
| Classic script | `/api`, `/api.js`, `/sdk/v1/decodebox.js`, `/sdk/decodebox.js` |
| ES module | `/sdk/v1/decodebox.esm.js`, `/sdk/decodebox.mjs` |
| ESM declarations | `/sdk/decodebox.d.mts` |

Release-specific copies are under `/sdk/v1/<engineVersion>/`. The production build creates
all paths under `dist`. Run `npm run check:sdk-dist` to verify that each file exists, is
nonempty and contains the bytes of its release-specific counterpart.

The Pages check makes a GET request to each path and records the status, Content-Type,
redirect location and whether the body matches the build. Each script, including `/api`,
must return HTTP 200 with a JavaScript MIME type. The local static server serves `/api` as
`application/octet-stream`; Chromium separately tests execution of that classic script.
When the published bytes match, the workflow tests classic scripts and ES modules in Chromium
and classic scripts in GraalJS. A published MIME mismatch fails verification even when a
runtime executes the file.

On November 28, 2026 (Tehran time), the live `/api`, `/api.js`, `/sdk/v1/decodebox.js` and
`/sdk/v1/decodebox.esm.js` returned HTTP 404 with `text/html; charset=utf-8` and no redirect.
The same site's extensionless `/CNAME` returned HTTP 200 with `application/octet-stream`.
The deployed SDK file's media type can only be measured once Pages serves that file.
Pages controls MIME mappings. The repository cannot set a Content-Type override for `/api`.
[GitHub Pages MIME documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site#mime-types-on-github-pages)

## API v1

| Member                                 | Contract                                                                                                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ready`                                | A Promise that resolves after synchronous initialization.                                                                                                                                              |
| `apiVersion`, `engineVersion`          | Independent public API version and engine release version strings.                                                                                                                                     |
| `capabilities()`                       | Reports the provider name, cryptography, secure random, compression formats, available character sets and SDK limits.                                                                                  |
| `listOperations()`, `getOperation(id)` | Synchronous detached operation metadata with defaults, options, formats and numeric ranges. Lookup returns null for an unknown ID.                                                                     |
| `executeOperation(id, input, args?)`   | Promise of the engine's string output. Rejects on failure.                                                                                                                                             |
| `bake(input, recipe)`                  | Promise of a result containing output, type, byte length, elapsed milliseconds and completed operation IDs. Steps can be SDK steps, engine steps from detection, or a saved object with a steps array. |
| `detect(input)`                        | Ranked encoding candidates with evidence, previews and executable steps.                                                                                                                               |
| `autoDecode(input, options?)`          | A tree of decoded layers and stopping reasons. Options include maxDepth, budgetMs and threshold.                                                                                                       |
| `identify(input)`                      | Hash identification or null.                                                                                                                                                                           |
| `analyse(input, options?)`             | Analysis tree, indicators, findings and truncation state. Accepts decode bounds and maxNodes.                                                                                                          |
| `inspect(input, {decode?, analyse?}?)` | Decoded root and analysis in one call.                                                                                                                                                                 |
| `hints(input, options?)`               | Local CTF flags and hints. Options include format, maxDepth and budgetMs.                                                                                                                              |

Pass a `Uint8Array` or `ArrayBuffer` for exact bytes. Typed-array slices retain their offset
and length. Strings follow the existing engine convention. Characters in U+0000 through U+00FF
can represent individual bytes. Use explicitly UTF-8 encoded bytes for Unicode text where this
distinction matters. For binary output, each character's code unit represents one byte.

Argument names and option values are case-sensitive. Omitted arguments take their registry
defaults. A toggle argument accepts its value or an object such as
`{value: 'abcd', format: 'Hex'}`. A disabled recipe step accepts `disabled: true`. Flow-control
operations execute within recipes. For example, a jump resolves a label in the same recipe.

Malformed SDK inputs reject with a `DecodeBoxError` and a stable `code` of `INVALID_INPUT`,
`UNKNOWN_OPERATION` or `LIMIT_EXCEEDED`. A failed operation rejects `executeOperation` with
`OPERATION_FAILED`. During baking, an engine step failure is reported at
`result.error.stepIndex` with its message. Error messages are for people. The bundled
TypeScript declarations describe all result fields.

## Engine and runtime boundaries

The SDK imports the same registry, recipe interpreter and analysis functions as the browser
workbench. The application retains its worker client. The SDK loads the shared engine directly.
Engine modules call the internal runtime provider for host-specific services. Adding a provider
involves implementing that interface and selecting it during startup, before the registry
probes available character sets.

| Service                     | Web provider                                                                               | GraalJS provider                                                                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cryptography and random     | Web Crypto and native secure random                                                        | JCA digests, MACs, ciphers, signatures, key factories and SecureRandom. PBKDF2 preserves binary passwords. EC public-point recovery from a private scalar uses the bundled NIST curve implementation. |
| Text, Base64 and URLs       | Native text codecs, Base64, URL and URLSearchParams                                        | Bundled WHATWG-compatible text and URL implementations and Java Base64.                                                                                                                               |
| Binary data, ZIP and images | Typed arrays, DataView and bounded compression streams. Blob provides a local byte stream. | Typed arrays and signed Java byte arrays at the JVM boundary. Java gzip, deflate and inflate streams.                                                                                                 |
| Timers and async            | Monotonic performance clock, promises and native timers                                    | System.nanoTime and promises on the context-owning thread. The sleep operation blocks that thread for its requested interval.                                                                         |

Named time zones use browser Intl or Java time-zone rules. The Java provider obtains zone IDs,
offsets and abbreviations from the JDK time-zone database, including daylight-saving transitions.

File and image operations consume bytes in memory. ZIP entry selection returns bytes. No
operation extracts paths to disk. The engine's PNG/BMP processing uses typed arrays. The SDK
needs no canvas, DOM, File object, Node Buffer, or filesystem access during processing.

Input is bounded to 4 MiB of bytes or UTF-16 string units and recipes to 128 steps. Expanded
streams and step outputs have a 16 MiB limit. PNG, archive and password-hashing algorithms
additionally enforce format-specific bounds. Capability discovery reports available text
encodings. Legacy cryptography remains available for format compatibility. Time checks cannot
preempt arbitrary synchronous JavaScript or a host crypto call. Embedders needing a hard CPU or
heap limit for untrusted recipes should isolate the worker or JVM context and enforce the limit
there.

## Browser, GraalJS and ZAP tests

```sh
npm ci
npm run typecheck
npm run lint
npm test -- --run
npm run build
npm run test:endpoints
npm run test:sdk
npm run test:app
mvn -f tests/sdk/pom.xml dependency:copy-dependencies
npm run test:graaljs
```

The integration harness uses Python 3's static file server on an ephemeral loopback port.
Install Chromium or set `CHROME_PATH` to its executable. On systems where Python is named
python3, set `PYTHON=python3`. Use JDK 21 or newer and Maven for the pinned GraalJS
distribution. Alternatively set `GRAALJS_CLASSPATH` to an installed GraalJS runtime classpath.
Set `JAVA` to select a particular JDK executable.

GraalJS hosts control access to Java classes, members and I/O. The remote loading test enables
the experimental `js.load-from-url` option and host I/O. A trusted local bundle also works with
file loading. The Java runner is a test harness for trusted scripts. It grants host access to
exercise JCA and compression. Review your embedding application's host permissions before
loading code. SDK promises settle at GraalJS microtask checkpoints.

For ZAP, set `ZAP_JAR` to the installed ZAP jar and run `npm run test:zap`. The harness creates
a temporary ZAP home, runs the Automation Framework in command mode, and checks the example's
output and the complete matrix. The tested installation includes the GraalJS, Script Console
and Automation Framework add-ons. The example reads `DECODEBOX_SDK` as an absolute local
filename or a URL. Download and verify a trusted local build when the host restricts URL
loading. The example can also run from the Stand Alone script console.
[ZAP standalone example](../examples/zap/standalone.js) ·
[Automation plan](../examples/zap/plan.yaml) ·
[ZAP script job reference](https://www.zaproxy.org/docs/desktop/addons/script-console/automation/)

Run `npm run report:sdk` after all three runtime suites to generate the operation-by-operation
Markdown report in `docs/sdk-compatibility.md`. Set `SDK_BASE_URL` to a deployed origin
when running the endpoint, browser and
GraalJS checks to verify that site. The endpoint check compares the served files with the local
build, and records the exact host results under `test-results`.

## London clock changes and regression checks

On November 28, 2026 (Tehran time), a focused run of the shared timezone check passed all
12 assertions in each of Chromium, standalone GraalJS and ZAP 2.17.0. Six UTC instants were
converted to London time and back using the explicit numeric offset. The winter and summer
samples returned +00:00 and +01:00 respectively. The transition cases produced these results.

| UTC instant | Europe/London result |
| --- | --- |
| 2024-03-31 00:59:59 | 2024-03-31 00:59:59 +00:00 |
| 2024-03-31 01:00:00 | 2024-03-31 02:00:00 +01:00 |
| 2024-10-27 00:59:59 | 2024-10-27 01:59:59 +01:00 |
| 2024-10-27 01:00:00 | 2024-10-27 01:00:00 +00:00 |

The three full fixture runs passed the PBKDF2 known answer, binary and Unicode password
checks, and the RFC 7914 scrypt vector. Both Bombe fixtures found rotor order I II III at
position ABC. They checked the reports for 17,576 positions with one order and 35,152 with
two orders. Each fixture run used the classic bundle identified in the compatibility report.

## Deployment observation on November 27, 2026

The live root page matched the Git blob for `index.html` in the fork's `gh-pages` commit
`a4fb0386aad97919257593d3da99f189ffce8b3f`. That commit contains the custom domain
`decodebox.m4sh.ir`, the workbench and its assets. Its tree has no `api` file or `sdk/`
directory. GET requests to the seven SDK paths returned HTTP 404, HTML and no redirect.
Chromium blocked the cross-origin classic script response and GraalJS URL loading failed. The
branch implementation is available in the local build. Its GitHub Pages execution remains
unverified.

A second GET check on November 28 at 02:42 Tehran time returned HTTP 200 for the root and
HTTP 404 for all seven SDK paths. Each SDK response had Content-Type `text/html; charset=utf-8`
and no redirect. The root still matched the same `gh-pages` commit.
