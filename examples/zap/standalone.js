// Load this as a Stand Alone script using ECMAScript : Graal.js.
const sdkPath = Java.type('java.lang.System').getenv('DECODEBOX_SDK');
load(sdkPath ? String(sdkPath) : 'https://decodebox.m4sh.ir/api');
DecodeBox.ready
  .then(async () => {
    const decoded = await DecodeBox.executeOperation('from-base64', 'SGVsbG8gWkFQ');
    if (decoded !== 'Hello ZAP') throw new Error('Unexpected decoded text');
    const digest = await DecodeBox.executeOperation('sha-256', 'abc');
    if (digest !== 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
      throw new Error('Digest mismatch');
    print(
      'DecodeBox ZAP check passed (' +
        DecodeBox.capabilities().runtime +
        ', ' +
        DecodeBox.listOperations().length +
        ' operations)',
    );
  })
  .catch((error) => {
    print('DecodeBox ZAP check failed: ' + error);
  });
