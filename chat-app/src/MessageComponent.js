import React, { useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import "./MessageComponent.css";
const MessageComponent = () => {
  const { socket } = useSocket();
  const [senderId, setSenderId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (socket && senderId && receiverId) {
      socket.emit('join_room', { senderId: parseInt(senderId), receiverId: parseInt(receiverId) });

      socket.on('load_messages', (oldMessages) => {
        setMessages(oldMessages);
      });

      socket.on('receive_message', ( oldMessages ) => {
        setMessages(oldMessages);
      });
    }
  }, [socket, senderId, receiverId]);

  const sendMessage = () => {
    if (message.trim() && senderId && receiverId) {
      socket.emit('send_message', {
        senderId: parseInt(senderId),
        receiverId: parseInt(receiverId),
        content: message,
      });
      setMessage('');
    }
  };

  return (
    <div>
      <form>
        <div>
          <label>Gönderen ID:</label>
          <input
            type="number"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
          />
        </div>
        <div>
          <label>Alıcı ID:</label>
          <input
            type="number"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
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
