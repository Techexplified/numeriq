import { useEffect, useState } from "react";
import "./App.css";

/* global TrelloPowerUp */

function App() {
  const [boardName, setBoardName] = useState("");
  const [totals, setTotals] = useState({ totalCards: 0, completedCards: 0 });
  
  // State for both tables
  const [listData, setListData] = useState([]);
  const [cardsData, setCardsData] = useState([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.TrelloPowerUp.iframe();

    async function loadData() {
      // Fetch everything we need in one go
      const [board, lists, cards] = await Promise.all([
        t.board("name"),
        t.lists("id", "name"),
        t.cards("id", "name", "idList", "members", "labels", "due", "dueComplete")
      ]);

      setBoardName(board.name);

      let totalCompleted = 0;
      const listMap = {};

      // 1. Process Data for the Upper Table (List Summary)
      const summaryData = lists.map(list => {
        listMap[list.id] = list.name; // Save this mapping for the detailed table below
        
        const cardsInList = cards.filter(card => card.idList === list.id);
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

      // 2. Process Data for the Lower Table (Detailed Analysis)
      const detailedCards = cards.map(card => {
        const listName = listMap[card.idList] || "Unknown List";
        const isDone = card.dueComplete || listName.toLowerCase() === "done";

        return {
          id: card.id,
          name: card.name,
          listName: listName,
          members: card.members || [],
          labels: card.labels || [],
          due: card.due ? new Date(card.due).toLocaleDateString() : "-",
          isDone: isDone
        };
      });

      // Update all React states
      setListData(summaryData);
      setCardsData(detailedCards);
      setTotals({
        totalCards: cards.length,
        completedCards: totalCompleted
      });
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) return <div style={{ padding: "20px", color: "#5e6c84" }}>Loading Numeriq Stats...</div>;

  return (
    <div style={{ padding: "15px", fontFamily: "sans-serif" }}>
      {/* HEADER */}
      <h2 style={{ margin: "0 0 5px 0", color: "#172b4d" }}>Numeriq Dashboard</h2>
      <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#5e6c84" }}>
        Board: <strong>{boardName}</strong>
      </p>

      {/* TOP LEVEL STATS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
        <div style={{ background: "#f4f5f7", padding: "10px", borderRadius: "5px", flex: 1, textAlign: "center" }}>
          <strong style={{ color: "#5e6c84", fontSize: "12px", textTransform: "uppercase" }}>Total Tasks</strong>
          <div style={{ fontSize: "24px", color: "#172b4d", fontWeight: "bold", marginTop: "5px" }}>{totals.totalCards}</div>
        </div>
        <div style={{ background: "#e3fcef", padding: "10px", borderRadius: "5px", flex: 1, textAlign: "center" }}>
          <strong style={{ color: "#006644", fontSize: "12px", textTransform: "uppercase" }}>Completed</strong>
          <div style={{ fontSize: "24px", color: "#006644", fontWeight: "bold", marginTop: "5px" }}>{totals.completedCards}</div>
        </div>
      </div>

      {/* TABLE 1: LIST SUMMARY (Upper) */}
      <h3 style={{ fontSize: "16px", color: "#172b4d", borderBottom: "2px solid #dfe1e6", paddingBottom: "5px", marginBottom: "10px" }}>
        List Summary
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", marginBottom: "40px" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#5e6c84" }}>
            <th style={{ padding: "8px", borderBottom: "1px solid #dfe1e6" }}>List Name</th>
            <th style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #dfe1e6" }}>Cards</th>
            <th style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #dfe1e6" }}>Done</th>
          </tr>
        </thead>
        <tbody>
          {listData.map(list => (
            <tr key={list.id} style={{ borderBottom: "1px solid #ebecf0" }}>
              <td style={{ padding: "8px", fontWeight: "500" }}>{list.name}</td>
              <td style={{ padding: "8px", textAlign: "center" }}>{list.totalCards}</td>
              <td style={{ padding: "8px", textAlign: "center", color: list.completed > 0 ? "#006644" : "inherit", fontWeight: list.completed > 0 ? "bold" : "normal" }}>
                {list.completed}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TABLE 2: DETAILED ANALYSIS (Lower) */}
      <h3 style={{ fontSize: "16px", color: "#172b4d", borderBottom: "2px solid #dfe1e6", paddingBottom: "5px", marginBottom: "10px" }}>
        Detailed Task Analysis
      </h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
          <thead>
            <tr style={{ color: "#5e6c84" }}>
              <th style={{ padding: "10px 8px", borderBottom: "1px solid #dfe1e6" }}>Task</th>
              <th style={{ padding: "10px 8px", borderBottom: "1px solid #dfe1e6" }}>List</th>
              <th style={{ padding: "10px 8px", borderBottom: "1px solid #dfe1e6" }}>Members</th>
              <th style={{ padding: "10px 8px", borderBottom: "1px solid #dfe1e6" }}>Labels</th>
              <th style={{ padding: "10px 8px", borderBottom: "1px solid #dfe1e6" }}>Due</th>
              <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: "1px solid #dfe1e6" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {cardsData.map(card => (
              <tr key={card.id} style={{ borderBottom: "1px solid #ebecf0", backgroundColor: card.isDone ? "#fafffa" : "transparent" }}>
                <td style={{ padding: "10px 8px", fontWeight: "500", color: "#172b4d" }}>{card.name}</td>
                <td style={{ padding: "10px 8px", color: "#5e6c84" }}>{card.listName}</td>
                <td style={{ padding: "10px 8px" }}>
                  {card.members.length > 0 
                    ? card.members.map(m => m.fullName).join(", ") 
                    : <span style={{ color: "#a5adba", fontStyle: "italic" }}>-</span>}
                </td>
                <td style={{ padding: "10px 8px" }}>
                  {card.labels.length > 0 ? (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {card.labels.map(label => (
                        <span key={label.id} style={{ backgroundColor: label.color || "#091e420f", color: label.color ? "#fff" : "#172b4d", padding: "2px 6px", borderRadius: "3px", fontSize: "11px", fontWeight: "bold" }}>
                          {label.name || "Label"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: "#a5adba" }}>-</span>
                  )}
                </td>
                <td style={{ padding: "10px 8px", color: card.due !== "-" ? "#172b4d" : "#a5adba" }}>{card.due}</td>
                <td style={{ padding: "10px 8px", textAlign: "center" }}>
                  {card.isDone ? (
                    <span style={{ backgroundColor: "#e3fcef", color: "#006644", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>Done</span>
                  ) : (
                    <span style={{ backgroundColor: "#fffae6", color: "#b36200", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;