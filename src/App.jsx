import { useEffect, useState, useMemo } from "react";
import "./App.css";

/* global TrelloPowerUp */

function App() {
  const [boardName, setBoardName] = useState("");
  const [totals, setTotals] = useState({
    totalCards: 0,
    completedCards: 0,
    overdueCards: 0,
  });
  const [listData, setListData] = useState([]);
  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMember, setFilterMember] = useState("All");
  const [filterLabel, setFilterLabel] = useState("All");
  const [filterDueType, setFilterDueType] = useState("All"); // All, Has Due Date, No Due Date, Specific Date
  const [filterSpecificDate, setFilterSpecificDate] = useState(""); // Format: YYYY-MM-DD

  useEffect(() => {
    const t = window.TrelloPowerUp.iframe();

    async function loadData() {
      const [board, lists, cards] = await Promise.all([
        t.board("name"),
        t.lists("id", "name"),
        t.cards(
          "id",
          "name",
          "idList",
          "members",
          "labels",
          "due",
          "dueComplete",
        ),
      ]);

      setBoardName(board.name);
      let totalCompleted = 0;
      let totalOverdue = 0;
      const listMap = {};
      const now = new Date();

      const summaryData = lists.map((list) => {
        listMap[list.id] = list.name;
        const cardsInList = cards.filter((card) => card.idList === list.id);
        const completedInList = cardsInList.filter(
          (card) => card.dueComplete || list.name.toLowerCase() === "done",
        ).length;

        const pendingInList = cardsInList.length - completedInList;
        totalCompleted += completedInList;

        return {
          id: list.id,
          name: list.name,
          totalCards: cardsInList.length,
          completed: completedInList,
          pending: pendingInList,
        };
      });

      const detailedCards = cards.map((card) => {
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
          rawDue: card.due ? new Date(card.due) : null, // Added for exact date filtering
          isDone: isDone,
          isOverdue: isOverdue,
        };
      });

      setListData(summaryData);
      setCardsData(detailedCards);
      setTotals({
        totalCards: cards.length,
        completedCards: totalCompleted,
        overdueCards: totalOverdue,
      });
      setLoading(false);
    }
    loadData();
  }, []);

  const downloadPDF = () => {
    const element = document.getElementById("pdf-content");
    const opt = {
      margin: 0.3,
      filename: `${boardName}_Summify_Report.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 2,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
      },
      jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
    };
    window.html2pdf().set(opt).from(element).save();
  };

  // Helper function to get a reliable label name (Trello labels sometimes only have colors)
  const getLabelName = (label) => {
    if (label.name) return label.name;
    if (label.color) return `Color: ${label.color}`;
    return "Unnamed Label";
  };

  // Extract unique options for dropdowns
  const uniqueMembers = useMemo(() => {
    const members = new Set(
      cardsData.flatMap((card) => card.members.map((m) => m.fullName)),
    );
    return Array.from(members).sort();
  }, [cardsData]);

  const uniqueLabels = useMemo(() => {
    const labels = new Set(
      cardsData.flatMap((card) => card.labels.map((l) => getLabelName(l))),
    );
    return Array.from(labels).sort();
  }, [cardsData]);

  // Apply Filters to Detailed Cards
  const filteredCards = useMemo(() => {
    return cardsData.filter((card) => {
      // 1. Status Filter
      if (filterStatus !== "All") {
        if (filterStatus === "Done" && !card.isDone) return false;
        if (filterStatus === "Overdue" && (!card.isOverdue || card.isDone))
          return false;
        if (filterStatus === "Pending" && (card.isDone || card.isOverdue))
          return false;
      }

      // 2. Member Filter
      if (filterMember !== "All") {
        if (filterMember === "Unassigned" && card.members.length > 0)
          return false;
        if (
          filterMember !== "Unassigned" &&
          !card.members.some((m) => m.fullName === filterMember)
        )
          return false;
      }

      // 3. Label Filter
      if (filterLabel !== "All") {
        if (filterLabel === "No Label" && card.labels.length > 0) return false;
        if (
          filterLabel !== "No Label" &&
          !card.labels.some((l) => getLabelName(l) === filterLabel)
        )
          return false;
      }

      // 4. Due Date Filter
      if (filterDueType !== "All") {
        if (filterDueType === "Has Due Date" && card.due === "-") return false;
        if (filterDueType === "No Due Date" && card.due !== "-") return false;
        if (filterDueType === "Specific Date" && filterSpecificDate) {
          if (!card.rawDue) return false;

          // Compare year, month, and day safely
          const [year, month, day] = filterSpecificDate.split("-");
          if (
            card.rawDue.getFullYear() !== parseInt(year) ||
            card.rawDue.getMonth() + 1 !== parseInt(month) ||
            card.rawDue.getDate() !== parseInt(day)
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    cardsData,
    filterStatus,
    filterMember,
    filterLabel,
    filterDueType,
    filterSpecificDate,
  ]);

  if (loading) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#5e6c84",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: "500" }}>
          Loading Summify Stats...
        </div>
      </div>
    );
  }

  // Helper styles for dropdowns
  const selectStyle = {
    padding: "4px 8px",
    fontSize: "11px",
    borderRadius: "4px",
    border: "1px solid #dfe1e6",
    backgroundColor: "#fafbfc",
    color: "#172b4d",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div
      className="dashboard-wrapper"
      style={{
        fontFamily:
          "'-apple-system', BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        fontSize: "12px",
        color: "#172b4d",
        padding: "10px",
        backgroundColor: "#f4f5f7",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          flexWrap: "wrap",
          gap: "10px",
          backgroundColor: "#fff",
          padding: "10px 15px",
          borderRadius: "6px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        }}
      >
        <div>
          <h2
            style={{
              margin: "0 0 2px 0",
              color: "#172b4d",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            Summify Dashboard
          </h2>
          <p style={{ margin: "0", fontSize: "11px", color: "#5e6c84" }}>
            Board: <strong style={{ color: "#172b4d" }}>{boardName}</strong>
          </p>
        </div>
        <button
          onClick={downloadPDF}
          style={{
            backgroundColor: "#0052cc",
            color: "white",
            padding: "6px 12px",
            border: "none",
            borderRadius: "4px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,82,204,0.2)",
            whiteSpace: "nowrap",
            fontSize: "11px",
            transition: "background-color 0.2s",
          }}
        >
          📥 Download PDF
        </button>
      </div>

      <div
        id="pdf-content"
        style={{ backgroundColor: "#f4f5f7", paddingBottom: "10px" }}
      >
        {/* STATS WIDGETS */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "15px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "10px 15px",
              borderRadius: "6px",
              flex: "1 1 120px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              borderTop: "3px solid #0052cc",
            }}
          >
            <div
              style={{
                color: "#5e6c84",
                fontSize: "10px",
                textTransform: "uppercase",
                fontWeight: "600",
                letterSpacing: "0.5px",
              }}
            >
              Total Tasks
            </div>
            <div
              style={{
                fontSize: "20px",
                color: "#172b4d",
                fontWeight: "700",
                marginTop: "4px",
              }}
            >
              {totals.totalCards}
            </div>
          </div>
          <div
            style={{
              background: "white",
              padding: "10px 15px",
              borderRadius: "6px",
              flex: "1 1 120px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              borderTop: "3px solid #006644",
            }}
          >
            <div
              style={{
                color: "#5e6c84",
                fontSize: "10px",
                textTransform: "uppercase",
                fontWeight: "600",
                letterSpacing: "0.5px",
              }}
            >
              Completed
            </div>
            <div
              style={{
                fontSize: "20px",
                color: "#006644",
                fontWeight: "700",
                marginTop: "4px",
              }}
            >
              {totals.completedCards}
            </div>
          </div>
          <div
            style={{
              background: "white",
              padding: "10px 15px",
              borderRadius: "6px",
              flex: "1 1 120px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              borderTop: "3px solid #bf2600",
            }}
          >
            <div
              style={{
                color: "#5e6c84",
                fontSize: "10px",
                textTransform: "uppercase",
                fontWeight: "600",
                letterSpacing: "0.5px",
              }}
            >
              Running Late
            </div>
            <div
              style={{
                fontSize: "20px",
                color: "#bf2600",
                fontWeight: "700",
                marginTop: "4px",
              }}
            >
              {totals.overdueCards}
            </div>
          </div>
        </div>

        {/* LIST SUMMARY TABLE */}
        <div
          style={{
            background: "white",
            borderRadius: "6px",
            padding: "12px 15px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            marginBottom: "15px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              color: "#172b4d",
              marginBottom: "10px",
              marginTop: "0",
              fontWeight: "600",
            }}
          >
            List Summary
          </h3>
          <div className="table-container" style={{ overflowX: "auto" }}>
            <table
              className="numeriq-table"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #dfe1e6" }}>
                  <th
                    style={{
                      width: "40%",
                      textAlign: "left",
                      padding: "6px 8px",
                      color: "#5e6c84",
                      fontWeight: "600",
                    }}
                  >
                    List Name
                  </th>
                  <th
                    style={{
                      width: "20%",
                      textAlign: "center",
                      padding: "6px 8px",
                      color: "#5e6c84",
                      fontWeight: "600",
                    }}
                  >
                    Total Cards
                  </th>
                  <th
                    style={{
                      width: "20%",
                      textAlign: "center",
                      padding: "6px 8px",
                      color: "#5e6c84",
                      fontWeight: "600",
                    }}
                  >
                    Completed
                  </th>
                  <th
                    style={{
                      width: "20%",
                      textAlign: "center",
                      padding: "6px 8px",
                      color: "#5e6c84",
                      fontWeight: "600",
                    }}
                  >
                    Pending
                  </th>
                </tr>
              </thead>
              <tbody>
                {listData.map((list) => (
                  <tr
                    key={list.id}
                    style={{ borderBottom: "1px solid #dfe1e6" }}
                  >
                    <td style={{ fontWeight: "500", padding: "6px 8px" }}>
                      {list.name}
                    </td>
                    <td style={{ textAlign: "center", padding: "6px 8px" }}>
                      {list.totalCards}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "6px 8px",
                        color: list.completed > 0 ? "#006644" : "inherit",
                        fontWeight: list.completed > 0 ? "600" : "normal",
                      }}
                    >
                      {list.completed}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "6px 8px",
                        color: list.pending > 0 ? "#ff991f" : "inherit",
                        fontWeight: list.pending > 0 ? "600" : "normal",
                      }}
                    >
                      {list.pending}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILED ANALYSIS TABLE WITH FILTERS */}
        <div
          style={{
            background: "white",
            borderRadius: "6px",
            padding: "12px 15px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                color: "#172b4d",
                margin: "0",
                fontWeight: "600",
              }}
            >
              Detailed Task Analysis
            </h3>

            {/* FILTER BAR */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "#5e6c84",
                  fontWeight: "600",
                }}
              >
                Filters:
              </span>

              <select
                style={selectStyle}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">Status: All</option>
                <option value="Done">Done</option>
                <option value="Overdue">Overdue</option>
                <option value="Pending">Pending</option>
              </select>

              <select
                style={selectStyle}
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
              >
                <option value="All">Member: All</option>
                <option value="Unassigned">Unassigned</option>
                {uniqueMembers.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                style={selectStyle}
                value={filterLabel}
                onChange={(e) => setFilterLabel(e.target.value)}
              >
                <option value="All">Label: All</option>
                <option value="No Label">No Label</option>
                {uniqueLabels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: "4px" }}>
                <select
                  style={selectStyle}
                  value={filterDueType}
                  onChange={(e) => setFilterDueType(e.target.value)}
                >
                  <option value="All">Due Date: All</option>
                  <option value="Has Due Date">Has Due Date</option>
                  <option value="No Due Date">No Due Date</option>
                  <option value="Specific Date">Specific Date...</option>
                </select>

                {filterDueType === "Specific Date" && (
                  <input
                    type="date"
                    style={selectStyle}
                    value={filterSpecificDate}
                    onChange={(e) => setFilterSpecificDate(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="table-container" style={{ overflowX: "auto" }}>
            <table
              className="numeriq-table"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #dfe1e6" }}>
                  <th
                    style={{
                      width: "25%",
                      textAlign: "left",
                      padding: "6px 8px",
                      color: "#5e6c84",
                      fontWeight: "600",
                    }}
                  >
                    Task
                  </th>
                  <th
                    style={{
                      width: "15%",
                      textAlign: "left",
                      padding: "6px 8px",
                      color: "#5e6c84",
                      fontWeight: "600",
                    }}
                  >
                    List
                  </th>
                  <th
                    style={{
                      width: "20%",
                      textAlign: "left",
                      padding: "6px 8px",
                      color: "#5e6c84",
                      fontWeight: "600",
                    }}
                  >
                    Members
                  </th>
                  <th
                    style={{
                      width: "15%",
                      textAlign: "left",
                      padding: "6px 8px",
                      color: "#5e6c84",
                      fontWeight: "600",
                    }}
                  >
                    Labels
                  </th>
                  <th
                    style={{
                      width: "10%",
                      textAlign: "left",
                      padding: "6px 8px",
                      color: "#5e6c84",
                      fontWeight: "600",
                    }}
                  >
                    Due Date
                  </th>
                  <th
                    style={{
                      width: "15%",
                      textAlign: "center",
                      padding: "6px 8px",
                      color: "#5e6c84",
                      fontWeight: "600",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.length > 0 ? (
                  filteredCards.map((card) => (
                    <tr
                      key={card.id}
                      style={{
                        backgroundColor: card.isDone
                          ? "#fafffa"
                          : card.isOverdue
                            ? "#fff5f5"
                            : "transparent",
                        borderBottom: "1px solid #dfe1e6",
                      }}
                    >
                      <td style={{ fontWeight: "500", padding: "6px 8px" }}>
                        {card.name}
                      </td>
                      <td style={{ padding: "6px 8px" }}>{card.listName}</td>
                      <td style={{ padding: "6px 8px" }}>
                        {card.members.length > 0 ? (
                          card.members.map((m) => m.fullName).join(", ")
                        ) : (
                          <span
                            style={{ color: "#a5adba", fontStyle: "italic" }}
                          >
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        {card.labels.length > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "4px",
                              flexWrap: "wrap",
                            }}
                          >
                            {card.labels.map((label) => (
                              <span
                                key={label.id}
                                style={{
                                  backgroundColor: label.color || "#ebecf0",
                                  color: label.color ? "#fff" : "#172b4d",
                                  padding: "1px 4px",
                                  borderRadius: "3px",
                                  fontSize: "10px",
                                  fontWeight: "600",
                                }}
                              >
                                {label.name || "Label"}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#a5adba" }}>-</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          color: card.isOverdue
                            ? "#bf2600"
                            : card.due !== "-"
                              ? "#172b4d"
                              : "#a5adba",
                          fontWeight: card.isOverdue ? "600" : "normal",
                        }}
                      >
                        {card.due}
                      </td>
                      <td style={{ textAlign: "center", padding: "6px 8px" }}>
                        {card.isDone ? (
                          <span
                            style={{
                              backgroundColor: "#e3fcef",
                              color: "#006644",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              fontSize: "10px",
                              fontWeight: "700",
                              display: "inline-block",
                            }}
                          >
                            DONE
                          </span>
                        ) : card.isOverdue ? (
                          <span
                            style={{
                              backgroundColor: "#ffebe6",
                              color: "#bf2600",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              fontSize: "10px",
                              fontWeight: "700",
                              display: "inline-block",
                            }}
                          >
                            OVERDUE
                          </span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: "#fffae6",
                              color: "#b36200",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              fontSize: "10px",
                              fontWeight: "700",
                              display: "inline-block",
                            }}
                          >
                            PENDING
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        color: "#5e6c84",
                      }}
                    >
                      No tasks match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
