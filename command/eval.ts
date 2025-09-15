import util from "util";
import type { ExtendedMessage } from "./types";
import { config } from "../config/config.ts";

export const evalPrefix = ["=>", ">", "$", "§"] as const;

export async function runEval(
  rrykarl: any,
  m: ExtendedMessage,
  text: string
): Promise<boolean | void> {
  try {
    const isEval = evalPrefix.find(p => text.startsWith(p));
    if (!isEval) return;

    const code = text.slice(isEval.length).trim();
    let result: unknown;

    if (isEval === "=>") {
      result = await eval(`(async () => { ${code} })()`);
    } else if (isEval === ">") {
      const needsBlock =
        /(^|\s)(const|let|var|function|class)\s/.test(code) ||
        code.includes(";");

      if (needsBlock) {
        result = eval(`{ ${code} }`);
      } else {
        result = eval(code);
      }
    } else if (isEval === "$") {
      await rrykarl.sendMessage(m.chat, { text: "executing!" }, { quoted: m });

      const { exec } = await import("child_process");
      return exec(code, (err, stdout, stderr) => {
        const output =
          err?.message || stderr?.trim() || stdout?.trim() || "No output.";

        rrykarl.sendMessage(m.chat, { text: output }, { quoted: m });
      });
    } else if (isEval === "§") {
      await rrykarl.sendMessage(m.chat, { text: "executing!" }, { quoted: m });

      const { exec } = await import("child_process");
      const shellCommand = code.replace(/^curl\b/, "curl -s");

      return exec(shellCommand, { shell: true }, (err, stdout, stderr) => {
        let output = stdout.trim() || stderr.trim() || "No output.";

        try {
          const parsed = JSON.parse(stdout.trim());
          output = JSON.stringify(parsed, null, 2);
        } catch {}

        if (err) output = `Error:\n${err.message}`;

        rrykarl.sendMessage(m.chat, { text: output }, { quoted: m });
      });
    }

    if (typeof result !== "string") {
      result = util.inspect(result, { depth: 2, compact: false });
    }

    await rrykarl.sendMessage(
      m.chat,
      { text: (result as string) || "undefined" },
      { quoted: m }
    );

    return true;
  } catch (err: any) {
    await rrykarl.sendMessage(
      m.chat,
      { text: `Error: ${err.message}` },
      { quoted: m }
    );
    return true;
  }
}