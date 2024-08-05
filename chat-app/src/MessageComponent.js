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
      socket.emit('join_room', { senderName: senderName, receiverName: receiverName });

      socket.on('load_messages', (oldMessages) => {
        setMessages(oldMessages);
      });

      socket.on('receive_message', ( oldMessages ) => {
        setMessages(oldMessages);
      });
    }
  }, [socket, senderName, receiverName]);

  const sendMessage = () => {
    if (message.trim() && senderName && receiverName) {
      socket.emit('send_message', {
        senderName: senderName,
        receiverName: receiverName,
        content: message,
      });
      setMessage('');
    }
  };

  return (
    <div>
      <form>
        <div>
          <label>Gönderen Name:</label>
          <input
            type="string"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
        </div>
        <div>
          <label>Alıcı Name:</label>
          <input
            type="string"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
          />
        </div>
      </form>
      <div>
        <div>
          
          {messages.map((msg) => (
            <div key={msg.id}>
              <strong>{msg.sender.user.username}</strong>: {msg.content}
            </div>
          ))}
        </div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Gönder</button>
      </div>
    </div>
  );
};

export default MessageComponent;
