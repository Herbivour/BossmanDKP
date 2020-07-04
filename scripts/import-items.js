const db = require('../models');
const fs = require('fs');

async function go() {
  const itemLisTxt = fs.readFileSync(__dirname + '/../itemlist.txt').toString();
  
  const items = itemLisTxt.split("\n").map((r) => {
    return r.split(',').map((c) => {
      return c.replace(/^"/, '').replace(/"$/, '').trim();
    });
  });
  // pop off the header line
  items.shift();
  for (const itemData of items) {
    const [item, _] = await db.Item.findOrCreate({
      where: {name: itemData[1]},
    });
    item.itemId = itemData[0];
    await item.save();
  }
}

go();