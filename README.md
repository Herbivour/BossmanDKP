# Bossman DKP
A Discord bot designed for DKP with everquest.  It has a read-only website for members.  All actions are done through the bot in discord.  `DKP Officer` rank members will be able to perform any dkp actions.  Members will be able to bid and check dkp standings via messaging to the bot.

### Requirements

* mysql server
* discord bot token
* a server that you can connect to and launch processes

### Configuration

* Check out this code on the server you wish to run the bot on.  
* Configure your MySQL server, and set the `sequelize` config in config/config.json. (Fill in the blanks below)
```
{
  "development": {
    "database": "...",
    "username": "...",
    "password": "...",
    "host": "...",
    "dialect": "mysql"
  }
}

```
* Configure the required environment variables (see below)
* Install nginx and configure the nginx.conf. You can fix up the docker nginx.conf located in nginx-conf/nginx.conf.  For the server the location blocks should go to http://127.0.0.1 instead of the docker alias names.
* Configure your server to launch the app on boot. `cd /where/you/installed/ && npm run start-all`


### Environment Variables

* DISCORD_TOKEN - The Bot's token.  This can be found on the bot page from Discord's website
* BOSSMAN_API_KEY - An API key that will be used by the bossman asstant client (Comming soon)
* DKP_BID_CHAN - The channel where auctions happen
* DKP_REPORTING_CHANNEL - The channel where everyone's bids are posted, this is useful for fixing error bids.
* BOSSMAN_ONWER_ID - Your discord ID, this is used to protect some commands that only the server admin should have access to.

### Docker 
Use Adminer to create your db.
Configure the DB connection info in `config/config.json`

Configure the Bot's env:

config/discord.env
```
DISCORD_TOKEN=....
BOSSMAN_API_KEY=
DKP_BID_CHAN=
DKP_REPORTING_CHANNEL=
BOSSMAN_ONWER_ID=
```