import { useEffect, useState } from "react";
import "./App.css";

/* global TrelloPowerUp */

function App() {
  const [boardName, setBoardName] = useState("");
  const [totals, setTotals] = useState({ totalCards: 0, completedCards: 0, overdueCards: 0 });
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
      let totalOverdue = 0;
      const listMap = {};
      const now = new Date();

      const summaryData = lists.map(list => {
        listMap[list.id] = list.name;
        const cardsInList = cards.filter(card => card.idList === list.id);
        const completedInList = cardsInList.filter(card => 
          card.dueComplete || list.name.toLowerCase() === "done"
        ).length;
        
        const pendingInList = cardsInList.length - completedInList;
        totalCompleted += completedInList;

        return { 
          id: list.id, 
          name: list.name, 
          totalCards: cardsInList.length, 
          completed: completedInList,
          pending: pendingInList // Added pending calculation
        };
      });

      const detailedCards = cards.map(card => {
        const listName = listMap[card.idList] || "Unknown List";
        const isDone = card.dueComplete || listName.toLowerCase() === "done";
        
        let isOverdue = false;
        if (!isDone && card.due && new Date(card.due) < now) {
          isOverdue = true;
          totalOverdue += 1;
        }

        return {
          id: card.id, 
          name: card.name, 
          listName: listName, 
          members: card.members || [],
          labels: card.labels || [], 
          due: card.due ? new Date(card.due).toLocaleDateString() : "-", 
          isDone: isDone,
          isOverdue: isOverdue
        };
      });

      setListData(summaryData);
      setCardsData(detailedCards);
      setTotals({ 
        totalCards: cards.length, 
        completedCards: totalCompleted, 
        overdueCards: totalOverdue 
      });
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

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#5e6c84", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: "16px", fontWeight: "500" }}>Loading Numeriq Stats...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper" style={{ fontFamily: "'-apple-system', BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", fontSize: "13px", color: "#172b4d", padding: "20px", backgroundColor: "#f4f5f7", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px", backgroundColor: "#fff", padding: "15px 20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div>
          <h2 style={{ margin: "0 0 6px 0", color: "#172b4d", fontSize: "20px", fontWeight: "600" }}>Numeriq Dashboard</h2>
          <p style={{ margin: "0", fontSize: "13px", color: "#5e6c84" }}>Board: <strong style={{ color: "#172b4d" }}>{boardName}</strong></p>
        </div>
        <button 
          onClick={downloadPDF}
          style={{
            backgroundColor: "#0052cc", color: "white", padding: "8px 16px",
            border: "none", borderRadius: "4px", fontWeight: "600", cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,82,204,0.2)", whiteSpace: "nowrap", fontSize: "13px", transition: "background-color 0.2s"
          }}>
          📥 Download PDF
        </button>
      </div>

      <div id="pdf-content" style={{ backgroundColor: "#f4f5f7", paddingBottom: "20px" }}>
        
        {/* STATS WIDGETS */}
        <div style={{ display: "flex", gap: "15px", marginBottom: "25px", flexWrap: "wrap" }}>
          <div style={{ background: "white", padding: "16px 20px", borderRadius: "8px", flex: "1 1 200px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderTop: "4px solid #0052cc" }}>
            <div style={{ color: "#5e6c84", fontSize: "12px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>Total Tasks</div>
            <div style={{ fontSize: "28px", color: "#172b4d", fontWeight: "700", marginTop: "8px" }}>{totals.totalCards}</div>
          </div>
          <div style={{ background: "white", padding: "16px 20px", borderRadius: "8px", flex: "1 1 200px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderTop: "4px solid #006644" }}>
            <div style={{ color: "#5e6c84", fontSize: "12px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>Completed</div>
            <div style={{ fontSize: "28px", color: "#006644", fontWeight: "700", marginTop: "8px" }}>{totals.completedCards}</div>
          </div>
          <div style={{ background: "white", padding: "16px 20px", borderRadius: "8px", flex: "1 1 200px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderTop: "4px solid #bf2600" }}>
            <div style={{ color: "#5e6c84", fontSize: "12px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>Running Late</div>
            <div style={{ fontSize: "28px", color: "#bf2600", fontWeight: "700", marginTop: "8px" }}>{totals.overdueCards}</div>
          </div>
        </div>

        {/* LIST SUMMARY TABLE */}
        <div style={{ background: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "25px" }}>
          <h3 style={{ fontSize: "16px", color: "#172b4d", marginBottom: "16px", marginTop: "0", fontWeight: "600" }}>List Summary</h3>
          <div className="table-container" style={{ overflowX: "auto" }}>
            <table className="numeriq-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #dfe1e6" }}>
                  <th style={{ width: "40%", textAlign: "left", padding: "10px 12px", color: "#5e6c84", fontWeight: "600" }}>List Name</th>
                  <th style={{ width: "20%", textAlign: "center", padding: "10px 12px", color: "#5e6c84", fontWeight: "600" }}>Total Cards</th>
                  <th style={{ width: "20%", textAlign: "center", padding: "10px 12px", color: "#5e6c84", fontWeight: "600" }}>Completed</th>
                  <th style={{ width: "20%", textAlign: "center", padding: "10px 12px", color: "#5e6c84", fontWeight: "600" }}>Pending</th>
                </tr>
              </thead>
              <tbody>
                {listData.map(list => (
                  <tr key={list.id} style={{ borderBottom: "1px solid #dfe1e6" }}>
                    <td style={{ fontWeight: "500", padding: "12px" }}>{list.name}</td>
                    <td style={{ textAlign: "center", padding: "12px" }}>{list.totalCards}</td>
                    <td style={{ textAlign: "center", padding: "12px", color: list.completed > 0 ? "#006644" : "inherit", fontWeight: list.completed > 0 ? "600" : "normal" }}>
                      {list.completed}
                    </td>
                    <td style={{ textAlign: "center", padding: "12px", color: list.pending > 0 ? "#ff991f" : "inherit", fontWeight: list.pending > 0 ? "600" : "normal" }}>
                      {list.pending}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILED ANALYSIS TABLE */}
        <div style={{ background: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 style={{ fontSize: "16px", color: "#172b4d", marginBottom: "16px", marginTop: "0", fontWeight: "600" }}>Detailed Task Analysis</h3>
          <div className="table-container" style={{ overflowX: "auto" }}>
            <table className="numeriq-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #dfe1e6" }}>
                  <th style={{ width: "25%", textAlign: "left", padding: "10px 12px", color: "#5e6c84", fontWeight: "600" }}>Task</th>
                  <th style={{ width: "15%", textAlign: "left", padding: "10px 12px", color: "#5e6c84", fontWeight: "600" }}>List</th>
                  <th style={{ width: "20%", textAlign: "left", padding: "10px 12px", color: "#5e6c84", fontWeight: "600" }}>Members</th>
                  <th style={{ width: "15%", textAlign: "left", padding: "10px 12px", color: "#5e6c84", fontWeight: "600" }}>Labels</th>
                  <th style={{ width: "10%", textAlign: "left", padding: "10px 12px", color: "#5e6c84", fontWeight: "600" }}>Due Date</th>
                  <th style={{ width: "15%", textAlign: "center", padding: "10px 12px", color: "#5e6c84", fontWeight: "600" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {cardsData.map(card => (
                  <tr key={card.id} style={{ backgroundColor: card.isDone ? "#fafffa" : card.isOverdue ? "#fff5f5" : "transparent", borderBottom: "1px solid #dfe1e6" }}>
                    <td style={{ fontWeight: "500", padding: "12px" }}>{card.name}</td>
                    <td style={{ padding: "12px" }}>{card.listName}</td>
                    <td style={{ padding: "12px" }}>
                      {card.members.length > 0 
                        ? card.members.map(m => m.fullName).join(", ") 
                        : <span style={{ color: "#a5adba", fontStyle: "italic" }}>Unassigned</span>}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {card.labels.length > 0 ? (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {card.labels.map(label => (
                            <span key={label.id} style={{ backgroundColor: label.color || "#ebecf0", color: label.color ? "#fff" : "#172b4d", padding: "2px 6px", borderRadius: "3px", fontSize: "11px", fontWeight: "600" }}>
                              {label.name || "Label"}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "#a5adba" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "12px", color: card.isOverdue ? "#bf2600" : (card.due !== "-" ? "#172b4d" : "#a5adba"), fontWeight: card.isOverdue ? "600" : "normal" }}>
                      {card.due}
                    </td>
                    <td style={{ textAlign: "center", padding: "12px" }}>
                      {card.isDone ? (
                        <span style={{ backgroundColor: "#e3fcef", color: "#006644", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", display: "inline-block" }}>DONE</span>
                      ) : card.isOverdue ? (
                        <span style={{ backgroundColor: "#ffebe6", color: "#bf2600", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", display: "inline-block" }}>OVERDUE</span>
                      ) : (
                        <span style={{ backgroundColor: "#fffae6", color: "#b36200", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", display: "inline-block" }}>PENDING</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default App;