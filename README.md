# inouets (BETA TEST)

> [!NOTE]  
> **Simple WhatsApp Bot** using **TypeScript (ESM)** with case command handler.  
> Built on the latest **Baileys** [@whiskeysockets/baileys 7.0.0-rc.2](https://www.npmjs.com/package/@whiskeysockets/baileys#starting-socket-with-pairing-code) – see [Migration Guide (v7.x.x)](https://baileys.wiki/docs/migration/to-v7.0.0/).  
  
> [!WARNING]  
> ⚠️ Not supporting **custom pairing** and **buttons**, since this project uses the official Baileys.  
> 💡 You can still modify it yourself using a **Baileys mod** if needed.  
 
> [!TIP]  
> This is a **base WhatsApp bot**, it comes with **no features by default**.  
> - Example command: [`command/case.ts`](https://github.com/rrykarlsefni/inouets/blob/master/command/case.ts)  
> - Configuration file: [`config/config.ts`](https://github.com/rrykarlsefni/inouets/blob/master/config/config.ts)  

> [!IMPORTANT]  
> 🌟 This is the **initial base bot source code**.  
> Give this repo a **star** ⭐ to support development.  
> Updates will be released when there’s time and opportunity.

> [!WARNING]  
> menemukan bug? laporkan ke [issue](https://github.com/rrykarlsefni/inouets/issues)

---

## Features

- Case command handler (simple and extendable)  
- Includes **eval** & **exec** utilities  
- Pairing code login support  
- Auto-restart with **nodemon** & **PM2**  
- Fixed LID ( sept 2025)

---

## Covert Lid To Jid
![covert](https://cdn.jsdelivr.net/gh/rrykarlsefni/inouets@master/.temp/convert.jpg) 
---
## Example case
```js
m.reply("text") untuk mengirim pesan simple
m.react() //react random dari config, gunakan m.react("😥") untuk react custom
m.chat //jid pesan di mana bot di command(m.key.remoteJid)
m.sender //jid user yang meng command (m.key.participant)
m.pushName //untuk mendapatkan nama pengirim 
> m.download() / m.quoted.download() //mendownload media
```
## Example kirim pesan
```js
// Kirim pesan biasa
await rrykarl.sendMessage(m.chat, {
  text: "hi"
});
```
```js
// Kirim pesan dengan quoted
await rrykarl.sendMessage(m.chat, {
  text: "hi"
}, {quoted: m});
```
```js
// Cara cepat untuk membalas pesan
m.reply("hi");
```
---
## Installation-
### Install via termux
#### Opsi 1: Manual
```bash
$ pkg update && pkg upgrade
$ pkg install git -y
$ pkg install nodejs -y
$ cp -r /sdcard/inouets ~/inouets
$ cd ~/inouets
$ npm install
$ npm start
```

#### Opsi 2: One-liner
```bash
$ pkg update && pkg upgrade
$ pkg install git && pkg install nodejs -y
$ cp -r /sdcard/inouets ~/inouets && cd ~/inouets
$ npm install && npm start
```

#### Opsi 3: Dengan `install.sh`
```bash
$ pkg update && pkg upgrade
$ bash install.sh
$ cp -r /sdcard/inouets ~/inouets
$ cd ~/inouets
$ npm install && npm start
```

### Opsi 4: Dengan Github
```bash
$ pkg update && pkg upgrade
$ pkg install git -y
$ pkg install nodejs -y
$ git clone https://github.com/rrykarlsefni/inouets
$ cd inouets
$ npm install
$ npm start
```

---
## start option
### Normal
```bash
$ npm install
$ npm start
```
### Mode Developer
```bash
$ npm install
$ npm run dev
```
### Mode Process Manager 2
```bash
$ npm install
$ npm run pm2
```


---
