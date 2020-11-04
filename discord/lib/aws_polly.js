const fs = require('fs');
const AWS = require('aws-sdk');
var polly = new AWS.Polly({
  region: process.env.POLLY_AWS_REGION || 'us-west-2'
});

const handlers = {};
const VoiceId = process.env.POLY_VOICE || "Kendra";
console.log('!!!!! using voice id:', VoiceId)
async function GenerateMp3(text, fileLocation) {
  const params = {
    OutputFormat: "mp3", 
    SampleRate: "24000", 
    Text: text, 
    TextType: "text", 
    VoiceId,
    Engine: "neural"
  };
  const data = await polly.synthesizeSpeech(params).promise();
  fs.writeFileSync(fileLocation, data.AudioStream);
}

handlers.GenerateMp3 = GenerateMp3;;
module.exports = handlers;
