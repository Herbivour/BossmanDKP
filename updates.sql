Select m.id, (Select sum(Raids.value) from Raids Join UserRaidAttendances on Raids.id = UserRaidAttendances.RaidId Join Users on Users.id = UserRaidAttendances.UserId where Users.Id = m.id) as pts from Users as m;


Update Users Set earnedPoints = (Select sum(Raids.value) from Raids Join UserRaidAttendances on Raids.id = UserRaidAttendances.RaidId Join Users as U2 on U2.id = UserRaidAttendances.UserId where U2.Id = Users.id);
Update Users Set spentPoints = (Select sum(UserItemPurchases.value) from UserItemPurchases Join Users as U2 on U2.id = UserItemPurchases.UserId where U2.Id = Users.id);


UPDATE 
Users
Set
`30day` = 100.0 * (Select count(*) from UserRaidAttendances Join Raids on UserRaidAttendances.RaidId = Raids.id where UserId = Users.id and `when` > datetime('now', '-30 days')) / (Select count(*) from Raids where `when` > datetime('now', '-30 days') ),
`60day` = 100.0 * (Select count(*) from UserRaidAttendances Join Raids on UserRaidAttendances.RaidId = Raids.id where UserId = Users.id and `when` > datetime('now', '-60 days')) / (Select count(*) from Raids where `when` > datetime('now', '-60 days') ),
`90day` = 100.0 * (Select count(*) from UserRaidAttendances Join Raids on UserRaidAttendances.RaidId = Raids.id where UserId = Users.id and `when` > datetime('now', '-90 days')) / (Select count(*) from Raids where `when` > datetime('now', '-90 days') );