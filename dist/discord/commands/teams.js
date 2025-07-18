"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTeamsMessage = void 0;
const discord_utils_1 = require("../discord_utils");
const v10_1 = require("discord-api-types/v10");
const firestore_1 = require("firebase-admin/firestore");
const settings_db_1 = require("../settings_db");
const madden_db_1 = __importDefault(require("../../db/madden_db"));
const view_1 = require("../../db/view");
const fuzzysort_1 = __importDefault(require("fuzzysort"));
const madden_db_2 = __importDefault(require("../../db/madden_db"));
function formatTeamMessage(teams, teamAssignments) {
    const header = "# Teams";
    const teamsMessage = Object.entries(Object.groupBy(teams, team => team.divName))
        .sort((entry1, entry2) => entry1[0].localeCompare(entry2[0]))
        .map(entry => {
        const divisionalTeams = entry[1] || [];
        const divisionName = entry[0];
        const divisionMessage = divisionalTeams.sort((t1, t2) => t1.displayName.localeCompare(t2.displayName))
            .map(team => {
            const user = teamAssignments?.[`${team.teamId}`]?.discord_user?.id;
            const consoleUser = team.userName;
            const assignment = [user ? [`<@${user}>`] : [], [consoleUser ? `\`${consoleUser}\`` : "`CPU`"]].flat().join(", ");
            return `${team.displayName}: ${assignment}`;
        }).join("\n");
        const divisionHeader = `__**${divisionName}**__`;
        return `${divisionHeader}\n${divisionMessage}`;
    })
        .join("\n");
    const openTeams = teams.filter(t => !teamAssignments?.[`${t.teamId}`]?.discord_user?.id).map(t => t.displayName).join(", ");
    const openTeamsMessage = `OPEN TEAMS: ${openTeams}`;
    return `${header}\n${teamsMessage}\n\n${openTeamsMessage}`;
}
async function fetchTeamsMessage(settings) {
    if (settings?.commands?.madden_league?.league_id) {
        const teams = await madden_db_1.default.getLatestTeams(settings.commands.madden_league.league_id);
        return createTeamsMessage(settings, teams.getLatestTeams());
    }
    else {
        return "# Teams\nNo Madden League connected. Connect Snallabot to your league and reconfigure";
    }
}
exports.fetchTeamsMessage = fetchTeamsMessage;
function createTeamsMessage(settings, teams) {
    if (settings?.commands?.madden_league?.league_id) {
        return formatTeamMessage(teams, settings.commands.teams?.assignments || {});
    }
    else {
        return "# Teams\nNo Madden League connected. Connect Snallabot to your league and reconfigure";
    }
}
exports.default = {
    async handleCommand(command, client, db, ctx) {
        const { guild_id } = command;
        if (!command.data.options) {
            throw new Error("logger command not defined properly");
        }
        const options = command.data.options;
        const teamsCommand = options[0];
        const subCommand = teamsCommand.name;
        const doc = await db.collection("league_settings").doc(guild_id).get();
        const leagueSettings = doc.exists ? doc.data() : {};
        if (subCommand === "configure") {
            if (!teamsCommand.options || !teamsCommand.options[0]) {
                throw new Error("teams configure misconfigured");
            }
            const channel = { id: teamsCommand.options[0].value, id_type: settings_db_1.DiscordIdType.CHANNEL };
            const useRoleUpdates = teamsCommand.options?.[1]?.value || false;
            const oldChannelId = leagueSettings?.commands?.teams?.channel;
            const oldMessageId = leagueSettings?.commands?.teams?.messageId;
            if (oldChannelId && oldChannelId !== channel) {
                const message = await fetchTeamsMessage(leagueSettings);
                try {
                    await client.deleteMessage(oldChannelId, oldMessageId || { id: "", id_type: settings_db_1.DiscordIdType.MESSAGE });
                }
                catch (e) { }
                const newMessageId = await client.createMessage(channel, message, []);
                await db.collection("league_settings").doc(guild_id).set({
                    commands: {
                        teams: {
                            channel: channel,
                            messageId: newMessageId,
                            useRoleUpdates: useRoleUpdates,
                            assignments: leagueSettings?.commands?.teams?.assignments || {},
                        }
                    }
                }, { merge: true });
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Teams Configured"));
            }
            else {
                const oldMessageId = leagueSettings?.commands?.teams?.messageId;
                if (oldMessageId) {
                    try {
                        const messageExists = await client.checkMessageExists(channel, oldMessageId);
                        if (messageExists) {
                            await db.collection("league_settings").doc(guild_id).set({
                                commands: {
                                    teams: {
                                        useRoleUpdates: useRoleUpdates,
                                        assignments: leagueSettings?.commands.teams?.assignments || {},
                                    }
                                }
                            }, { merge: true });
                            const message = await fetchTeamsMessage(leagueSettings);
                            await client.editMessage(channel, oldMessageId, message, []);
                            (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Teams Configured"));
                        }
                        return;
                    }
                    catch (e) {
                        console.debug(e);
                    }
                }
                const message = await fetchTeamsMessage(leagueSettings);
                const messageId = await client.createMessage(channel, message, []);
                await db.collection("league_settings").doc(guild_id).set({
                    commands: {
                        teams: {
                            channel: channel,
                            messageId: messageId,
                            useRoleUpdates: useRoleUpdates,
                            assignments: leagueSettings?.commands?.teams?.assignments || {},
                        }
                    }
                }, { merge: true });
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Teams Configured"));
            }
        }
        else if (subCommand === "assign") {
            if (!teamsCommand.options || !teamsCommand.options[0] || !teamsCommand.options[1]) {
                throw new Error("teams assign misconfigured");
            }
            const teamSearchPhrase = teamsCommand.options[0].value.toLowerCase();
            const user = teamsCommand.options[1].value;
            if (!leagueSettings?.commands?.madden_league?.league_id) {
                throw new Error("No Madden league linked, setup the bot with your madden league first.");
            }
            if (!leagueSettings?.commands?.teams?.channel.id) {
                throw new Error("Teams not configured, run /teams configure first");
            }
            const leagueId = leagueSettings.commands.madden_league.league_id;
            const teams = await madden_db_2.default.getLatestTeams(leagueId);
            const teamsToSearch = await view_1.teamSearchView.createView(leagueId);
            if (!teamsToSearch) {
                throw new Error("no teams found");
            }
            const results = fuzzysort_1.default.go(teamSearchPhrase, Object.values(teamsToSearch), { keys: ["cityName", "abbrName", "nickName", "displayName"], threshold: 0.9 });
            if (results.length < 1) {
                throw new Error(`Could not find team for phrase ${teamSearchPhrase}.Enter a team name, city, abbreviation, or nickname.Examples: Buccaneers, TB, Tampa Bay, Bucs`);
            }
            else if (results.length > 1) {
                throw new Error(`Found more than one  team for phrase ${teamSearchPhrase}.Enter a team name, city, abbreviation, or nickname.Examples: Buccaneers, TB, Tampa Bay, Bucs.Found teams: ${results.map(t => t.obj.displayName).join(", ")} `);
            }
            const assignedTeam = results[0].obj;
            const role = teamsCommand?.options?.[2]?.value;
            const roleAssignment = role ? { discord_role: { id: role, id_type: settings_db_1.DiscordIdType.ROLE } } : {};
            const assignments = { ...leagueSettings.commands.teams?.assignments, [teams.getTeamForId(assignedTeam.id).teamId]: { discord_user: { id: user, id_type: settings_db_1.DiscordIdType.USER }, ...roleAssignment } };
            leagueSettings.commands.teams.assignments = assignments;
            await db.collection("league_settings").doc(guild_id).set({
                commands: {
                    teams: {
                        assignments: assignments
                    }
                }
            }, { merge: true });
            const message = createTeamsMessage(leagueSettings, teams.getLatestTeams());
            try {
                await client.editMessage(leagueSettings.commands.teams.channel, leagueSettings.commands.teams.messageId, message, []);
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Team Assigned"));
            }
            catch (e) {
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Could not update teams message, this could be a permission issue. The assignment was saved, Error: " + e));
            }
        }
        else if (subCommand === "free") {
            if (!teamsCommand.options || !teamsCommand.options[0]) {
                throw new Error("teams free misconfigured");
            }
            const teamSearchPhrase = teamsCommand.options[0].value.toLowerCase();
            if (!leagueSettings?.commands?.madden_league?.league_id) {
                throw new Error("No Madden league linked, setup the bot with your madden league first.");
            }
            if (!leagueSettings.commands.teams?.channel.id) {
                throw new Error("Teams not configured, run /teams configure first");
            }
            const leagueId = leagueSettings.commands.madden_league.league_id;
            const teams = await madden_db_1.default.getLatestTeams(leagueId);
            const teamsToSearch = await view_1.teamSearchView.createView(leagueId);
            if (!teamsToSearch) {
                throw new Error("no teams found");
            }
            const results = fuzzysort_1.default.go(teamSearchPhrase, Object.values(teamsToSearch), { keys: ["cityName", "abbrName", "nickName", "displayName"], threshold: 0.9 });
            if (results.length < 1) {
                throw new Error(`Could not find team for phrase ${teamSearchPhrase}.Enter a team name, city, abbreviation, or nickname.Examples: Buccaneers, TB, Tampa Bay, Bucs`);
            }
            else if (results.length > 1) {
                throw new Error(`Found more than one  team for phrase ${teamSearchPhrase}.Enter a team name, city, abbreviation, or nickname.Examples: Buccaneers, TB, Tampa Bay, Bucs.Found teams: ${results.map(t => t.obj.displayName).join(", ")}`);
            }
            const assignedTeam = results[0].obj;
            const teamIdToDelete = teams.getTeamForId(assignedTeam.id).teamId;
            const currentAssignments = { ...leagueSettings.commands.teams.assignments };
            delete currentAssignments[`${teamIdToDelete}`];
            leagueSettings.commands.teams.assignments = currentAssignments;
            await db.collection("league_settings").doc(guild_id).update({
                [`commands.teams.assignments.${teamIdToDelete}`]: firestore_1.FieldValue.delete()
            });
            const message = createTeamsMessage(leagueSettings, teams.getLatestTeams());
            try {
                await client.editMessage(leagueSettings.commands.teams.channel, leagueSettings.commands.teams.messageId, message, []);
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Team Freed"));
            }
            catch (e) {
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Could not update teams message, this could be a permission issue. The assignment was freed1, Error: " + e));
            }
        }
        else if (subCommand === "reset") {
            if (!leagueSettings.commands.teams?.channel.id) {
                throw new Error("Teams not configured, run /teams configure first");
            }
            await db.collection("league_settings").doc(guild_id).update({
                [`commands.teams.assignments`]: firestore_1.FieldValue.delete()
            });
            if (leagueSettings.commands.teams?.assignments) {
                leagueSettings.commands.teams.assignments = {};
            }
            const message = await fetchTeamsMessage(leagueSettings);
            try {
                await client.editMessage(leagueSettings.commands.teams.channel, leagueSettings.commands.teams.messageId, message, []);
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Team Assignments Reset"));
            }
            catch (e) {
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Could not update teams message, this could be a permission issue. The teams were still reset, Error: " + e));
            }
        }
        else {
            throw new Error(`teams ${subCommand} misconfigured`);
        }
    },
    commandDefinition() {
        return {
            name: "teams",
            description: "Displays the current teams in your league with the members the teams are assigned to",
            options: [
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "assign",
                    description: "assign a discord user to the specified team",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "team",
                            description: "the team city, name, or abbreviation. Ex: Buccaneers, TB, Tampa Bay",
                            required: true,
                            autocomplete: true
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.User,
                            name: "user",
                            description: "the discord member you want to assign to this team",
                            required: true,
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Role,
                            name: "role",
                            description: "the role that will be tracked with this team",
                            required: false,
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "free",
                    description: "remove the user assigned to this team, making the team open",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "team",
                            description: "the team city, name, or abbreviation. Ex: Buccaneers, TB, Tampa Bay",
                            required: true,
                            autocomplete: true
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "configure",
                    description: "sets channel that will display all the teams and the members assigned to them",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.Channel,
                            name: "channel",
                            description: "channel to display your teams in",
                            required: true,
                            channel_types: [v10_1.ChannelType.GuildText],
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Boolean,
                            name: "use_role_updates",
                            description: "turn on role updates to auto assign teams based on team roles",
                            required: false,
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "reset",
                    description: "resets all teams assignments making them all open",
                    options: [],
                },
            ],
            type: 1,
        };
    },
    async choices(command) {
        const { guild_id } = command;
        if (!command.data.options) {
            throw new Error("logger command not defined properly");
        }
        const options = command.data.options;
        const teamsCommand = options[0];
        const subCommand = teamsCommand.name;
        const view = await view_1.discordLeagueView.createView(guild_id);
        const leagueId = view?.leagueId;
        if (leagueId && teamsCommand?.options?.[0]?.focused && teamsCommand?.options?.[0]?.value) {
            const teamSearchPhrase = teamsCommand.options[0].value;
            const teamsToSearch = await view_1.teamSearchView.createView(leagueId);
            if (teamsToSearch) {
                const results = fuzzysort_1.default.go(teamSearchPhrase, Object.values(teamsToSearch), { keys: ["cityName", "abbrName", "nickName", "displayName"], threshold: 0.4, limit: 25 });
                return results.map(r => ({ name: r.obj.displayName, value: r.obj.displayName }));
            }
        }
        return [];
    }
};
//# sourceMappingURL=teams.js.map