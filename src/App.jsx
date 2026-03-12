import { useEffect, useState } from "react";
import "./App.css";

/* global TrelloPowerUp */

function App() {
  const [boardName, setBoardName] = useState("");
  const [totals, setTotals] = useState({ totalCards: 0, completedCards: 0 });
  const [listData, setListData] = useState([]);
  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.TrelloPowerUp.iframe();

    async function loadData() {
      const [board, lists, cards] = await Promise.all([
        t.board("name"),
        t.lists("id", "name"),
        t.cards("id", "name", "idList", "members", "labels", "due", "dueComplete")
      ]);

      setBoardName(board.name);

      let totalCompleted = 0;
      const listMap = {};

      const summaryData = lists.map(list => {
        listMap[list.id] = list.name;
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

      setListData(summaryData);
      setCardsData(detailedCards);
      setTotals({ totalCards: cards.length, completedCards: totalCompleted });
      setLoading(false);
    }

    loadData();
  }, []);

  // NEW: Function to generate and download the PDF
  const downloadPDF = () => {
    const element = document.getElementById("pdf-content");
    const opt = {
      margin: 0.5,
      filename: `${boardName}_Numeriq_Report.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "landscape" }
    };
    // Calls the library we added in index.html
    window.html2pdf().set(opt).from(element).save();
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#5e6c84" }}>Loading Numeriq Stats...</div>;

  return (
    <div className="dashboard-wrapper">
      
      {/* HEADER: Title and PDF Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h2 style={{ margin: "0 0 5px 0", color: "#172b4d", fontSize: "28px" }}>Numeriq Dashboard</h2>
          <p style={{ margin: "0", fontSize: "16px", color: "#5e6c84" }}>Board: <strong>{boardName}</strong></p>
        </div>
        <button 
          onClick={downloadPDF}
          style={{
            backgroundColor: "#0052cc", color: "white", padding: "10px 20px",
            border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
          }}>
          📥 Download PDF Report
        </button>
      </div>

      {/* This div is what gets converted to a PDF */}
      <div id="pdf-content">
        
        {/* TOP LEVEL STATS */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
          <div style={{ background: "white", padding: "20px", borderRadius: "8px", flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "5px solid #0052cc" }}>
            <strong style={{ color: "#5e6c84", fontSize: "14px", textTransform: "uppercase" }}>Total Tasks</strong>
            <div style={{ fontSize: "32px", color: "#172b4d", fontWeight: "bold", marginTop: "10px" }}>{totals.totalCards}</div>
          </div>
          <div style={{ background: "white", padding: "20px", borderRadius: "8px", flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "5px solid #006644" }}>
            <strong style={{ color: "#5e6c84", fontSize: "14px", textTransform: "uppercase" }}>Completed Tasks</strong>
            <div style={{ fontSize: "32px", color: "#006644", fontWeight: "bold", marginTop: "10px" }}>{totals.completedCards}</div>
          </div>
        </div>

        {/* TABLE 1: LIST SUMMARY */}
        <h3 style={{ fontSize: "20px", color: "#172b4d", marginBottom: "15px" }}>List Summary</h3>
        <div className="table-container">
          <table className="numeriq-table">
            <thead>
              <tr>
                <th>List Name</th>
                <th style={{ textAlign: "center" }}>Total Cards</th>
                <th style={{ textAlign: "center" }}>Completed</th>
              </tr>
            </thead>
            <tbody>
              {listData.map(list => (
                <tr key={list.id}>
                  <td style={{ fontWeight: "600" }}>{list.name}</td>
                  <td style={{ textAlign: "center" }}>{list.totalCards}</td>
                  <td style={{ textAlign: "center", color: list.completed > 0 ? "#006644" : "inherit", fontWeight: list.completed > 0 ? "bold" : "normal" }}>
                    {list.completed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABLE 2: DETAILED ANALYSIS */}
        <h3 style={{ fontSize: "20px", color: "#172b4d", marginBottom: "15px" }}>Detailed Task Analysis</h3>
        <div className="table-container">
          <table className="numeriq-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>List</th>
                <th>Members</th>
                <th>Labels</th>
                <th>Due</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {cardsData.map(card => (
                <tr key={card.id} style={{ backgroundColor: card.isDone ? "#fafffa" : "transparent" }}>
                  <td style={{ fontWeight: "500" }}>{card.name}</td>
                  <td>{card.listName}</td>
                  <td>
                    {card.members.length > 0 
                      ? card.members.map(m => m.fullName).join(", ") 
                      : <span style={{ color: "#a5adba", fontStyle: "italic" }}>Unassigned</span>}
                  </td>
                  <td>
                    {card.labels.length > 0 ? (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {card.labels.map(label => (
                          <span key={label.id} style={{ backgroundColor: label.color || "#091e420f", color: label.color ? "#fff" : "#172b4d", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>
                            {label.name || "Label"}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#a5adba" }}>-</span>
                    )}
                  </td>
                  <td style={{ color: card.due !== "-" ? "#172b4d" : "#a5adba" }}>{card.due}</td>
                  <td style={{ textAlign: "center" }}>
                    {card.isDone ? (
                      <span style={{ backgroundColor: "#e3fcef", color: "#006644", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>Done</span>
                    ) : (
                      <span style={{ backgroundColor: "#fffae6", color: "#b36200", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
      </div>
    </div>
  );
}

export default App;