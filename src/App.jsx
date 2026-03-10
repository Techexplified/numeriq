import { useEffect, useState } from "react";
import "./App.css";

/* global TrelloPowerUp */

function App() {
  const [boardName, setBoardName] = useState("");
  const [cards, setCards] = useState([]);
  const [members, setMembers] = useState({});
  
  // NEW: State to track if badges are on or off
  const [showBadges, setShowBadges] = useState(true); 

  useEffect(() => {
    const t = window.TrelloPowerUp.iframe();

    async function loadData() {
      const board = await t.board("name");
      setBoardName(board.name);

      const data = await t.board("cards", "members");
      setCards(data.cards);

      const counts = {};
      data.cards.forEach(card => {
        card.idMembers.forEach(member => {
          counts[member] = (counts[member] || 0) + 1;
        });
      });
      setMembers(counts);

      // NEW: Ask Trello if the user previously turned badges off. 
      // It defaults to 'true' if they haven't clicked anything yet.
      const savedPreference = await t.get('board', 'shared', 'showBadges', true);
      setShowBadges(savedPreference);
    }

    loadData();
  }, []);

  // NEW: Function to handle the button click
  const toggleBadges = async () => {
    const t = window.TrelloPowerUp.iframe();
    const newValue = !showBadges;
    setShowBadges(newValue); // Update the React UI instantly
    
    // Save the new setting to Trello's shared board memory
    await t.set('board', 'shared', 'showBadges', newValue);
  };

  return (
    <div style={{padding:"20px", fontFamily:"sans-serif"}}>

      <h2>Numeriq Power-Up</h2>
      
      {/* NEW: The Toggle Button */}
      <button 
        onClick={toggleBadges} 
        style={{
          width: "100%", 
          padding: "10px", 
          marginBottom: "15px", 
          backgroundColor: showBadges ? "#ff4d4f" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        {showBadges ? "Turn Numbers OFF" : "Turn Numbers ON"}
      </button>

      <p>
        Board: <b>{boardName}</b>
      </p>

      <hr />

      <h3>Total Tasks</h3>
      <p>{cards.length}</p>

      <hr />

      <h3>Tasks per Member</h3>

      {Object.keys(members).length === 0 && (
        <p>No assignments yet</p>
      )}

      {Object.entries(members).map(([member, count]) => (
        <div key={member}>
          {member} : {count}
        </div>
      ))}

      <hr />

      <p style={{fontSize:"12px", opacity:0.6}}>
        Numeriq Task Analytics
      </p>

    </div>
  );
}

export default App;