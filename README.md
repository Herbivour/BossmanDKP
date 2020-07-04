# Bossman DKP
A Discord bot designed for DKP with everquest.  It has a read-only website for members.  All actions are done through the bot in discord.  `DKP Officer` rank members will be able to perform any dkp actions.  Members will be able to bid and check dkp standings via messaging to the bot. Bossman can join a Discord voice channel (if they have discord rights to), and will use TTS to announce bidding and winners.  This uses AWS Po;ly (https://aws.amazon.com/polly/) to generate the audio.  If you would like to have a sound played when dumps are taken place a wav file in `audio/register.wav`.  We use a cash register cha-ching sound.

### Discord
Join the discord chat [here](https://discord.gg/43xNuMe).

### Amazon Machine Image (ami)
I have submitted an AMI to the Amazon Marketplace.  The readme will be updated when I check back and see if it is approved/denied.
Name (pending): BossmanDKP

To launch the AMI:
* Log in to your Amazon Web Services account
* Navigate to the `EC2` product
* Select `Instances` from the left menu
* Click `Launch Instance` from the top bar.
* Search for `BossmanDKP`
* Select `Community AMIs` from the left menu.
* Select the version of BossmanDKP you wish to run (current version: `BossmanDKP-2020.7.4`)
* I suggest using a `t3a.micro` instance. `t2.micro` should work as well, and will be "free" for the first year of your amazon web services account.
* Click `Review and Launch`
* Click `Launch`
* Select your SSH Keys (used to connect to the server)
* View the running instances
* Edit the security group (Click the instance name, in the bottom pane find `Security groups` and click the link to the security group)
* Select `Inbound rules`
* `Edit inbound rules`
* `Add rule` - Add `HTTP` and enter `0.0.0.0/0` in the input field next to the dropdown that says `Custom`
* `Save rules`
* You will no be able to navigate to the IP address listed on the Instances page.

The instance is now running, and accessable.  You will need to connect to the instance and configure the Discord Bot's environment variables.  To do this SSH in (AWS has instructions on the instance page under `Actions` => `Connect`). Once you are connected you can edit `~/.bashrc` via `nano ~/.bashrc`. Scroll to the bottom of the file and fill in the environment variables.  Once this has been completed you can run `forever restartall` to restart the web server and the discord bot.  It is highly suggested that you assign an elastic IP to your Instance.  This will prevent the instance from changing it's IP if you ever choose to shutdown/reboot.  To do this allocate and assign an IP address in the `Networking & Security` => `Elastic IPs section of the EC2 console.

#### AWS IAM

To allow Bossman to use AWS Polly you will want to assign your instance an IAM role.  To do this we need to create a new role for the server to use.  Navigate to the [IAM](https://console.aws.amazon.com/iam/home#/roles) section of the AWS console. 

In the `Roles` section of the IAM console do the following:
* `Create role`
* `EC2`
* `Next: Permissions`
* `Create Policy`
* Select the `Polly` service
* Check `All Polly Actions`
* Select `Resources`
* Click `Add ARN` in the `lexicon` section
* Click the `Any` box for `Region` and `Lexicon name`.  If you know the specific values you want to use for these use those instead
* Click `Add`
* Click `Review policy` at the bottom
* Give it a name.  I used `BossmanPolicy`
* Click `Create policy` at the bottom
* Go back to the Role you are creating
* Search for the name you used for the Policy and select it.
* Click `Next: tags`
* Click `Next: Review`
* Give it a name, I used `BossmanRole`
* Click `Create Role`
* Go to your EC2 Instances page
* Select the Bossman server
* From `Actions` choose `Instance Settings` => `Attach/Replace IAM Role`
* Select the role name you used. (Ex: `BossmanRole`)
* Click `Apply`

Bossman now has permissions to access the AWS Polly service.





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
* POLLY_AWS_REGION - The AWS Region used when generating TTS with AWS Polly
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