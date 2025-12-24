import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const VoiceLink = () => {
  const [isListening, setIsListening] = useState(false);

  const handleEstablishLink = () => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice recognition is not supported in this browser');
      return;
    }

    setIsListening(!isListening);
    
    if (!isListening) {
      toast.info('Voice link initialized. Speak now...');
      // In a real implementation, this would start the speech recognition
      setTimeout(() => {
        setIsListening(false);
        toast.success('Voice captured!');
      }, 3000);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8">
      {/* Pulsing Rings */}
      <div className="relative mb-12">
        <motion.div
          animate={isListening ? { scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 w-48 h-48 rounded-full border border-border"
        />
        <motion.div
          animate={isListening ? { scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          className="absolute inset-4 w-40 h-40 rounded-full border border-border"
        />
        <motion.div
          animate={isListening ? { scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          className="absolute inset-8 w-32 h-32 rounded-full border border-border"
        />
        
        {/* Center Icon */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
            isListening ? 'bg-primary/20' : 'bg-card border border-border'
          }`}>
            <Sparkles className={`w-10 h-10 ${isListening ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="font-serif text-4xl text-foreground italic mb-3">
        Neural Voice Link
      </h1>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Initialize a low-latency neural link to the Kiden Intelligence Hub.
      </p>

      {/* Button */}
      <Button
        onClick={handleEstablishLink}
        size="lg"
        className={`px-12 py-6 text-sm tracking-wider rounded-2xl ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
        }`}
      >
        {isListening ? 'TERMINATE LINK' : 'ESTABLISH LINK'}
      </Button>
    </div>
  );
};

export default VoiceLink;