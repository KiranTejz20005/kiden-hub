import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Sparkles, MicOff, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const VoiceLink = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

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
        setTranscript('Your captured voice note will appear here...');
        toast.success('Voice captured!');
      }, 3000);
    } else {
      setIsListening(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8 pt-16 lg:pt-8"
    >
      {/* Pulsing Rings */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8 md:mb-12"
      >
        {/* Outer rings */}
        <motion.div
          animate={isListening ? { scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] } : { scale: 1, opacity: 0.1 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 w-40 h-40 md:w-48 md:h-48 rounded-full border-2 border-primary/30"
        />
        <motion.div
          animate={isListening ? { scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] } : { scale: 1, opacity: 0.15 }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          className="absolute inset-4 w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-primary/30"
        />
        <motion.div
          animate={isListening ? { scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] } : { scale: 1, opacity: 0.2 }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          className="absolute inset-8 w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-primary/30"
        />
        
        {/* Center Icon */}
        <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center">
          <motion.div 
            animate={isListening ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening 
                ? 'bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/40' 
                : 'bg-card border-2 border-border'
            }`}
          >
            {isListening ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Waves className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
              </motion.div>
            ) : (
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
            )}
          </motion.div>
        </div>
        
        {/* Glow effect when listening */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 bg-primary/20 rounded-full blur-3xl -z-10"
          />
        )}
      </motion.div>

      {/* Title */}
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-serif text-3xl md:text-4xl text-foreground italic mb-3 text-center"
      >
        Neural Voice Link
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground mb-6 md:mb-8 text-center max-w-md px-4"
      >
        Initialize a low-latency neural link to the Kiden Intelligence Hub.
      </motion.p>

      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 mb-6 md:mb-8"
      >
        <motion.div 
          animate={isListening ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          className={`w-2 h-2 rounded-full ${isListening ? 'bg-primary' : 'bg-muted-foreground'}`} 
        />
        <span className="text-sm text-muted-foreground uppercase tracking-wider">
          {isListening ? 'Listening...' : 'Ready'}
        </span>
      </motion.div>

      {/* Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={handleEstablishLink}
          size="lg"
          className={`px-8 md:px-12 py-5 md:py-6 text-sm tracking-wider rounded-2xl gap-2 ${
            isListening
              ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              : 'bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              TERMINATE LINK
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              ESTABLISH LINK
            </>
          )}
        </Button>
      </motion.div>

      {/* Transcript display */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-4 md:p-6 bg-card border border-border rounded-2xl max-w-md w-full mx-4"
        >
          <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Captured</p>
          <p className="text-foreground">{transcript}</p>
        </motion.div>
      )}

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
      >
        <p className="text-xs text-muted-foreground/60">
          Pro tip: Voice notes are automatically transcribed and searchable
        </p>
      </motion.div>
    </motion.div>
  );
};

export default VoiceLink;