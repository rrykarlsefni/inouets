import {
  downloadContentFromMessage,
  getContentType,
  proto
} from "@whiskeysockets/baileys";
import type { ExtendedMessage } from "./types.ts";
import { config } from "../config/config.ts";
import { getProfile } from "./buffer.ts";

function normalizeMediaType(mtype?: string) {
  if (!mtype) return;
  const map: Record<string, string> = {
    image: "image",
    video: "video",
    audio: "audio",
    sticker: "sticker",
    document: "document"
  };
  return Object.entries(map).find(([k]) => mtype.includes(k))?.[1];
}

function extractText(msg: any): string {
  try {
    return (
      msg?.conversation ??
      msg?.text ??
      msg?.caption ??
      msg?.contentText ??
      msg?.name ??
      msg?.title ??
      msg?.description ??
      msg?.selectedId ??
      msg?.selectedRowId ??
      msg?.selectedButtonId ??
      msg?.singleSelectReply?.selectedRowId ??
      msg?.buttonText ??
      msg?.extendedTextMessage?.text ??
      msg?.buttonsResponseMessage?.selectedDisplayText ??
      msg?.listResponseMessage?.title ??
      msg?.templateButtonReplyMessage?.selectedId ??
      msg?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ??
      (msg?.pollCreationMessage?.name || msg?.pollUpdateMessage?.name) ??
      ""
    ).trim();
  } catch {
    return "";
  }
}

