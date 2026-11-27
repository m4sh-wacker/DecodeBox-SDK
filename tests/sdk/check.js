// Loaded unchanged in Chromium and the Graal context. Only public SDK calls are used.
async function checkLondonTime(sdk, equal) {
  const format = 'YYYY-MM-DD HH:mm:ss';
  const args = {
    'Input format string': format,
    'Output format string': format + ' Z',
    'Input timezone': 'UTC',
    'Output timezone': 'Europe/London',
  };
  const reverse = {
    'Input format string': format + ' Z',
    'Output format string': format,
    'Input timezone': 'Europe/London',
    'Output timezone': 'UTC',
  };
  for (const [utc, london] of [
    ['2024-01-01 12:00:00', '2024-01-01 12:00:00 +00:00'],
    ['2024-07-01 12:00:00', '2024-07-01 13:00:00 +01:00'],
    ['2024-03-31 00:59:59', '2024-03-31 00:59:59 +00:00'],
    ['2024-03-31 01:00:00', '2024-03-31 02:00:00 +01:00'],
    ['2024-10-27 00:59:59', '2024-10-27 01:59:59 +01:00'],
    ['2024-10-27 01:00:00', '2024-10-27 01:00:00 +00:00'],
  ]) {
    const local = await sdk.executeOperation('translate-datetime-format', utc, args);
    equal(local, london);
    equal(await sdk.executeOperation('translate-datetime-format', local, reverse), utc);
  }
}

