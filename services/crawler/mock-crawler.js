const { runPipeline } = require('./pipeline'); const r = runPipeline(); console.log(JSON.stringify(r, null, 2)); process.exit(r.ok ? 0 : 1);