export async function handleMessage(
  rrykarl: any,
  m: proto.IWebMessageInfo
): Promise<ExtendedMessage | null> {
  if (!m.message) return null;

  const mtype = getContentType(m.message);
  if (!mtype) return null;

  const msg = (m.message as any)[mtype];
  const isGroup = m.key.remoteJid?.endsWith("@g.us") || false;

  const decodedOwners = config.noOwner.map(
    num => num.replace(/\D/g, "") + "@s.whatsapp.net"
  );

  const chatJid   = await rrykarl.decodeJid(m.key.remoteJid!);
  const rawSender = isGroup ? m.key.participant : m.key.remoteJid;
  const senderJid = rawSender ? await rrykarl.decodeJid(rawSender) : "";
  const botJid    = rrykarl.user?.id
    ? await rrykarl.decodeJid(rrykarl.user.id)
    : "";

  const isOwner =
    decodedOwners.includes(senderJid) ||
    senderJid === botJid ||
    m.key.fromMe;

  const text = extractText(m.message) || extractText(msg);

  let groupMetadata: any = {};
  let groupAdmins: string[] = [];
  let groupOwner = "";
  let groupSubject = "";

  if (isGroup) {
    groupMetadata = await rrykarl.groupMetadata(chatJid).catch(() => ({}));

    groupOwner = groupMetadata?.owner
      ? await rrykarl.decodeJid(groupMetadata.owner)
      : "";

    groupAdmins = await Promise.all(
      (groupMetadata?.participants ?? [])
        .filter((p: any) => p.admin === "admin" || p.admin === "superadmin")
        .map((p: any) => rrykarl.decodeJid(p.id))
    );

    groupSubject = groupMetadata?.subject || "";
  }

  const fakethumb: Buffer = await getProfile(rrykarl, senderJid);

  const ftroli: proto.IWebMessageInfo = {
    key: {
      remoteJid: chatJid,
      fromMe: false,
      participant: senderJid,
      mentionedJid: senderJid ? [senderJid] : []
    },
    message: {
      orderMessage: {
        itemCount: 999999999,
        status: 1,
        surface: 1,
        message: text,
        orderTitle: config.ctx.body,
        thumbnail: fakethumb,
        sellerJid: "0@s.whatsapp.net"
      }
    }
  };

  const mentionedJid = msg?.contextInfo?.mentionedJid || [];

  const isBaileys =
    typeof m.key.id === "string" &&
    /^[0-9A-F]+$/i.test(m.key.id) &&
    (m.key.id.startsWith("BAE5") ||
      m.key.id.startsWith("3EB0") ||
      m.key.id.length <= 24);

  const extended: ExtendedMessage = {
    chat: chatJid,
    sender: senderJid,
    isGroup,
    isOwner,
    isAdmins: isGroup && senderJid
      ? groupAdmins.includes(senderJid)
      : false,
    isGroupOwner: isGroup && senderJid
      ? groupOwner === senderJid
      : false,
    isBotAdmins: isGroup
      ? groupAdmins.includes(await rrykarl.decodeJid(rrykarl.user?.id || ""))
      : false,
    pushName: m.pushName || undefined,
    message: m.message,
    key: m.key,
    mtype,
    msg: { ...msg, text },
    text,
    groupSubject,
    mentionedJid,
    isBaileys,
    mediaType: normalizeMediaType(mtype),

    quoted: msg?.contextInfo?.quotedMessage
      ? {
          key: {
            remoteJid: chatJid,
            id: msg?.contextInfo?.stanzaId,
            fromMe: false,
            participant: msg?.contextInfo?.participant
          },
          message: msg?.contextInfo?.quotedMessage,
          chat: chatJid,
          sender: msg?.contextInfo?.participant
            ? await rrykarl.decodeJid(msg?.contextInfo?.participant)
            : "",
          text: extractText(msg?.contextInfo?.quotedMessage),
          mtype: getContentType(msg?.contextInfo?.quotedMessage) || undefined,
          mediaType: normalizeMediaType(
            getContentType(msg?.contextInfo?.quotedMessage)
          ),
          mentionedJid: msg?.contextInfo?.mentionedJid || [],
          react: async (emoji?: string) => {
            const e =
              emoji ||
              config.emoji[Math.floor(Math.random() * config.emoji.length)];
            await rrykarl.sendMessage(chatJid, {
              react: {
                text: e,
                key: {
                  id: msg?.contextInfo?.stanzaId,
                  remoteJid: chatJid,
                  fromMe: false
                }
              }
            });
          }
        }
      : null,

    sendText: async (text: string) => {
      await rrykarl.sendMessage(chatJid, { text }, { quoted: m });
    },

    reply: async (text: string, options: Record<string, any> = {}) => {
      const msgrep = {
        text,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterName: config.ch.name,
            newsletterJid: config.ch.id
          },
          externalAdReply: {
            showAdAttribution: true,
            title: config.ctx.title,
            body: config.ctx.body,
            thumbnailUrl: config.media.thumb,
            thumbnail: Buffer.alloc(0),
            sourceUrl: config.ch.link
          }
        },
        ...options
      };
      return rrykarl.sendMessage(chatJid, msgrep, { quoted: ftroli });
    },

    react: async (emoji?: string) => {
      const e =
        emoji || config.emoji[Math.floor(Math.random() * config.emoji.length)];
      await rrykarl.sendMessage(chatJid, {
        react: { text: e, key: m.key }
      });
    }
  };

  if (extended.quoted) {
    extended.quoted.download = async () => {
      const quotedMsg = extended.quoted!.message;
      const type = getContentType(quotedMsg);
      if (!type) throw new Error("Quoted tidak punya tipe.");

      const media = (quotedMsg as any)[type];
      const normType = normalizeMediaType(type);
      if (!normType) throw new Error("Tipe media tidak didukung: " + type);

      const stream = await downloadContentFromMessage(media, normType as any);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk);

      return Buffer.concat(chunks);
    };
  }

  if (extended.mtype && extended.msg) {
    extended.download = async () => {
      const normType = normalizeMediaType(extended.mtype!);
      if (!normType) {
        throw new Error("Tipe media tidak didukung: " + extended.mtype);
      }

      const stream = await downloadContentFromMessage(
        extended.msg,
        normType as any
      );

      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk);

      return Buffer.concat(chunks);
    };
  }

  return extended;
}