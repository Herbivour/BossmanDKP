const db = require('../models');
const Sequelize = require('sequelize');
const Op = db.Sequelize.Op;
const express = require('express');
const router = express.Router();
const classNames = require('../classes.json');
const fs = require('fs');
db.sequelize.sync(); // Do this instead of migrations
async function index(req, res) {
  const articles = [];
  let articleFiles = [];
  try {
    articleFiles = fs.readFileSync(__dirname + '/../content/articles/index.txt').toString().split('\n').reverse();
  } catch (err) {
    console.error('Error reading articles index: ', err);
  }

  for (const filename of articleFiles) {
    try {
      const article = {
        html: fs.readFileSync(__dirname + '/../content/articles/' + filename),
        timestamp: filename.replace(/\.html/i,'')
      };
      articles.push(
        article
      );
    } catch (err) {
  
    }
  }
  res.render('index', {
    articles: articles
  });
}

router.get('/', index);

async function roster(req, res) {
  let order = [];
  let filters = {};
  if(req.query.o) {
    const filters = req.query.o.toLowerCase().split(',');
    if(filters.length > 0) {
      for(const filter of filters) {
        switch(filter) {
        case '-wp':
          order.push(['wastedPoints', 'DESC']);
          break;
        case '-p':
          order.push(['currentPoints', 'DESC']);
          break;
        case '-ra30':
          order.push(['30day', 'DESC']);
          break;
        case '-ra60':
          order.push(['60day', 'DESC']);
          break;
        case '-ra90':
          order.push(['90day', 'DESC']);
          break;
        case '-c':
          order.push(['className', 'DESC']);
          break;
        case '-n':
          order.push(['characterName', 'DESC']);
          break;
        case '-r':
          order.push(['rank', 'DESC']);
          break;
        case 'wp':
          order.push(['wastedPoints', 'ASC']);
          break;
        case 'p':
          order.push(['currentPoints', 'ASC']);
          break;
        case 'ra30':
          order.push(['30day', 'ASC']);
          break;
        case 'ra60':
          order.push(['60day', 'ASC']);
          break;
        case 'ra90':
          order.push(['90day', 'ASC']);
          break;
        case 'c':
          order.push(['className', 'ASC']);
          break;
        case 'n':
          order.push(['characterName', 'ASC']);
          break;
        case 'r':
          order.push(['rank', 'ASC']);
          break;
        }
      }
    }
  }
  if (req.query.f) {
    try {
      filters = JSON.parse(
        req.query.f
      );
    } catch (e) {
      // bad json, nobody cares
    }
  }
  if (order.length === 0) {
    order.push(['currentPoints', 'DESC']);
  }
  const findAllArgs = {
    order: order,
    where: {
      '60day': {
        [Op.gt]: 0
      },
      rank: {
        [Op.notIn]: ["Box/Alt", "Raid Box", "FNF", "hidden"]
      }
    }
  };
  if (filters.show_alts) {
    findAllArgs.where.rank = {
      [Op.notIn]: ["hidden"]
    };
  }
  
  const users = await db.User.findAll(findAllArgs);
  const leaderBoard = {};
  for (const className of classNames) {
    let friendlyClassName = className.replace(/\s/, '');
    leaderBoard[friendlyClassName] = await db.User.findAll({
      order: [['currentPoints', 'DESC']],
      limit: 5,
      where: {
        rank: {
          [Op.notIn]: ["Box/Alt", "Raid Box", "FNF", "hidden"]
        },
        className: className,
        currentPoints: {
          [Op.gt]: 0
        },
        '60day': {
          [Op.gt]: 0
        }
      }
    });
  }
  // Handlebars is stupid
  for(let i=0; i<users.length; i++) {
    users[i].position = (i + 1);
  }
  res.render('roster', {
    users: users,
    classNames: classNames,
    leaderBoard: leaderBoard,
    filters
  });
}

router.get('/roster', roster);

router.get('/roster/:id', async (req, res) => {
  const user = await db.User.findByPk(
    req.params.id
  );
  const raids = await user.getRaids({
    order: [['createdAt', 'DESC']]
  });
  user.Raids = raids.sort((a,b) => {
    return b.id - a.id;
  });
  user.Items = await user.getItems({
    order: [[Sequelize.literal('UserItemPurchase.createdAt'), 'DESC'], ['name', 'ASC']]
  });
  res.render('user', {
    user: user
  });
});

router.get('/raids', async (req, res) => {
  const page = parseInt(req.query.p, 10) || 1;
  const limit = 100;
  const offset = limit *  (page - 1);
  const raids = await db.Raid.findAll({
    order: [['when', 'DESC']],
    limit: limit,
    offset: offset
  });
  const ctx = {
    raids: raids,
    page: page
  };
  if (raids.length === limit) {
    ctx.nextPage = ctx.page + 1;
  }
  if (ctx.page > 1) {
    ctx.prevPage = ctx.page - 1;
  }
  res.render('raids', ctx);
});

router.get('/raids/:id', async (req, res) => {
  const raid = await db.Raid.findByPk(
    req.params.id,
    {
      include: [
        db.User,
        db.Item
      ]
    }
  );
  raid.earned = raid.Users.length * raid.value;
  raid.spent = 0;
  for(const item of raid.Items) {
    if (item.UserItemPurchase) {
      raid.spent += item.UserItemPurchase.value;
    }
  }
  res.render('raid', {
    raid: raid
  });
});

router.get('/items', async (req, res) => {
  const page = parseInt(req.query.p, 10) || 1;
  const limit = 100;
  const offset = limit *  (page - 1);
  const args = {
    order: [['name', 'ASC']],
    limit: limit,
    offset: offset
  };
  if(req.query.name) {
    args.where = {
      name: {
        [Op.like]: '%' + req.query.name + '%'
      }
    };
  }
  const items = await db.Item.findAll(args);
  const ctx =  {
    items: items,
    page: page,
    name: req.query.name
  };
  if (items.length === limit) {
    ctx.nextPage = ctx.page + 1;
  }
  if (ctx.page > 1) {
    ctx.prevPage = ctx.page - 1;
  }
  res.render('items', ctx);
});

router.get('/items/:id', async (req, res) => {
  const item = await db.Item.findByPk(
    req.params.id,
    {
      include: [
        {
          model: db.UserItemPurchase,
          as: 'purchases',
          include: [
            db.User
          ]
        }
      ]
    }
  );
  res.render('item', {
    item: item
  });
});

router.get('/recent_purchases', async (req, res) => {
  const purcahses = await db.UserItemPurchase.findAll({
    order: [['id', 'DESC']],
    limit: 100,
    include: [
      {
        model: db.User
      },
      {
        model: db.Item,
        as: 'item'
      }
    ]
  });
  console.log(purcahses[0]);
  res.render('recent_purchases', {
    purcahses: purcahses
  });
});
module.exports = router;