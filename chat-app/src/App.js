import React from 'react';
import { SocketProvider } from './SocketContext';
import MessageComponent from './MessageComponent';
import "./App.css";
function App() {
  return (
    <SocketProvider>
      <MessageComponent />
    </SocketProvider>
  );
}

export default App;
