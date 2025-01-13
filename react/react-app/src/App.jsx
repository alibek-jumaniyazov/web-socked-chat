import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import Chat from "./Chat";

const socket = io.connect("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [message, setMessage] = useState("");
  const [showChat, setShowChat] = useState(false);

  // Function to handle login
  const login = () => {
    if (username !== "") {
      fetch("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.userId) {
            setUserId(data.userId);
            socket.emit("login", data.userId); // Emit login event for socket
            fetchContacts(data.userId);
            setShowChat(true);
          } else {
            alert(data.message);
          }
        })
        .catch((err) => console.error("Error logging in:", err));
    }
  };

  // Fetch user contacts
  const fetchContacts = (userId) => {
    fetch(`http://localhost:3001/contacts/${userId}`)
      .then((res) => res.json())
      .then((data) => setContacts(data))
      .catch((err) => console.error("Error fetching contacts:", err));
  };

  return (
    <div className="App">
      {!showChat ? (
        <div className="joinChatContainer">
          <h3>Join A Chat</h3>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <button onClick={login}>Login</button>
        </div>
      ) : (
        <Chat
          socket={socket}
          userId={userId}
          groupId="group-1" // Example group ID
          contacts={contacts} // Passing contacts array to Chat component
        />
      )}
    </div>
  );
}

export default App;
