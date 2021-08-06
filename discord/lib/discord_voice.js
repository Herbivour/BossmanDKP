const fs = require('fs');
const crypto = require('crypto');
const Polly = require('./aws_polly');
const handlers = {};
const VoiceId = process.env.POLY_VOICE || "Kendra";
let voiceConnection;
function SetConnection(connection) {
  voiceConnection = connection;
}
function GetConnection() { return voiceConnection;}

function Leave() {
  try {
    if(voiceConnection) {
      voiceConnection.disconnect();
    }
  } catch(err) {

  } finally {
    voiceConnection = undefined;
  }
}

const playQueue = [];
const audioRemap = require('./audio_remap.json');
console.log(audioRemap);
async function Speak(text) {
  const hash = crypto.createHash('sha256');
  let lText = text.toLowerCase();
  lText = lText.replace('mylos', 'apples')
  if (audioRemap[lText]) {
    console.log(__dirname + '/../../audio/' + audioRemap[lText]);
    playQueue.push(__dirname + '/../../audio/' + audioRemap[lText]);
    return;
  }
  hash.update(lText);
  const filename = __dirname + '/../../audio/' + VoiceId + hash.digest('hex') + '.mp3';
  if (!fs.existsSync(filename)) {
    await Polly.GenerateMp3(lText, filename);
  }
  playQueue.push(filename);
  
}

function QueueFile(filename) {
  if (!fs.existsSync(filename)) { return; }
  playQueue.push(filename);
}


function Sleep(ms) { return new Promise((resolve, _) => {
  setTimeout(resolve, ms);
});}
function PlayFile(filename) {
  return new Promise((resolve, reject) => {
    let volume = 1.0;
    if(filename.match(/leroy/i) || filename.match(/countdown/i)) {
      volume = 0.6;
    }
    const dispatcher = voiceConnection.play(filename, {volume: volume});
    dispatcher.on('finish', resolve);
    dispatcher.on('error', reject);
  });
}
async function speakQueueRunner() {
  while(true) {
    const filename = playQueue.shift();
    if (filename && voiceConnection) {
      await PlayFile(filename);
    } else {
      await Sleep(1000);
    }
  }
}

speakQueueRunner();
handlers.SetConnection = SetConnection;
handlers.GetConnection = GetConnection;
handlers.Leave = Leave;
handlers.Speak = Speak;
handlers.QueueFile = QueueFile;
module.exports = handlers;
