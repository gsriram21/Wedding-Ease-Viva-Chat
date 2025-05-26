
import React from 'react';
import { MessageSquare, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  onStartChat: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartChat }) => {
  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-2xl mx-auto">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full float-animation" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary/40 rounded-full float-animation" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-primary/20 rounded-full float-animation" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-primary/35 rounded-full float-animation" style={{ animationDelay: '3s' }}></div>
        </div>

        {/* Main content */}
        <div className="relative z-10">
          {/* AI Icon with glow effect */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-white/80 backdrop-blur-sm rounded-3xl flex items-center justify-center pulse-glow shadow-2xl">
                <MessageSquare className="w-12 h-12 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          {/* Welcome text */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4 tracking-tight">
            Wedding Ease
            <span className="block text-4xl md:text-5xl text-primary mt-2">
              AI Assistant
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Your personal wedding planning companion. From venue selection to 
            <br />
            perfect details - let's make your dream wedding a reality.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <Heart className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Personalized Planning</h3>
              <p className="text-sm text-gray-600">Tailored advice for your unique style and budget</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Expert Guidance</h3>
              <p className="text-sm text-gray-600">Professional tips from wedding industry experts</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <MessageSquare className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">24/7 Support</h3>
              <p className="text-sm text-gray-600">Get instant answers anytime you need them</p>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onStartChat}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
          >
            Start Planning Your Dream Wedding
            <MessageSquare className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          </Button>

          <p className="text-sm text-gray-500 mt-4">
            Free consultation • No commitment required
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
