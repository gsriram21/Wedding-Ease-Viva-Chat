
import React, { useState } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import ChatInterface from '@/components/ChatInterface';

const Index = () => {
  const [showChat, setShowChat] = useState(false);

  const handleStartChat = () => {
    setShowChat(true);
  };

  const handleBackToWelcome = () => {
    setShowChat(false);
  };

  return (
    <div className="min-h-screen">
      {showChat ? (
        <ChatInterface onBack={handleBackToWelcome} />
      ) : (
        <WelcomeScreen onStartChat={handleStartChat} />
      )}
    </div>
  );
};

export default Index;
