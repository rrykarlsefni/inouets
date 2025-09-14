import type { ExtendedMessage } from "../handle/types.ts";
import { config } from "../config/config.ts";
import { mess } from "../config/message.ts";
import { runEval } from "../handle/eval.ts";

export async function HandleCase(rrykarl: any, m: ExtendedMessage, command: string) {
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

    case "ping": {
      const start = Date.now();
      await m.react();
      const sent = await m.reply("Testing...");
      const latency = Date.now() - start;
      await rrykarl.sendMessage(
        m.chat,
        { text: `Latency: ${latency} ms` },
        { quoted: sent }
      );
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