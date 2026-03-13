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
        return { id: list.id, name: list.name, totalCards: cardsInList.length, completed: completedInList };
      });

      const detailedCards = cards.map(card => {
        const listName = listMap[card.idList] || "Unknown List";
        const isDone = card.dueComplete || listName.toLowerCase() === "done";
        return {
          id: card.id, name: card.name, listName: listName, members: card.members || [],
          labels: card.labels || [], due: card.due ? new Date(card.due).toLocaleDateString() : "-", isDone: isDone
        };
      });

      setListData(summaryData);
      setCardsData(detailedCards);
      setTotals({ totalCards: cards.length, completedCards: totalCompleted });
      setLoading(false);
    }
    loadData();
  }, []);

  const downloadPDF = () => {
    const element = document.getElementById("pdf-content");
    const opt = {
      margin: 0.3,
      filename: `${boardName}_Numeriq_Report.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { 
        scale: 2, 
        scrollX: 0, 
        scrollY: 0, 
        useCORS: true 
      },
      jsPDF: { unit: "in", format: "a4", orientation: "landscape" }
    };
    window.html2pdf().set(opt).from(element).save();
  };

  if (loading) return <div style={{ padding: "20px", textAlign: "center", color: "#5e6c84", fontSize: "13px" }}>Loading Numeriq Stats...</div>;

  return (
    <div className="dashboard-wrapper" style={{ fontFamily: "sans-serif", fontSize: "12px" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", color: "#172b4d", fontSize: "18px" }}>Numeriq Dashboard</h2>
          <p style={{ margin: "0", fontSize: "12px", color: "#5e6c84" }}>Board: <strong>{boardName}</strong></p>
        </div>
        <button 
          onClick={downloadPDF}
          style={{
            backgroundColor: "#0052cc", color: "white", padding: "6px 12px",
            border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)", whiteSpace: "nowrap", fontSize: "12px"
          }}>
          📥 Download PDF
        </button>
      </div>

      <div id="pdf-content">
        
        {/* STATS */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <div style={{ background: "white", padding: "12px 15px", borderRadius: "6px", flex: 1, boxShadow: "0 1px 2px rgba(0,0,0,0.1)", borderLeft: "4px solid #0052cc" }}>
            <strong style={{ color: "#5e6c84", fontSize: "11px", textTransform: "uppercase" }}>Total Tasks</strong>
            <div style={{ fontSize: "22px", color: "#172b4d", fontWeight: "bold", marginTop: "4px" }}>{totals.totalCards}</div>
          </div>
          <div style={{ background: "white", padding: "12px 15px", borderRadius: "6px", flex: 1, boxShadow: "0 1px 2px rgba(0,0,0,0.1)", borderLeft: "4px solid #006644" }}>
            <strong style={{ color: "#5e6c84", fontSize: "11px", textTransform: "uppercase" }}>Completed Tasks</strong>
            <div style={{ fontSize: "22px", color: "#006644", fontWeight: "bold", marginTop: "4px" }}>{totals.completedCards}</div>
          </div>
        </div>

        {/* LIST SUMMARY TABLE */}
        <h3 style={{ fontSize: "15px", color: "#172b4d", marginBottom: "8px", marginTop: "0" }}>List Summary</h3>
        <div className="table-container" style={{ marginBottom: "15px" }}>
          <table className="numeriq-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #dfe1e6" }}>
                <th style={{ width: "60%", textAlign: "left", padding: "6px 0", color: "#5e6c84" }}>List Name</th>
                <th style={{ width: "20%", textAlign: "center", padding: "6px 0", color: "#5e6c84" }}>Total Cards</th>
                <th style={{ width: "20%", textAlign: "center", padding: "6px 0", color: "#5e6c84" }}>Completed</th>
              </tr>
            </thead>
            <tbody>
              {listData.map(list => (
                <tr key={list.id} style={{ borderBottom: "1px solid #f4f5f7" }}>
                  <td style={{ fontWeight: "600", padding: "6px 0" }}>{list.name}</td>
                  <td style={{ textAlign: "center", padding: "6px 0" }}>{list.totalCards}</td>
                  <td style={{ textAlign: "center", padding: "6px 0", color: list.completed > 0 ? "#006644" : "inherit", fontWeight: list.completed > 0 ? "bold" : "normal" }}>
                    {list.completed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* DETAILED ANALYSIS TABLE */}
        <h3 style={{ fontSize: "15px", color: "#172b4d", marginBottom: "8px", marginTop: "0" }}>Detailed Task Analysis</h3>
        <div className="table-container">
          <table className="numeriq-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #dfe1e6" }}>
                <th style={{ width: "25%", textAlign: "left", padding: "6px 0", color: "#5e6c84" }}>Task</th>
                <th style={{ width: "15%", textAlign: "left", padding: "6px 0", color: "#5e6c84" }}>List</th>
                <th style={{ width: "20%", textAlign: "left", padding: "6px 0", color: "#5e6c84" }}>Members</th>
                <th style={{ width: "20%", textAlign: "left", padding: "6px 0", color: "#5e6c84" }}>Labels</th>
                <th style={{ width: "10%", textAlign: "left", padding: "6px 0", color: "#5e6c84" }}>Due</th>
                <th style={{ width: "10%", textAlign: "center", padding: "6px 0", color: "#5e6c84" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {cardsData.map(card => (
                <tr key={card.id} style={{ backgroundColor: card.isDone ? "#fafffa" : "transparent", borderBottom: "1px solid #f4f5f7" }}>
                  <td style={{ fontWeight: "500", padding: "8px 0" }}>{card.name}</td>
                  <td style={{ padding: "8px 0" }}>{card.listName}</td>
                  <td style={{ padding: "8px 0" }}>
                    {card.members.length > 0 
                      ? card.members.map(m => m.fullName).join(", ") 
                      : <span style={{ color: "#a5adba", fontStyle: "italic" }}>Unassigned</span>}
                  </td>
                  <td style={{ padding: "8px 0" }}>
                    {card.labels.length > 0 ? (
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {card.labels.map(label => (
                          <span key={label.id} style={{ backgroundColor: label.color || "#091e420f", color: label.color ? "#fff" : "#172b4d", padding: "2px 5px", borderRadius: "3px", fontSize: "9px", fontWeight: "bold" }}>
                            {label.name || "Label"}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#a5adba" }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: "8px 0", color: card.due !== "-" ? "#172b4d" : "#a5adba" }}>{card.due}</td>
                  <td style={{ textAlign: "center", padding: "8px 0" }}>
                    {card.isDone ? (
                      <span style={{ backgroundColor: "#e3fcef", color: "#006644", padding: "3px 6px", borderRadius: "10px", fontSize: "10px", fontWeight: "bold" }}>Done</span>
                    ) : (
                      <span style={{ backgroundColor: "#fffae6", color: "#b36200", padding: "3px 6px", borderRadius: "10px", fontSize: "10px", fontWeight: "bold" }}>Pending</span>
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