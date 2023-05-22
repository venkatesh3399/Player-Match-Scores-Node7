const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(2424, () => {
      console.log("Server Running at http://localhost:2424/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

convertPlayerDetails = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

convertMatchDetails = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

convertPlayerMatchScoreDetails = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

// Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const allPlayers = `SELECT  * FROM player_details;`;
  const playersList = await db.all(allPlayers);
  response.send(playersList.map((each) => convertPlayerDetails(each)));
});

// Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const player = await db.get(playerDetails);
  response.send(convertPlayerDetails(player));
});

// Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const playerDetails = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
  await db.run(playerDetails);
  response.send("Player Details Updated");
});

// Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetails = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const match = await db.get(matchDetails);
  response.send(convertMatchDetails(match));
});

// Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `SELECT match_details.match_id AS matchId,match,year FROM match_details JOIN player_match_score ON match_details.match_id = player_match_score.match_id WHERE player_match_score.player_id = ${playerId};`;
  const playerMatches = await db.all(getPlayerMatches);
  response.send(playerMatches);
});

// Returns a list of players of a specific match
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersInMatch = `SELECT player_details.player_id AS playerId, player_details.player_name AS playerName FROM player_details JOIN player_match_score ON player_details.player_id = player_match_score.player_id WHERE player_match_score.match_id = ${matchId};`;
  const playersInMatch = await db.all(getPlayersInMatch);
  response.send(playersInMatch);
});

// Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScores = `SELECT player_details.player_id AS playerId, player_details.player_name AS playerName, SUM(score) AS totalScore, SUM(fours) AS totalFours, SUM(sixes) AS totalSixes FROM player_details JOIN player_match_score ON player_details.player_id = player_match_score.player_id WHERE player_details.player_id = ${playerId};`;
  const playerScores = await db.get(getPlayerScores);
  response.send(playerScores);
});

module.exports = app;
