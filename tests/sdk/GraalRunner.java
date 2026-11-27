import java.nio.file.Files;
import java.nio.file.Path;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.HostAccess;
import org.graalvm.polyglot.Value;
import org.graalvm.polyglot.io.IOAccess;

/** Runs only the supplied SDK and test sources. Use a dedicated test JVM. */
class GraalRunner {
    public static void main(String[] args) throws Exception {
        try (var context = Context.newBuilder("js").allowHostAccess(HostAccess.ALL)
                .allowHostClassLookup(name -> name.startsWith("java.") || name.startsWith("javax.crypto.") || name.equals("char") || name.equals("char[]") || name.equals("[C") || name.equals("byte") || name.equals("byte[]") || name.equals("[B"))
                .allowIO(IOAccess.ALL).allowExperimentalOptions(true)
                .option("js.load-from-url", "true").build()) {
            context.getBindings("js").putMember("sdkLocation", args[0]);
            context.eval("js", "load(sdkLocation)");
            System.out.println("GraalJS / " + Context.class.getProtectionDomain().getCodeSource().getLocation().getFile().replaceAll("^.*/", "") + " / Java " + System.getProperty("java.version"));
            for (int i = 1; i < args.length; i++) {
                context.eval("js", Files.readString(Path.of(args[i])));
            }
            if (args.length > 1) {
                context.getBindings("js").putMember("fixtureJson", Files.readString(Path.of("tests/sdk/fixtures.json")));
                context.eval("js", "runSdkTests(DecodeBox, JSON.parse(fixtureJson)).then(r => globalThis.sdkReport = JSON.stringify(r))");
            } else {
                context.eval("js", "DecodeBox.ready.then(() => DecodeBox.executeOperation('to-base64','ABC')).then(r => {if(r === 'QUJD') globalThis.sdkReport = '{}'})");
            }
            Value result = context.getBindings("js").getMember("sdkReport");
            if (result == null || !result.isString()) throw new AssertionError("SDK tests did not settle");
            System.out.println(result.asString());
        }
    }
}
