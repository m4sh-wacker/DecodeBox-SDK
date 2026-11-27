const System = Java.type('java.lang.System');
const Files = Java.type('java.nio.file.Files');
const Path = Java.type('java.nio.file.Path');
const testDir = Path.of(System.getenv('DECODEBOX_TEST_DIR'));
load(String(System.getenv('DECODEBOX_SDK')));
load(String(testDir.resolve('check.js')));
const fixtures = JSON.parse(String(Files.readString(testDir.resolve('fixtures.json'))));
runSdkTests(DecodeBox, fixtures)
  .then((report) => {
    report.runtime = 'zap-graaljs';
    report.java = String(System.getProperty('java.version'));
    Files.writeString(Path.of(System.getenv('DECODEBOX_TEST_REPORT')), JSON.stringify(report));
  })
  .catch((error) => print('ZAP integration suite failed: ' + String(error)));
