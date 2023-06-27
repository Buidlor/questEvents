// quests: 17, 18, 19, 20, 22, 23, 24, 25
import axios from "axios";
import "dotenv/config";

const url = process.env.API_URL!;

const getQuests = async () => {
  const response = await axios.get(url);
  const quests = response.data.map((quest: any) => {
    return {
      questId: quest.id,
      game: quest.game.name,
      questTitle: quest.title,
    };
  });
  return quests;
};

const getPlayers = async () => {
  let quests = await getQuests().then((quests) => {
    return quests.filter((quest: any) => quest.questId !== 20);
  });

  quests = quests.map((quest: any) => {
    return {
      ...quest,
      players: [],
    };
  });
  quests = await Promise.all(
    quests.map(async (quest: any) => {
      const response = await axios.get(url + quest.questId);
      const players = response.data.players.map(
        (player: any) => player.userAddress
      );
      return {
        ...quest,
        players: players,
      };
    })
  );

  return quests;
};

let previousQuests: any[] = [];
let i = 0;

const pollForNewPlayers = async () => {
  console.log("number of calls: ", i++);
  const quests = await getPlayers();

  quests.forEach((quest: any, index: number) => {
    if (previousQuests[index]) {
      const newPlayers = quest.players.filter(
        (player: any) => !previousQuests[index].players.includes(player)
      );
      newPlayers.forEach((player: any) =>
        console.log(`New player added to quest ${quest.questId}: ${player}`)
      );
    }
  });

  previousQuests = quests;
};

// Call pollForNewPlayers every minute
setInterval(pollForNewPlayers, 60000);
