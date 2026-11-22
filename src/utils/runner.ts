export function buildPreviewDocument(
  html: string,
  css: string,
  js: string,
  runId: string
): string {
  // Escape closing script tags inside user JS to avoid breaking the outer <script> block
  const safeJs = js.replace(/<\/script>/gi, '<\\/script>');

  const bridgeScript = `
(function () {
  var RUN_ID = ${JSON.stringify(runId)};
  function formatArg(arg) {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return arg.stack || arg.message;
    try {
      return JSON.stringify(arg, null, 2);
    } catch (e) {
      return String(arg);
    }
  }
  function emit(level, args) {
    try {
      var message = Array.prototype.slice.call(args).map(formatArg).join(' ');
      window.parent.postMessage({
        source: 'traco-runner',
        runId: RUN_ID,
        level: level,
        message: message
      }, '*');
    } catch (err) {}
  }
  ['log', 'info', 'warn', 'error'].forEach(function (method) {
    var original = console[method];
    console[method] = function () {
      emit(method, arguments);
      if (original) {
        original.apply(console, arguments);
      }
    };
  });
  window.addEventListener('error', function (event) {
    var msg = event.message || 'Erro de execução';
    if (event.lineno) {
      msg += ' (linha ' + event.lineno + ')';
    }
    emit('error', [msg]);
  });
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason && event.reason.message ? event.reason.message : event.reason;
    emit('error', ['Promise rejeitada:', reason]);
  });
})();
`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
${css}
  </style>
</head>
<body>
${html}
  <script>${bridgeScript}</script>
  <script>
try {
${safeJs}
} catch (err) {
  console.error(err && err.message ? err.message : String(err));
}
  </script>
</body>
</html>`;
}

export function buildStandaloneHtml(
  title: string,
  html: string,
  css: string,
  js: string
): string {
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;') || 'Projeto Treks';
  const safeJs = js.replace(/<\/script>/gi, '<\\/script>');
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
  <script>
${safeJs}
  </script>
</body>
</html>
`;
}
