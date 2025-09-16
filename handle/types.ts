import { proto } from "@whiskeysockets/baileys";

export interface QuotedMessage {
  key: proto.IMessageKey;
  message: proto.IMessage;
  chat?: string;
  sender?: string;
  isGroup?: boolean;
  isBaileys: boolean;
  text?: string;
  mtype?: string;
  mediaType?: string;
  msg?: proto.IMessage | any;
  mentionedJid?: string[];
  download?: () => Promise<Buffer>;
  react?: (emoji?: string) => Promise<void>;
}

export type ExtendedMessage = {
  chat: string;
  sender: string;
  isGroup: boolean;
  isOwner: boolean;
  isAdmins: boolean;
  isGroupOwner: boolean;
  isBotAdmins: boolean;
  isBaileys: boolean;
  pushName?: string;
  message: proto.IMessage;
  key: proto.IMessageKey;
  mtype?: string;
  mediaType?: string;
  msg?: proto.IMessage | any;
  text?: string;
  groupSubject?: string;
  mentionedJid?: string[];
  quoted?: QuotedMessage | null;
  sendText: (text: string) => Promise<void>;
  reply: (text: string, options?: Record<string, any>) => Promise<proto.WebMessageInfo | void>;
  react: (emoji?: string) => Promise<void>;
  download?: () => Promise<Buffer>;
};