import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  jidDecode
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import chalk from "chalk";
import readline from "readline";
import fs from "fs";
import path from "path";
import NodeCache from "node-cache";
import { handleMessage } from "../handle/func.ts";
import { runEval, evalPrefix } from "../command/eval.ts";
import { HandleCase } from "../command/case.ts";
import { config } from "../config/config.ts";

const SESS_DIR = "rrykarl_sessi";
const NUM_FILE = path.join(SESS_DIR, "number.txt");
const groupCache = new NodeCache({ stdTTL: 30 * 60, useClones: false });

const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

function question(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function getNumber(): Promise<string> {
  if (fs.existsSync(NUM_FILE)) {
    return fs.readFileSync(NUM_FILE, "utf-8").trim();
  }

  const raw = await question(
    chalk.white("Masukkan nomor WhatsApp Anda") + "\n" +
    chalk.gray("Contoh format: 628123xxxx") + "\n\n" +
    chalk.cyan("Input: ")
  );

  const number = raw.replace(/\D/g, "");
  fs.mkdirSync(SESS_DIR, { recursive: true });
  fs.writeFileSync(NUM_FILE, number);
  return number;
}

async function rrykarlStart() {
  try {
    const { state, saveCreds, cache } = await useMultiFileAuthState(SESS_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const rrykarl = makeWASocket({
      logger: pino({ level: "silent" }),
      version,
      browser: Browsers.macOS("Safari"),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }), cache)
      },
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      emitOwnEvents: true,
      syncFullHistory: true,
      cachedGroupMetadata: async (jid) => groupCache.get(jid)
    });
    
    //cek di : https://baileys.wiki/docs/migration/to-v7.0.0
    let lidStore: any = null
    try {
      lidStore = rrykarl.signalRepository?.getLIDMappingStore?.()
      if (lidStore) {
        //console.log(chalk.green("[LID] getLIDMappingStore tersedia"))
      } else {
        //console.log(chalk.yellow("[LID] getLIDMappingStore tidak tersedia"))
      }
    } catch (err) {
      //console.warn(chalk.red("[LID] Error ambil getLIDMappingStore"), err)
    }

    rrykarl.lidToJid = async (lid: string): Promise<string | null> => {
      if (!lidStore) {
        //console.log(chalk.yellow(`[LID→JID] Skip, lidStore null untuk ${lid}`))
        return null
      }
      try {
        const target = lid.endsWith("@lid") ? lid : `${lid}@lid`
        //console.log(chalk.blue(`[LID→JID] Cek: ${target}`))
        const res = await lidStore.getPNForLID(target)
        if (res) {
          //console.log(chalk.green(`[LID→JID] ${target} → ${res}`))
        } else {
          //console.log(chalk.red(`[LID→JID] Tidak ditemukan untuk: ${target}`))
        }
        return res
      } catch (err) {
        //console.error(chalk.red(`[LID→JID] Error untuk ${lid}`), err)
        return null
      }
    }

    rrykarl.jidToLid = async (jid: string): Promise<string | null> => {
      if (!lidStore) {
        //console.log(chalk.yellow(`[JID→LID] Skip, lidStore null untuk ${jid}`))
        return null
      }
      try {
        const target = jid.endsWith("@s.whatsapp.net") ? jid : `${jid}@s.whatsapp.net`
        //console.log(chalk.blue(`[JID→LID] Cek: ${target}`))
        const res = await lidStore.getLIDForPN(target)
        if (res) {
          //console.log(chalk.green(`[JID→LID] ${target} → ${res}`))
        } else {
          //console.log(chalk.red(`[JID→LID] Tidak ditemukan untuk: ${target}`))
        }
        return res
      } catch (err) {
        //console.error(chalk.red(`[JID→LID] Error untuk ${jid}`), err)
        return null
      }
    }

    rrykarl.decodeJid = async (jid?: string): Promise<string> => {
  if (!jid) return ""
  try {
    if (/^\d+@s\.whatsapp\.net$/.test(jid) || jid.endsWith("@g.us")) {
      return jid
    }
    if (jid.endsWith("@lid")) {
      const pure = jid.replace(/@lid$/, "")
      try {
        const res = await rrykarl.lidToJid(pure)
        if (res) return await rrykarl.decodeJid(res)
      } catch {
        return jid
      }
    }
    if (jid.includes(":")) {
      const base = jid.split(":")[0]
      if (/^\d+$/.test(base)) {
        const norm = base + "@s.whatsapp.net"
        return await rrykarl.decodeJid(norm)
      }
    }
    if (/^\d+@\d+$/.test(jid)) {
      const norm = jid.split("@")[0] + "@s.whatsapp.net"
      return norm
    }
    return jid
  } catch {
    return jid || ""
  }
}
    
    rrykarl.ev.on("creds.update", saveCreds);
    
    rrykarl.ev.on("lid-mapping.update", (update) => {
})

    if (!state.creds.registered) {
      (async () => {
        try {
          const number = await getNumber();
          const code = await rrykarl.requestPairingCode(number);

          console.log(chalk.yellow("\nKode Pairing Anda:\n"));
          console.log(chalk.bgBlueBright.black(` ${code} `));
          console.log(chalk.gray("\nMasukkan kode tersebut di WhatsApp Anda.\n"));
        } catch (e) {
          try { fs.rmSync(SESS_DIR, { recursive: true, force: true }); } catch {}
          setTimeout(rrykarlStart, 2000);
        }
      })();
    }
    
    rrykarl.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "connecting") {
        console.log(chalk.blueBright("Menyambungkan bot..."));
      } else if (connection === "open") {
        try {
          await rrykarl.newsletterFollow("120363407984403015@newsletter");
          await delay(1000);
          await rrykarl.newsletterFollow("120363378175074413@newsletter");
        } catch {}
        console.log(chalk.greenBright("Bot berhasil terhubung."));
      } else if (connection === "close") {
        const error = lastDisconnect?.error;
        const statusCode = (error as Boom)?.output?.statusCode;
        if (statusCode !== DisconnectReason.loggedOut) {
          setTimeout(rrykarlStart, 5000);
        } else {
          try { 
            fs.rmSync(SESS_DIR, { recursive: true, force: true }); 
          } catch {}
          setTimeout(rrykarlStart, 2000);
        }
      }
    });

    function logMessage(m: any) {
      const name = m.pushName || "Unknown";
      const jid = m.sender || "";
      //const lid = m.key?.remoteJidAlt || m.key?.participantAlt || "-";
      const pesan = m.text || "";

      const boxWidth = 60;
      const line = chalk.gray("─".repeat(boxWidth));
      const pad = (label: string, value: string) =>
        chalk.gray("│ ") + chalk.cyan(label.padEnd(10)) + chalk.white(value);

      console.log("\n" + line);
      console.log(pad("Name:", name));
      console.log(pad("JID:", jid));
      //console.log(pad("LID:", lid));
      console.log(pad("Pesan:", pesan));
      console.log(line + "\n");
    }

    rrykarl.ev.on("messages.upsert", async ({ type, messages }) => {
      if (type !== "notify") return;

      for (const raw of messages) {
        try {
          if (raw.key?.remoteJid === "status@broadcast") continue;

          const m = await handleMessage(rrykarl, raw);
          if (!m) continue;
          if (!m.text && !m.quoted?.text) continue;

          logMessage(m);

          const text = m.text?.trim() || "";
          
          if (evalPrefix.some(p => text.startsWith(p))) {
            if (!m.isOwner) continue;
            await runEval(rrykarl, m, text);
            continue;
          }

          const prefix = config.prefix.find(p => text.startsWith(p));
          if (!prefix) continue;

          const command = text.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
          await HandleCase(rrykarl, m, command);
        } catch (err) {
          console.error("error message upsert:", err);
        }
      }
    });

    rrykarl.ev.on("contacts.update", (updates) => {
      //console.log("Contacts updated:", updates);
    });

    rrykarl.ev.on("chats.update", (updates) => {
      //console.log("Chats updated:", updates);
    });
    
    rrykarl.ev.on("groups.update", async (updates) => {
      for (const update of updates) {
        if (update.id) {
          try {
            const metadata = await rrykarl.groupMetadata(update.id);
            groupCache.set(update.id, metadata);
          } catch {}
        }
      }
    });

    rrykarl.ev.on("group-participants.update", async (event) => {
      try {
        const metadata = await rrykarl.groupMetadata(event.id);
        groupCache.set(event.id, metadata);
      } catch {}
    });

    rrykarl.ev.on("messaging-history.set", ({ chats, contacts, messages, isLatest }) => {
      console.log("History sync", {
        chats: chats.length,
        contacts: contacts.length,
        messages: messages.length,
        isLatest
      });
    });

    setInterval(() => {
      if (!fs.existsSync(SESS_DIR)) return;

      fs.readdir(SESS_DIR, (err, files) => {
        if (err) return;

        files.forEach(file => {
          if (
            file === "creds.json" ||
            file === "number.txt" ||
            /^lid-mapping-.*\.json$/.test(file)
          ) {
            return;
          }

          const filePath = path.join(SESS_DIR, file);

          fs.unlink(filePath, (err) => {
            if (!err) {
              //console.log("Deleted session file:", filePath);
            } else {
              console.error("Failed to delete:", filePath, err);
            }
          });
        });
      });
    }, 20 * 60 * 1000);

  } catch (err) {
    setTimeout(rrykarlStart, 5000);
  }
}

rrykarlStart();

process.on("uncaughtException", (err: Error) => {
  console.error("[Uncaught Exception]", err.message);
  console.error(err.stack);
});

process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
  console.error("[Unhandled Rejection] at:", promise);
  console.error("Reason:", reason);
});