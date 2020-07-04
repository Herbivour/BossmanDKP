# Bossman DKP
A Discord bot designed for DKP with everquest.  It has a read-only website for members.  All actions are done through the bot in discord.  `DKP Officer` rank members will be able to perform any dkp actions.  Members will be able to bid and check dkp standings via messaging to the bot. Bossman can join a Discord voice channel (if they have discord rights to), and will use TTS to announce bidding and winners.  This uses AWS Poly (https://aws.amazon.com/polly/) to generate the audio.  If you would like to have a sound played when dumps are taken place a wav file in `audio/register.wav`.  We use a cash register cha-ching sound.

### Discord
Join the discord chat [here](https://discord.gg/43xNuMe).

### Amazon Machine Image (ami)
I have submitted an AMI to the Amazon Marketplace.  The readme will be updated when I check back and see if it is approved/denied.
Name (pending): BossmanDKP

### Requirements

* mysql server
* discord bot token
* a server that you can connect to and launch processes

### Configuration

* Check out this code on the server you wish to run the bot on.  
* Configure your MySQL server, and set the `sequelize` config in config/config.json. (Fill in the blanks below, the AMI has this pre-configured)
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
* POLLY_AWS_REGION - The AWS Region used when generating TTS with AWS Poly
Amazon Web Services config (Documentation: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html)
* AWS_ACCESS_KEY_ID 
* AWS_SECRET_ACCESS_KEY
* AWS_DEFAULT_REGION

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