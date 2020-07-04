var http = require('http');

function processPost(json) {
  switch(json.cmd) {
    case 'Auction':
      process.send({ cmd: json.cmd, args: json.args });
      break;
    default:
      throw new Error('Invalid command');
  }
  return JSON.stringify(json)
}

http.createServer(function (req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 400;
    res.end();
    return;
  }
  if (req.headers['x-api-key'] !== process.env.BOSSMAN_API_KEY) {
    res.statusCode = 403;
    res.end(); //end the response  
    return;
  }
  let body = [];
  req.on('data', (chunk) => {
    body.push(chunk);
  }).on('end', async () => {
    body = Buffer.concat(body).toString();
    let json;
    try {
      json = JSON.parse(body);
    } catch (err) {
      res.statusCode = 400;
      res.end();
      return;
    }
    let resp;
    try {
      resp = await processPost(json);
    } catch (err) {
      res.statusCode = 400;
      res.end();
      return;
    }
    res.write(resp);
    res.end();
  });
}).listen(8081);