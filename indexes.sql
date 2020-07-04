create index ura_rid_uid on UserRaidAttendances(RaidId, UserId);
create index ura_uid_rid on UserRaidAttendances(RaidId, UserId);
create index raid_when on Raids(`when`);