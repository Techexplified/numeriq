import { useEffect, useState } from "react";
import "./App.css";

/* global TrelloPowerUp */

function App() {
  const [boardName, setBoardName] = useState("");
  const [totals, setTotals] = useState({ totalCards: 0, completedCards: 0 });
  const [listData, setListData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.TrelloPowerUp.iframe();

    async function loadData() {
      // Fetch everything we need in parallel
      const [board, lists, cards] = await Promise.all([
        t.board("name"),
        t.lists("all"),
        t.cards("all")
      ]);

      setBoardName(board.name);

      let totalCompleted = 0;

      // Group cards by their Lists
      const tableData = lists.map(list => {
        // Find cards that belong to this list
        const cardsInList = cards.filter(card => card.idList === list.id);
        
        // Count how many are completed. 
        // We assume a card is completed if Trello's due date is marked done, OR if the list is named "Done"
        const completedInList = cardsInList.filter(card => 
          card.dueComplete || list.name.toLowerCase() === "done"
        ).length;

        totalCompleted += completedInList;

        return {
          id: list.id,
          name: list.name,
          totalCards: cardsInList.length,
          completed: completedInList
        };
      });

      setListData(tableData);
      setTotals({
        totalCards: cards.length,
        completedCards: totalCompleted
      });
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) return <div style={{ padding: "20px" }}>Loading stats...</div>;

  return (
    <div style={{ padding: "15px", fontFamily: "sans-serif" }}>
      <h2 style={{ margin: "0 0 10px 0" }}>Board Summary</h2>
      <p style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#5e6c84" }}>
        {boardName}
      </p>

      {/* Top Level Summary Stats */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <div style={{ background: "#f4f5f7", padding: "10px", borderRadius: "5px", flex: 1, textAlign: "center" }}>
          <strong>Total Cards</strong>
          <div style={{ fontSize: "20px", color: "#172b4d" }}>{totals.totalCards}</div>
        </div>
        <div style={{ background: "#e3fcef", padding: "10px", borderRadius: "5px", flex: 1, textAlign: "center" }}>
          <strong>Completed</strong>
          <div style={{ fontSize: "20px", color: "#006644" }}>{totals.completedCards}</div>
        </div>
      </div>

      {/* Tabular Data */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #dfe1e6", textAlign: "left" }}>
            <th style={{ padding: "8px" }}>List Name</th>
            <th style={{ padding: "8px", textAlign: "center" }}>Cards</th>
            <th style={{ padding: "8px", textAlign: "center" }}>Done</th>
          </tr>
        </thead>
        <tbody>
          {listData.map(list => (
            <tr key={list.id} style={{ borderBottom: "1px solid #ebecf0" }}>
              <td style={{ padding: "8px", fontWeight: "500" }}>{list.name}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{list.totalCards}</td>
              <td style={{ padding: "8px", textAlign: "center", color: list.completed > 0 ? "#006644" : "inherit" }}>
                {list.completed}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;