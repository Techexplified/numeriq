exports.handler = async function (event) {

  const KEY = process.env.TRELLO_KEY;
  const TOKEN = process.env.TRELLO_TOKEN;
  const BOARD_ID = process.env.TRELLO_BOARD;

  async function updateListCounts() {

    const res = await fetch(
      `https://api.trello.com/1/boards/${BOARD_ID}/lists?cards=open&key=${KEY}&token=${TOKEN}`
    );

    const lists = await res.json();

    for (const list of lists) {

      const count = list.cards.length;

      const cleanName = list.name.replace(/\(\d+\)$/, "").trim();
      const newName = `${cleanName} (${count})`;

      await fetch(
        `https://api.trello.com/1/lists/${list.id}?name=${encodeURIComponent(newName)}&key=${KEY}&token=${TOKEN}`,
        { method: "PUT" }
      );
    }
  }

  if (event.httpMethod === "HEAD") {
    return { statusCode: 200 };
  }

  await updateListCounts();

  return {
    statusCode: 200,
    body: "Updated"
  };
};