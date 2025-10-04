/** 
 ~> need panel? #pensi
 ~> testi https://whatsapp.com/channel/0029Vb6bvDpDzgTBYTRlev2g
 */ 

import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import type { ExtendedMessage } from "../handle/types.ts";
import { config } from "../config/config.ts";
import { mess } from "../config/message.ts";
import { createSticker } from "../handle/sticker.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.resolve(__dirname, "../config/settings.json");

function getSettings() {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return { public: true };
  }
}

function setSettings(newSettings: Record<string, any>) {
  fs.writeFileSync(filePath, JSON.stringify(newSettings, null, 2));
}

export async function HandleCase(rrykarl: any, m: ExtendedMessage) {
  const settings = getSettings();
  const body = m.text?.trim() || "";
  const prefix = config.prefix.find(p => body.startsWith(p));
  if (!prefix) return;
  const args = body.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase() || "";
  const text = args.join(" ");

  const isOwner = m.isOwner;
  const isGroup = m.isGroup;
  const isAdmins = m.isAdmins;
  const isBotAdmins = m.isBotAdmins;
  const isGroupOwner = m.isGroupOwner;

  if (!settings.public && !isOwner) return null;

  ///switch command
  switch (command) {
    case "menu": {
      await m.react();
      const menu = `
ini menu
1. bakwan jagung
2. cumi hitam pak kris
3. bebek goreng haji Slamet
4. sate kelinci pak angling
5. toko roti pak budi (grand opening)
`.trim();
      await m.reply(menu);
    } break;
    
    case "sticker":
    case "s": {
      try {
        const mediaMsg = m.quoted?.download ? m.quoted : m;
        if (!mediaMsg.download) {
          return m.reply("Reply atau kirim media dengan caption *.sticker*");
        }

        const buffer = await mediaMsg.download();
        if (!buffer) return m.reply("Gagal mendownload media.");

        const mimetype =
          mediaMsg.msg?.mimetype || 
          mediaMsg.mimetype || 
          mediaMsg.message?.[mediaMsg.mtype || ""]?.mimetype || 
          "";

        if (!mimetype) return m.reply("Tipe media tidak dikenali.");

        const sticker = await createSticker(buffer, mimetype);
        await rrykarl.sendMessage(m.chat, { sticker }, { quoted: m });
      } catch (err) {
        console.error("Sticker Error:", err);
        await m.reply("Gagal membuat sticker.");
      }
    } break;
    
    case "ping": {
      await m.react();
      const start = Date.now();
      const sent = await m.reply("Testing...");
      const latency = Date.now() - start;
      await rrykarl.sendMessage(
        m.chat,
        { text: `Latency: ${latency} ms` },
        { quoted: sent }
      );
    } break;

    case "public": {
      if (!isOwner) return m.reply(mess.own);
      setSettings({ ...settings, public: true });
      await m.reply("Mode *Public* aktif");
    } break;

    case "self": {
      if (!isOwner) return m.reply(mess.own);
      setSettings({ ...settings, public: false });
      await m.reply("Mode *Self* aktif");
    } break;
    
    case "add":
    case "remove":
    case "kick":
    case "promote":
    case "demote": {
      if (!isGroup) return m.reply(mess.gc);
      if (!isAdmins) return m.reply(mess.admgc);
      if (!isBotAdmins) return m.reply(mess.botadm);

      const action = command === "kick" ? "remove" : command;
      let targets: string[] = [];

      if (command === "add") {
        if (m.quoted) {
          targets = [m.quoted.sender!];
        } else if (text) {
          const nomor = text.replace(/[^0-9]/g, "");
          if (!nomor) return m.reply(`Kirim perintah .add 628xxxxx atau reply pesan user.`);
          targets = [`${nomor}@s.whatsapp.net`];
        } else {
          return m.reply(`Kirim perintah .add 628xxxxx atau reply pesan user.`);
        }
      } else {
        if (m.quoted) {
          targets = [m.quoted.sender!];
        } else if (m.mentionedJid?.length) {
          targets = m.mentionedJid;
        } else {
          return m.reply(`Tag atau reply member untuk *${command}*.`);
        }
      }

      try {
        await rrykarl.groupParticipantsUpdate(m.chat, targets, action as any);
        await m.reply(
          `✅ ${command.toUpperCase()} sukses\nTarget: ${targets.map(v => `@${v.split("@")[0]}`).join(", ")}`,
          { mentions: targets }
        );
      } catch (e) {
        console.error(e);
        await m.reply("Gagal mengeksekusi perintah.");
      }
    } break;

    case "settingcek":
    case "ceksettings":
    case "ceksetting": {
      await m.react();
      let teks = `── 「 *CEK SETTINGS* 」 ──\n\n`;
      Object.entries(settings).forEach(([key, val]) => {
        if (typeof val === "boolean") {
          teks += `› *${key}* : ${val ? "on" : "off"}\n`;
        } else if (Array.isArray(val)) {
          teks += `› *${key}* : [ ${val.join(", ")} ]\n`;
        } else {
          teks += `› *${key}* : ${val}\n`;
        }
      });
      await m.reply(teks.trim());
    } break;

    case "owner": {
      const data = config.kontak;
      const kontakList: { vcard: string }[] = [];

      const jumlahKontak = Math.min(
        data.nama.length,
        data.nomor.length,
        data.organisasi.length,
        data.jabatan.length,
        data.alamat.length,
        data.email.length,
        data.website.length,
        data.deskripsi.length
      );

      for (let i = 0; i < jumlahKontak; i++) {
        const nomor = data.nomor[i];
        const nama = data.nama[i];
        if (!nomor || !nama || nomor === "-" || nama === "-") continue;

        const waFormatted = nomor.startsWith("62")
          ? `+62 ${nomor.slice(2, 5)}-${nomor.slice(5, 9)}-${nomor.slice(9)}`
          : nomor;

        const vcard = `BEGIN:VCARD
VERSION:3.0
N:${nama};;;;
FN:${nama}
ORG:${data.organisasi[i] || "-"}
TITLE:${data.jabatan[i] || "-"}
TEL;type=CELL;type=VOICE;waid=${nomor}:${waFormatted}
ADR;type=WORK;label="${data.alamat[i] || "-"}":;;${data.alamat[i] || "-"};;;;
EMAIL;type=INTERNET:${data.email[i] || "-"}
URL:${data.website[i] || "-"}
X-WA-BIZ-DESCRIPTION:${data.deskripsi[i] || ""}
X-WA-BIZ-NAME:${nama}
END:VCARD`;

        kontakList.push({ vcard });
      }

      if (kontakList.length === 0) {
        return m.reply("Tidak ada kontak valid.");
      }

      await rrykarl.sendMessage(
        m.chat,
        {
          contacts: {
            displayName: kontakList.length === 1 ? data.nama[0] : config.nameOwner,
            contacts: kontakList
          }
        },
        { quoted: m }
      );
    } break;

    default: {
      // keep_calm
    } 
  }
}