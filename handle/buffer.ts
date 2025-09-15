import axios from "axios";
import fs from "fs";
import path from "path";
import * as Jimp from "jimp";

export async function resizeImage(
  imageBuffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  const image = await Jimp.read(imageBuffer);
  return image.resize(width, height).getBufferAsync(Jimp.MIME_JPEG);
}

export async function getBuffer(source: string | Buffer): Promise<Buffer | null> {
  try {
    if (Buffer.isBuffer(source)) return source;

    if (/^https?:\/\//i.test(source)) {
      const res = await axios.get<ArrayBuffer>(source, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/113.0.0.0 Safari/537.36",
        },
        timeout: 15000,
        maxRedirects: 5
      });
      return Buffer.from(res.data);
    }

    if (fs.existsSync(source)) {
      return fs.promises.readFile(path.resolve(source));
    }

    return Buffer.from(source);
  } catch (err: any) {
    console.error("Gagal ambil buffer:", err.message);
    return null;
  }
}

export async function getProfile(rrykarl: any, jid: string): Promise<Buffer> {
  try {
    const ppurl = await rrykarl.profilePictureUrl(jid, "image");
    const ppBuffer = await getBuffer(ppurl);
    if (ppBuffer) {
      return await resizeImage(ppBuffer, 200, Jimp.AUTO);
    }
  } catch {
    return Buffer.alloc(0);
  }
  return Buffer.alloc(0);
}