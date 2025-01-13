import React, { useState, useEffect } from "react";

function Chat({ socket, userId, groupId, contacts = [] }) {
  const [message, setMessage] = useState("");
  const [groupMessages, setGroupMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [individualMessages, setIndividualMessages] = useState([]);

  // Fetch group messages initially
  useEffect(() => {
    fetch("http://localhost:3001/group/messages")
      .then((res) => res.json())
      .then((data) => setGroupMessages(data))
      .catch((err) => console.error("Error fetching group messages", err));

    // Listen for group messages in real-time
    socket.on("receive_group_message", (data) => {
      setGroupMessages((prevMessages) => [...prevMessages, data]);
    });

    // Cleanup on unmount
    return () => {
      socket.off("receive_group_message");
    };
  }, [socket]);

  // Listen for individual messages for the selected contact
  useEffect(() => {
    if (selectedContact) {
      fetch(`http://localhost:3001/messages/${userId}/${selectedContact.id}`)
        .then((res) => res.json())
        .then((data) => setIndividualMessages(data))
        .catch((err) => console.error("Error fetching individual messages", err));
    }

    // Listen for individual messages in real-time
    socket.on("receive_message", (data) => {
      if (
        (data.senderId === userId && data.receiverId === selectedContact?.id) ||
        (data.senderId === selectedContact?.id && data.receiverId === userId)
      ) {
        setIndividualMessages((prevMessages) => [...prevMessages, data]);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.off("receive_message");
    };
  }, [socket, selectedContact, userId]);

  // Send group message
  const sendGroupMessage = () => {
    if (message.trim() === "") return;
    socket.emit("send_group_message", { senderId: userId, message });
    setMessage(""); // Clear the input field
  };

  // Send individual message
  const sendIndividualMessage = () => {
    if (message.trim() === "" || !selectedContact) return;
    socket.emit("send_message", {
      senderId: userId,
      receiverId: selectedContact.id,
      message,
    });
    setMessage(""); // Clear the input field
  };

  return (
    <div className="chat-container">
      {/* Group Chat */}
      <div className="group-chat">
        <h3>Group Chat ({groupId})</h3>
        <div className="messages">
          {groupMessages.map((msg, index) => (
            <div key={index} className="message">
              <strong>{msg.senderId === userId ? "You" : msg.senderId}:</strong> {msg.message}
            </div>
          ))}
        </div>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendGroupMessage}>Send to Group</button>
      </div>

      {/* Individual Chat */}
      <div className="individual-chat">
        <h3>Individual Chat</h3>
        <div className="contacts">
          <h4>Contacts</h4>
          <ul>
            {/* Make sure contacts is always an array */}
            {contacts && contacts.length > 0 ? (
              contacts.map((contact) => (
                <li key={contact.id} onClick={() => setSelectedContact(contact)}>
                  {contact.username}
                </li>
              ))
            ) : (
              <p>No contacts available</p>
            )}
          </ul>
        </div>

        {/* Display selected contact's chat */}
        {selectedContact && (
          <div className="chat-window">
            <h4>Chat with {selectedContact.username}</h4>
            <div className="messages">
              {individualMessages.map((msg, index) => (
                <div key={index} className="message">
                  <strong>{msg.senderId === userId ? "You" : msg.senderId}:</strong> {msg.message}
                </div>
              ))}
            </div>

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button onClick={sendIndividualMessage}>Send to {selectedContact.username}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
