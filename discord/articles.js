// backslashEscapesHTMLTags
const fs = require('fs');
const axios = require('axios');
const showdown  = require('showdown');
const bq = "```";
const handlers = {};

async function post(msg) {
  console.log();
  if(!msg.member.roles.cache.find(r => r.name === "Anchorman")) {
    msg.reply('Only an Anchorman can do this!');
    return;
  }
  const attachment = msg.attachments.first();
  if (!attachment) {
    msg.reply('Please attach an article file');
    return;
  }
  console.log('#article attachment: ', attachment);
  const resp = await axios.get(attachment.url);
  const text = resp.data;
  const converter = new showdown.Converter();
  converter.setOption('backslashEscapesHTMLTags', true);
  converter.setOption('simpleLineBreaks', true);
  
  let html = converter.makeHtml(text);
  html = html.replace(/href\s*=\s*"\s*javascript:/i, '');
  html = html.replace(/<\/?\s*script[^>]*>/i, '');
  html = html.replace(/<\/?\s*link[^>]*>/i, '');
  console.log(html);
  const timestamp = new Date().getTime();
  fs.writeFileSync(__dirname + `/../content/articles/${timestamp}.html`, html);
  fs.appendFileSync(__dirname + `/../content/articles/index.txt`, `${timestamp}.html\n`);
  msg.reply(`Article posted as ID: ${timestamp}`);
}

async function image(msg) {
  console.log();
  if(!msg.member.roles.cache.find(r => r.name === "Anchorman")) {
    msg.reply('Only an Anchorman can do this!');
    return;
  }
  const attachment = msg.attachments.first();
  if (!attachment) {
    msg.reply('Please attach an image file');
    return;
  }
  console.log('#image attachment: ', attachment);
  const timestamp = new Date().getTime();
  const extension = attachment.name.match(/(\..+)$/)[1];
  const writer = fs.createWriteStream(__dirname + `/../content/assets/${timestamp}${extension}`);
  const resp = await axios({
    url: attachment.url,
    method: 'GET',
    responseType: 'stream'
  });
  
  resp.data.pipe(writer);
  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  msg.reply(`Image saved as: ${timestamp}${extension}`);
}

function help(msg) {
  msg.reply(`!articles commands:\n
${bq}!articles post${bq}
Accepts a markdown formated text file and creates a new news post from it.
${bq}!articles replace 1234${bq}
Accepts a markdown formated text file and replaces the post id 1234 from it.
${bq}!articles image${bq}
Accepts an image attachment and responds with the image name that was saved on the server.`);
}

async function replace(msg) {
  console.log();
  if(!msg.member.roles.cache.find(r => r.name === "Anchorman")) {
    msg.reply('Only an Anchorman can do this!');
    return;
  }
  const attachment = msg.attachments.first();
  if (!attachment) {
    msg.reply('Please attach an article file');
    return;
  }
  let match = msg.content.match(/\s*(\d+)\s*$/);
  if (!match || !match[1]) {
    msg.reply('Please specify the article ID that you wish to update');
    return;
  }
  const fileId = match[1];
  const filename = __dirname + `/../content/articles/${fileId}.html`;
  if (!fs.existsSync(filename)) {
    msg.reply('Article not found.');
    return;
  }
  console.log('#article attachment: ', attachment);
  const resp = await axios.get(attachment.url);
  const text = resp.data;
  const converter = new showdown.Converter();
  converter.setOption('backslashEscapesHTMLTags', true);
  converter.setOption('simpleLineBreaks', true);
  
  let html = converter.makeHtml(text);
  html = html.replace(/href\s*=\s*"\s*javascript:/i, '');
  html = html.replace(/<\/?\s*script[^>]*>/i, '');
  html = html.replace(/<\/?\s*link[^>]*>/i, '');
  fs.writeFileSync(filename, html);
  msg.reply(`Article Replaced ID: ${fileId}`);
}

handlers.post = post;
handlers.image = image;
handlers.help = help;
handlers.replace = replace;
module.exports = handlers;