import React, { useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import "./MessageComponent.css";

const MessageComponent = () => {
  const { socket } = useSocket();
  const [senderName, setSenderName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (socket && senderName && receiverName) {
      socket.emit('join_room', { senderName, receiverName });

      socket.on('load_messages', (oldMessages) => {
        setMessages(oldMessages);
      });

      socket.on('receive_message', (oldMessages) => {
        setMessages(oldMessages);
      });
    }
  }, [socket, senderName, receiverName]);

  const sendMessage = (e) => {
    e.preventDefault()
    if (message.trim() && senderName && receiverName) {
      socket.emit('send_message', {
        senderName,
        receiverName,
        content: message,
      });
      setMessage('');
    }
  };

  return (
    <div className="app-container">
      <form className="form-container">
        <div className="form-group">
          <label>Gönderen Adı:</label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Alıcı Adı:</label>
          <input
            type="text"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
          />
        </div>
      </form>
      <div className="message-section">
        <div className="message-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender.user.username === senderName ? 'sent' : 'received'}`}>
              <strong>{msg.sender.user.username}</strong>: {msg.content}
            </div>
          ))}
        </div>
        <div className="input-container">
          <form onSubmit={sendMessage}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mesajınızı buraya yazın..."
          />
          <button>Gönder</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessageComponent;
