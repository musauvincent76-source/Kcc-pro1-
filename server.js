const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

app.post('/code', async (req, res) => {
  let { number } = req.body;
  if(!number) return res.json({ error: 'Weka namba' });
  number = number.replace(/[^0-9]/g,'');
  
  try {
    const dir = 'temp-'+Date.now();
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const sock = makeWASocket({
      logger: P({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: ["KCC-PRO","Chrome","1.0"]
    });
    sock.ev.on('creds.update', saveCreds);
    await new Promise(r => setTimeout(r, 2000));
    const code = await sock.requestPairingCode(number);
    res.json({ code: code });
    setTimeout(()=>{ try{fs.rmSync(dir,{recursive:true})}catch{} }, 60000);
  } catch(e) {
    res.json({ error: e.message });
  }
});

app.get('/', (req,res) => {
  res.sendFile(path.join(__dirname,'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('KCC PRO LIVE on '+PORT));
