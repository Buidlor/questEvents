// quests: 17, 18, 19, 20, 22, 23, 24, 25
import axios from "axios";
import "dotenv/config";

const url = process.env.API_URL!;
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL!;

const getQuests = async () => {
  const response = await axios.get(url);
  const quests = response.data.map((quest: any) => {
    return {
      questId: quest.id,
      game: quest.game?.name,
      questTitle: quest.title,
    };
  });

  return quests;
};

const getPlayers = async () => {
  let quests = await getQuests().then((quests) => {
    return quests.filter(
      (quest: any) => quest.questId !== 20 && quest.questId !== 24
    );
  });

  quests = quests.map((quest: any) => {
    return {
      ...quest,
      players: [],
    };
  });
  quests = await Promise.all(
    quests.map(async (quest: any) => {
      try {
        const response = await axios.get(url + quest.questId);
        const players = response.data.players.map(
          (player: any) => player.userAddress
        );
        return {
          ...quest,
          players: players,
        };
      } catch (error) {
        console.log("the quest was not found: ", error);
        return quest;
      }
    })
  );

  return quests;
};

const postMessageToSlack = async (message: string) => {
  await axios.post(slackWebhookUrl, {
    text: message,
  });
};

let previousQuests: any[] = [];
let i = 1;

const pollForNewPlayers = async () => {
  console.log("number of calls: ", i++);
  const quests = await getPlayers();

  quests.forEach(async (quest: any, index: number) => {
    if (previousQuests[index]) {
      const newPlayers = quest.players.filter(
        (player: any) => !previousQuests[index].players.includes(player)
      );
      console.log(`new players of quest id ${quest.questId}: ${newPlayers}`);
      newPlayers.forEach(async (player: any) => {
        const message = `New player added to quest ${quest.questId}: ${player}`;
        console.log(message);
        await postMessageToSlack(message);
      });
    }
  });
  previousQuests = quests;
};

// Call pollForNewPlayers every minute
setInterval(pollForNewPlayers, 15000);
