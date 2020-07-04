const express = require('express');
const path = require('path');
const app = express();
var hbs = require('hbs');
var HandlebarsIntl = require('handlebars-intl');
HandlebarsIntl.registerWith(hbs);
hbs.registerHelper('ceil', Math.ceil);
hbs.registerHelper('isChecked', function(attr, obj) {
  console.log('isChecked', attr, obj);
  if (obj[attr]) {
    return new hbs.SafeString('checked="on"');
  }
  return '';
});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(__dirname + '/public'));
app.use('/', require('./routes/index'));
app.use(express.static(__dirname + '/content/assets'));
const port = process.env.DKP_HTTP_PORT || 3000;
app.listen(port, () => console.log(`App listening on port ${port}`));