globalThis.runSdkTests = async function (sdk, fixtures) {
  await sdk.ready;
  const report = { runtime: sdk.capabilities().runtime, operations: {}, checks: {} };
  const exec = (...args) => sdk.executeOperation(...args);
  function assert(ok, message) {
    if (!ok) throw new Error(message);
  }
  function equal(actual, expected) {
    if (actual !== expected)
      throw new Error(
        'Expected ' +
          JSON.stringify(expected)?.slice(0, 140) +
          ', got ' +
          JSON.stringify(actual)?.slice(0, 140),
      );
  }
  async function rejects(fn, code) {
    try {
      await fn();
    } catch (err) {
      equal(err.code, code);
      return;
    }
    throw new Error('Expected rejection with ' + code);
  }
  const definitions = sdk.listOperations();
  const properties = {
    now: (out) => Math.abs(Number(out) - Math.floor(Date.now() / 1000)) <= 2,
    'generate-key': (out) => /^[a-f0-9]{64}$/.test(out),
    'generate-iv': (out) => /^[a-f0-9]{32}$/.test(out),
    'random-bytes': (out) => /^[a-f0-9]{16}$/.test(out),
    'generate-password': (out) => out.length === 19 && /^[!-~]+$/.test(out),
    'generate-uuid': (out) =>
      out.split('\n').length === 2 &&
      new Set(out.split('\n')).size === 2 &&
      out
        .split('\n')
        .every((s) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(s),
        ),
    'pseudo-random-number-generator': (out) => /^[a-f0-9]{32}$/.test(out),
    'pseudo-random-integer-generator': (out) =>
      out.split(' ').length === 50 && out.split(' ').every((s) => /^[1-6]$/.test(s)),
    'pseudo-random-prime-generator': async (out) =>
      BigInt(out).toString(2).length === 128 &&
      /prime/i.test(await exec('primality-test', out)) &&
      !/composite/i.test(await exec('primality-test', out)),
    shuffle: (out, d) =>
      out.split('\n').sort().join('\n') === d.input.split('\n').sort().join('\n'),
    numberwang: (out, d) =>
      d.input === ''
        ? out === "Let's play Wangernumb!"
        : [
            d.input + ' is Numberwang!',
            'Sorry, ' + d.input + " is not Numberwang. Let's rotate the board!",
          ].includes(out),
    'rsa-encrypt': async (out, d) =>
      (await exec('rsa-decrypt', out, fixtures['rsa-decrypt'].args)) === d.input,
    'ecdsa-sign': async (out, d) =>
      (
        await exec('ecdsa-verify', d.input, {
          ...fixtures['ecdsa-verify'].args,
          Signature: out,
          'Signature format': 'Hex',
        })
      ).startsWith('Verified:'),
    'ciphersaber2-encrypt': async (out, d) =>
      (await exec('ciphersaber2-decrypt', out, d.args)) === d.input,
    'fernet-encrypt': async (out, d) =>
      (await exec('fernet-decrypt', out, { Key: d.args.Key })) === d.input,
  };
  for (const [gen, sign, verify] of [
    ['generate-rsa-key-pair', 'rsa-sign', 'rsa-verify'],
    ['generate-ecdsa-key-pair', 'ecdsa-sign', 'ecdsa-verify'],
  ]) {
    properties[gen] = async (out, d) => {
      const [pub, priv] = out.split('\n-----BEGIN PRIVATE KEY-----\n');
      const args = d.args?.Curve ? { Curve: d.args.Curve } : {};
      const sig = await exec(sign, 'SDK key check', {
        ...args,
        Key: '-----BEGIN PRIVATE KEY-----\n' + priv,
      });
      return (
        await exec(verify, 'SDK key check', { ...args, Key: pub, Signature: sig })
      ).startsWith('Verified:');
    };
  }
  async function checkPng(out, expected) {
    equal(out.slice(0, 8), '\x89PNG\r\n\x1a\n');
    function u32(i) {
      return (
        ((out.charCodeAt(i) * 256 + out.charCodeAt(i + 1)) * 256 + out.charCodeAt(i + 2)) * 256 +
        out.charCodeAt(i + 3)
      );
    }
    equal(u32(16), expected.width);
    equal(u32(20), expected.height);
    let compressed = '';
    for (let i = 8; i < out.length; ) {
      const size = u32(i);
      assert(i + 12 + size <= out.length, 'Truncated PNG chunk');
      if (out.slice(i + 4, i + 8) === 'IDAT') compressed += out.slice(i + 8, i + 8 + size);
      i += 12 + size;
    }
    equal(await exec('sha-256', await exec('zlib-inflate', compressed)), expected.scanlineSha256);
  }
  for (const op of definitions) {
    try {
      const d = fixtures[op.id];
      assert(d, 'Missing fixture');
      equal(sdk.getOperation(op.id)?.name, op.name);
      let out;
      if (d.steps) {
        const baked = await sdk.bake(d.input, d.steps);
        assert(!baked.error, baked.error?.message);
        assert(baked.completedOperations.includes(op.id), 'Step did not execute');
        out = baked.output;
      } else out = await exec(op.id, d.input, d.args);
      if ('expected' in d) equal(out, d.expected);
      else if (d.inverse) equal(await exec(d.inverse, out, d.inverseArgs), d.input);
      else if (d.property)
        assert(await properties[d.property](out, d), 'Failed property ' + d.property);
      else if (d.rotorReport) {
        const normalized = (value) =>
          value.replace(
            /([\d,]+) rotor positions/,
            (_, count) => count.replaceAll(',', '') + ' rotor positions',
          );
        equal(normalized(out), normalized(d.rotorReport));
      } else if (d.utcReport) {
        const lines = out.split('\n');
        const date = new Date(d.utcReport.split('\n')[0].slice('ISO 8601:'.length).trim());
        equal(
          lines
            .find((l) => l.startsWith('Local:'))
            ?.slice(6)
            .trim(),
          date.toString(),
        );
        const relative =
          lines
            .find((l) => l.startsWith('Relative:'))
            ?.slice(9)
            .trim() ?? '';
        assert(
          /^(just now|\d+ (year|month|day|hour|minute|second)s? (ago|from now))$/.test(relative),
          'Invalid relative time',
        );
        equal(
          lines.filter((l) => !l.startsWith('Local:') && !l.startsWith('Relative:')).join('\n'),
          d.utcReport,
        );
      } else if (d.json) {
        const obj = JSON.parse(out);
        equal(Object.keys(obj).sort().join(','), Object.keys(d.json).sort().join(','));
        for (const k of Object.keys(d.json))
          equal(JSON.stringify(obj[k]), JSON.stringify(d.json[k]));
      } else if (d.png) await checkPng(out, d.png);
      else if (d.contains) assert(out.includes(d.contains), 'Missing ' + d.contains);
      else throw new Error('Fixture has no assertion');
      report.operations[op.id] = 'pass';
    } catch (e) {
      report.operations[op.id] = 'FAIL: ' + String(e);
    }
  }
  async function check(name, fn) {
    try {
      await fn();
      report.checks[name] = 'pass';
    } catch (e) {
      report.checks[name] = 'FAIL: ' + String(e);
    }
  }
  await check('registry', () => {
    equal(new Set(definitions.map((o) => o.id)).size, definitions.length);
    equal(definitions.length, Object.keys(fixtures).length);
    assert(/^1\./.test(sdk.apiVersion) && !!sdk.engineVersion, 'Missing SDK version');
    equal(sdk.getOperation('no-such-id'), null);
  });
  await check('binary views', async () => {
    const view = Uint8Array.of(99, 0, 128, 255, 99).subarray(1, 4);
    equal(await exec('to-base64', view), 'AID/');
    equal(await exec('from-base64', 'AID/'), '\x00\x80\xff');
  });
  await check('async recipe', async () => {
    const p = exec('sleep', 'awake', { 'Time (ms)': 5 });
    assert(typeof p.then === 'function', 'Promise required');
    equal(await p, 'awake');
  });
  await check('random', async () =>
    assert(
      (await exec('generate-key', '')) !== (await exec('generate-key', '')),
      'RNG repeated an AES key',
    ),
  );
  await check('SHA-256 KAT', async () =>
    equal(
      await exec('sha-256', 'abc'),
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    ),
  );
  await check('PBKDF2 binary and Unicode passwords', async () => {
    const params = { Salt: 'salt', Iterations: 2, 'Key length (bits)': 256, Hash: 'SHA-256' };
    equal(
      await exec('pbkdf2', 's\u{1F30D}cret', params),
      'e3a2ec48dffe15a4fccb55720c77a99b96a6e0057ba7a4fa5cdaa79c9688d1ff',
    );
    equal(
      await exec('pbkdf2', Uint8Array.of(255, 0, 128), params),
      '814cccd59a8ada6c16dc3d7e72f2ed60185e4bbd2b86e20f26ad8926e130fb33',
    );
  });
  await check('AES-GCM authentication and CTR counter wrap', async () => {
    const Key = '00'.repeat(16),
      IV = '00'.repeat(12);
    const gcm = await exec('aes-encrypt', new Uint8Array(16), { Key, IV, Mode: 'AES-GCM' });
    equal(gcm, '0388dace60b6a392f328c2b971b2fe78ab6e47d42cec13bdf53a67b21257bddf');
    await rejects(
      () => exec('aes-decrypt', gcm.slice(0, -2) + '00', { Key, IV, Mode: 'AES-GCM' }),
      'OPERATION_FAILED',
    );
    equal(
      await exec('aes-encrypt', new Uint8Array(32), {
        Key,
        IV: '1122334455667788ffffffffffffffff',
        Mode: 'AES-CTR',
      }),
      '94ea0a8d90cd88cd642281b3f5d075b268e7c4edcec7e9eff20ac2318f607faf',
    );
  });
  await check('RSA-PSS verify and reject', async () => {
    const signing = { Key: fixtures['rsa-sign'].args.Key, Scheme: 'PSS' };
    const signature = await exec('rsa-sign', 'original', signing);
    const verify = { Key: fixtures['rsa-verify'].args.Key, Scheme: 'PSS', Signature: signature };
    assert(
      (await exec('rsa-verify', 'original', verify)).startsWith('Verified:'),
      'Signature rejected',
    );
    assert(
      (await exec('rsa-verify', 'changed', verify)).startsWith('Not verified'),
      'Changed message verified',
    );
  });
  await check('private EC JWK round trip', async () => {
    const pem = fixtures['ecdsa-sign'].args.Key;
    const jwk = JSON.parse(await exec('pem-to-jwk', pem));
    const expected = fixtures['pem-to-jwk'].json;
    equal(jwk.x, expected.x);
    equal(jwk.y, expected.y);
    const encoded = await exec('jwk-to-pem', JSON.stringify(jwk));
    const signature = await exec('ecdsa-sign', 'EC fixture', { Key: encoded });
    const verified = await exec('ecdsa-verify', 'EC fixture', {
      Key: fixtures['ecdsa-verify'].args.Key,
      Signature: signature,
    });
    assert(verified.startsWith('Verified:'), 'Converted private EC key failed');
    await rejects(
      () => exec('jwk-to-pem', JSON.stringify({ ...jwk, ext: false })),
      'OPERATION_FAILED',
    );
  });
  await check('IANA daylight saving rules', () => checkLondonTime(sdk, equal));
  await check('analysis methods', async () => {
    const input = 'SGVsbG8gRGVjb2RlQm94IQ==';
    assert((await sdk.detect(input)).length, 'No encoding detected');
    assert((await sdk.autoDecode(input)).children.length, 'No decoded layer');
    assert(
      (await sdk.identify('5d41402abc4b2a76b9719d911017c592')).matches.length,
      'Hash unidentified',
    );
    assert((await sdk.analyse(input)).nodes > 0, 'Empty analysis');
    assert((await sdk.inspect(input)).analysis.nodes > 0, 'Empty inspection');
    assert((await sdk.hints('flag{decodebox}')).flags.length, 'Missing flag');
  });
  await check('invalid inputs and limits', async () => {
    await rejects(() => exec('unknown', 'abc'), 'UNKNOWN_OPERATION');
    await rejects(() => exec('gzip', {}), 'INVALID_INPUT');
    await rejects(() => exec('gunzip', 'damaged'), 'OPERATION_FAILED');
    await rejects(
      () => exec('gzip', 'x'.repeat(sdk.capabilities().maxInputLength + 1)),
      'LIMIT_EXCEEDED',
    );
    await rejects(() => exec('random-bytes', '', { Bytes: -1 }), 'INVALID_INPUT');
    const r = await sdk.bake('bad', [{ opId: 'gunzip' }]);
    equal(r.error.stepIndex, 0);
  });
  return report;
};
