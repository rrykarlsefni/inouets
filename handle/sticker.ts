import fs from "fs";
import os from "os";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import webp from "node-webpmux";
import { config } from "../config/config";
import { getBuffer } from "./buffer";
import { randomBytes } from "crypto";

const tmp = (ext = "") =>
  path.join(
    os.tmpdir(),
    `${randomBytes(6).readUIntLE(0, 6).toString(36)}${ext ? "." + ext : ""}`
  );

export async function createSticker(
  source: string | Buffer,
  mimetype: string,
  packname: string = config.packname,
  author: string = config.author
): Promise<Buffer> {
  const ext = mimetype.split("/")[1] || "bin";
  const buffer = await getBuffer(source);
  if (!buffer) throw new Error("Gagal ambil buffer sumber");

  const tempInput = tmp(ext);
  const tempOutput = tmp("webp");
  fs.writeFileSync(tempInput, buffer);

  try {
    if (mimetype === "image/webp") {
      fs.copyFileSync(tempInput, tempOutput);
    } else if (/image/.test(mimetype)) {
      const pngTemp = tmp("png");
      fs.writeFileSync(pngTemp, buffer);
      await new Promise<void>((resolve, reject) => {
        ffmpeg(pngTemp)
          .addOutputOptions([
            "-vcodec", "libwebp",
            "-lossless", "1",
            "-preset", "default",
            "-pix_fmt", "yuva420p",
            "-vf", "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=0x00000000",
            "-an",
            "-vsync", "0",
          ])
          .toFormat("webp")
          .save(tempOutput)
          .on("end", resolve)
          .on("error", reject);
      });
      if (fs.existsSync(pngTemp)) fs.unlinkSync(pngTemp);
    } else if (/video/.test(mimetype)) {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempInput)
          .setDuration(6) // otomatis potong max 6 detik
          .addOutputOptions([
            "-vcodec", "libwebp",
            "-vf", "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=15",
            "-loop", "0",
            "-an",
            "-vsync", "0",
          ])
          .toFormat("webp")
          .save(tempOutput)
          .on("end", resolve)
          .on("error", reject);
      });
    } else {
      throw new Error(`Unsupported mimetype: ${mimetype}`);
    }

    const img = new webp.Image();
    await img.load(tempOutput);

    const json = {
      "sticker-pack-id": "https://github.com/rrykarlsefni",
      "sticker-pack-name": packname,
      "sticker-pack-publisher": author,
      emojis: [""],
    };

    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);
    img.exif = exif;

    await img.save(tempOutput);
    return fs.readFileSync(tempOutput);
  } finally {
    if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
    if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
  }
}