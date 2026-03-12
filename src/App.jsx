import { useEffect, useState } from "react";
import "./App.css";

/* global TrelloPowerUp */

function App() {
  const [boardName, setBoardName] = useState("");
  const [totals, setTotals] = useState({ totalCards: 0, completedCards: 0 });
  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.TrelloPowerUp.iframe();

    async function loadData() {
      // Fetch the specific fields we need for the detailed table
      const [board, lists, cards] = await Promise.all([
        t.board("name"),
        t.lists("id", "name"),
        t.cards("id", "name", "idList", "members", "labels", "due", "dueComplete")
      ]);

      setBoardName(board.name);

      // Create a quick lookup map so we can match list IDs to list names
      const listMap = {};
      lists.forEach(list => {
        listMap[list.id] = list.name;
      });

      let completedCount = 0;

      // Process each card to format the data for our table
      const detailedCards = cards.map(card => {
        const listName = listMap[card.idList] || "Unknown List";
        
        // A card is 'Done' if the due date is checked off OR if it lives in a "Done" list
        const isDone = card.dueComplete || listName.toLowerCase() === "done";
        if (isDone) completedCount++;

        return {
          id: card.id,
          name: card.name,
          listName: listName,
          members: card.members || [],
          labels: card.labels || [],
          // Format the due date nicely, or return a dash if there isn't one
          due: card.due ? new Date(card.due).toLocaleDateString() : "-",
          isDone: isDone
        };
      });

      setCardsData(detailedCards);
      setTotals({
        totalCards: cards.length,
        completedCards: completedCount
      });
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) return <div style={{ padding: "20px", color: "#5e6c84" }}>Loading detailed stats...</div>;

  return (
    <div style={{ padding: "15px", fontFamily: "sans-serif" }}>
      <h2 style={{ margin: "0 0 10px 0", color: "#172b4d" }}>Board Summary</h2>
      <p style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#5e6c84" }}>
        {boardName}
      </p>

      {/* Top Level Summary Stats */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <div style={{ background: "#f4f5f7", padding: "10px", borderRadius: "5px", flex: 1, textAlign: "center" }}>
          <strong style={{ color: "#5e6c84", fontSize: "12px", textTransform: "uppercase" }}>Total Tasks</strong>
          <div style={{ fontSize: "24px", color: "#172b4d", fontWeight: "bold", marginTop: "5px" }}>{totals.totalCards}</div>
        </div>
        <div style={{ background: "#e3fcef", padding: "10px", borderRadius: "5px", flex: 1, textAlign: "center" }}>
          <strong style={{ color: "#006644", fontSize: "12px", textTransform: "uppercase" }}>Completed</strong>
          <div style={{ fontSize: "24px", color: "#006644", fontWeight: "bold", marginTop: "5px" }}>{totals.completedCards}</div>
        </div>
      </div>

      {/* Detailed Tabular Data */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #dfe1e6", color: "#5e6c84" }}>
              <th style={{ padding: "10px 8px" }}>Task</th>
              <th style={{ padding: "10px 8px" }}>List</th>
              <th style={{ padding: "10px 8px" }}>Members</th>
              <th style={{ padding: "10px 8px" }}>Labels</th>
              <th style={{ padding: "10px 8px" }}>Due Date</th>
              <th style={{ padding: "10px 8px", textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {cardsData.map(card => (
              <tr key={card.id} style={{ borderBottom: "1px solid #ebecf0" }}>
                
                {/* Task Name */}
                <td style={{ padding: "10px 8px", fontWeight: "500", color: "#172b4d" }}>{card.name}</td>
                
                {/* List Name */}
                <td style={{ padding: "10px 8px", color: "#5e6c84" }}>{card.listName}</td>
                
                {/* Members */}
                <td style={{ padding: "10px 8px" }}>
                  {card.members.length > 0 
                    ? card.members.map(m => m.fullName).join(", ") 
                    : <span style={{ color: "#a5adba", fontStyle: "italic" }}>Unassigned</span>}
                </td>

                {/* Labels */}
                <td style={{ padding: "10px 8px" }}>
                  {card.labels.length > 0 ? (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {card.labels.map(label => (
                        <span 
                          key={label.id} 
                          style={{ 
                            backgroundColor: label.color ? label.color : "#091e420f", 
                            color: label.color ? "#fff" : "#172b4d",
                            padding: "2px 6px", 
                            borderRadius: "3px", 
                            fontSize: "11px",
                            fontWeight: "bold",
                            textShadow: label.color ? "0 0 2px rgba(0,0,0,0.3)" : "none" 
                          }}>
                          {label.name || "Label"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: "#a5adba" }}>-</span>
                  )}
                </td>

                {/* Due Date */}
                <td style={{ padding: "10px 8px", color: card.due !== "-" ? "#172b4d" : "#a5adba" }}>
                  {card.due}
                </td>

                {/* Status Badge */}
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