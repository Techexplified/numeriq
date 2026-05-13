import { useEffect, useState, useMemo } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Search,
  Download,
  User,
  Moon,
  Sun,
  Clock3,
} from "lucide-react";

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
  const [theme, setTheme] = useState("light");

  // Filter States
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMember, setFilterMember] = useState("All");
  const [filterLabel, setFilterLabel] = useState("All");
  const [filterDueType, setFilterDueType] = useState("All");
  const [filterSpecificDate, setFilterSpecificDate] = useState("");

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

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
          listName,
          members: card.members || [],
          labels: card.labels || [],
          due: card.due ? new Date(card.due).toLocaleDateString() : "-",
          rawDue: card.due ? new Date(card.due) : null,
          isDone,
          isOverdue,
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
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "landscape",
      },
    };

    window.html2pdf().set(opt).from(element).save();
  };

  const getLabelName = (label) => {
    if (label.name) return label.name;
    if (label.color) return `Color: ${label.color}`;
    return "Unnamed Label";
  };

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

  const filteredCards = useMemo(() => {
    return cardsData.filter((card) => {
      if (filterStatus !== "All") {
        if (filterStatus === "Done" && !card.isDone) return false;

        if (filterStatus === "Overdue" && (!card.isOverdue || card.isDone))
          return false;

        if (filterStatus === "Pending" && (card.isDone || card.isOverdue))
          return false;
      }

      if (filterMember !== "All") {
        if (filterMember === "Unassigned" && card.members.length > 0)
          return false;

        if (
          filterMember !== "Unassigned" &&
          !card.members.some((m) => m.fullName === filterMember)
        )
          return false;
      }

      if (filterLabel !== "All") {
        if (filterLabel === "No Label" && card.labels.length > 0) return false;

        if (
          filterLabel !== "No Label" &&
          !card.labels.some((l) => getLabelName(l) === filterLabel)
        )
          return false;
      }

      if (filterDueType !== "All") {
        if (filterDueType === "Has Due Date" && card.due === "-") return false;

        if (filterDueType === "No Due Date" && card.due !== "-") return false;

        if (filterDueType === "Specific Date" && filterSpecificDate) {
          if (!card.rawDue) return false;

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
      <div className="sw-loading">
        <div className="sw-spinner" />

        <div className="sw-loading-txt">Loading Summify Stats…</div>
      </div>
    );
  }

  return (
    <div className="sw-wrap">
      {/* HEADER */}
      <header className="sw-header">
        <div className="sw-brand">
          <div className="sw-logo">
            <LayoutDashboard size={18} />
          </div>

          <div>
            <div className="sw-title">Summify Dashboard</div>

            <div className="sw-subtitle">
              Board: <strong>{boardName}</strong>
            </div>
          </div>
        </div>

        <div className="sw-actions">
          {/* Theme Toggle */}
          <button
            className="sw-toggle"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Download PDF */}
          <button className="sw-btn-dl" onClick={downloadPDF}>
            <Download size={14} />
            Download PDF
          </button>
        </div>
      </header>

      <div id="pdf-content">
        {/* STATS */}
        <div className="sw-stats">
          <div className="sw-stat s-blue">
            <div className="sw-stat-icon">
              <ClipboardList size={16} />
            </div>

            <div className="sw-stat-label">Total Tasks</div>

            <div className="sw-stat-value">{totals.totalCards}</div>
          </div>

          <div className="sw-stat s-green">
            <div className="sw-stat-icon">
              <CheckCircle2 size={16} />
            </div>

            <div className="sw-stat-label">Completed</div>

            <div className="sw-stat-value">{totals.completedCards}</div>
          </div>

          <div className="sw-stat s-red">
            <div className="sw-stat-icon">
              <AlertTriangle size={16} />
            </div>

            <div className="sw-stat-label">Running Late</div>

            <div className="sw-stat-value">{totals.overdueCards}</div>
          </div>
        </div>

        {/* LIST SUMMARY */}
        <div className="sw-card">
          <div className="sw-section-title">
            <span className="sw-section-icon">
              <FolderKanban size={13} />
            </span>
            List Summary
          </div>

          <div className="sw-table-wrap">
            <table className="sw-table">
              <colgroup>
                <col style={{ width: "40%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "20%" }} />
              </colgroup>

              <thead>
                <tr>
                  <th>List Name</th>
                  <th className="tc">Total Cards</th>
                  <th className="tc">Completed</th>
                  <th className="tc">Pending</th>
                </tr>
              </thead>

              <tbody>
                {listData.map((list) => (
                  <tr key={list.id}>
                    <td>
                      <span className="sw-task-name">{list.name}</span>
                    </td>

                    <td className="tc">{list.totalCards}</td>

                    <td
                      className={`tc ${
                        list.completed > 0 ? "sw-num-done" : ""
                      }`}
                    >
                      {list.completed}
                    </td>

                    <td
                      className={`tc ${list.pending > 0 ? "sw-num-pend" : ""}`}
                    >
                      {list.pending}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILED TASK ANALYSIS */}
        <div className="sw-card">
          <div className="sw-card-header">
            <div className="sw-section-title" style={{ marginBottom: 0 }}>
              <span className="sw-section-icon">
                <Search size={13} />
              </span>
              Detailed Task Analysis
            </div>

            {/* FILTER BAR */}
            <div className="sw-filters">
              <span className="sw-filter-label">Filters:</span>

              <select
                className="sw-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">Status: All</option>

                <option value="Done">Done</option>

                <option value="Overdue">Overdue</option>

                <option value="Pending">Pending</option>
              </select>

              <select
                className="sw-select"
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
                className="sw-select"
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

              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  alignItems: "center",
                }}
              >
                <select
                  className="sw-select"
                  value={filterDueType}
                  onChange={(e) => setFilterDueType(e.target.value)}
                >
                  <option value="All">Due Date: All</option>

                  <option value="Has Due Date">Has Due Date</option>

                  <option value="No Due Date">No Due Date</option>

                  <option value="Specific Date">Specific Date…</option>
                </select>

                {filterDueType === "Specific Date" && (
                  <input
                    type="date"
                    className="sw-date-input"
                    value={filterSpecificDate}
                    onChange={(e) => setFilterSpecificDate(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="sw-table-wrap" style={{ marginTop: "14px" }}>
            <table className="sw-table">
              <colgroup>
                <col style={{ width: "25%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>

              <thead>
                <tr>
                  <th>Task</th>
                  <th>List</th>
                  <th>Members</th>
                  <th>Labels</th>
                  <th>Due Date</th>
                  <th className="tc">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredCards.length > 0 ? (
                  filteredCards.map((card) => (
                    <tr
                      key={card.id}
                      className={
                        card.isDone ? "r-done" : card.isOverdue ? "r-over" : ""
                      }
                    >
                      <td>
                        <span className="sw-task-name">{card.name}</span>
                      </td>

                      <td>
                        <span className="sw-list-chip">{card.listName}</span>
                      </td>

                      <td>
                        {card.members.length > 0 ? (
                          card.members.map((m) => (
                            <span key={m.id} className="sw-member-chip">
                              <User size={11} />
                              {m.fullName}
                            </span>
                          ))
                        ) : (
                          <span className="sw-muted">Unassigned</span>
                        )}
                      </td>

                      <td>
                        {card.labels.length > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "3px",
                              flexWrap: "wrap",
                            }}
                          >
                            {card.labels.map((label) => (
                              <span
                                key={label.id}
                                className="sw-label-chip"
                                style={{
                                  backgroundColor: label.color || "#e5e7eb",
                                  color: label.color ? "#fff" : "var(--text-1)",
                                }}
                              >
                                {label.name || "Label"}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="sw-due-none">—</span>
                        )}
                      </td>

                      <td>
                        {card.due === "-" ? (
                          <span className="sw-due-none">—</span>
                        ) : (
                          <span
                            className={
                              card.isOverdue ? "sw-due-over" : "sw-due-norm"
                            }
                          >
                            <Clock3
                              size={11}
                              style={{
                                marginRight: "4px",
                                verticalAlign: "middle",
                              }}
                            />

                            {card.due}
                          </span>
                        )}
                      </td>

                      <td className="tc">
                        {card.isDone ? (
                          <span className="sw-badge b-done">
                            <CheckCircle2 size={11} />
                            Done
                          </span>
                        ) : card.isOverdue ? (
                          <span className="sw-badge b-over">
                            <AlertTriangle size={11} />
                            Overdue
                          </span>
                        ) : (
                          <span className="sw-badge b-pend">
                            <Clock3 size={11} />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="sw-empty">
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
