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
        return null;
      }
    })
  );
  quests = quests.filter((quest: any) => quest !== null);

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

  for (const currentQuest of quests) {
    const previousQuest = previousQuests.find(
      (q) => q.questId === currentQuest.questId
    );
    if (previousQuest) {
      const newPlayers = currentQuest.players.filter(
        (player: any) => !previousQuest.players.includes(player)
      );

      for (const player of newPlayers) {
        const message = `New player added to quest ${currentQuest.questId}: ${player}`;
        console.log(message);
        await postMessageToSlack(message);
      }
    }
  }
  previousQuests = JSON.parse(JSON.stringify(quests));
};

setInterval(pollForNewPlayers, 30000);
