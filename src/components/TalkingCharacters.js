import React, { useState, useEffect, useRef } from 'react';
import { Button, InputGroup, Form } from 'react-bootstrap'; // Import necessary components
import { Mic, Square } from 'lucide-react';

const characters = [
  { 
    id: 'yoda', 
    name: 'Yoda', 
    gif: 'https://i.gifer.com/7JEK.gif', 
    voiceIndex: 0, 
    quote: "Do. Or do not. There is no try." 
  },
  { 
    id: 'lofty', 
    name: 'Lofty', 
    gif: 'https://i.gifer.com/XOsX.gif', 
    voiceIndex: 1, 
    quote: "Can we fix it? Yes, we can!" 
  },
  { 
    id: 'panda', 
    name: 'Kung Fu Panda', 
    gif: 'https://i.gifer.com/7Z7N.gif', 
    voiceIndex: 2, 
    quote: "Skadoosh!" 
  },
  { 
    id: 'elsa', 
    name: 'Elsa', 
    gif: 'https://i.gifer.com/4SHX.gif', 
    voiceIndex: 3, 
    quote: "The cold never bothered me anyway." 
  },
];

export default function TalkingCharacters() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]);
  const [voices, setVoices] = useState([]); // No type annotation
  const mediaRecorderRef = useRef(null); // No type annotation
  const audioChunksRef = useRef([]); // No type annotation

  useEffect(() => {
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = () => {
    if (text && !isSpeaking) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);

      if (voices.length > selectedCharacter.voiceIndex) {
        utterance.voice = voices[selectedCharacter.voiceIndex];
      }

      switch (selectedCharacter.id) {
        case 'yoda':
          utterance.pitch = 0.8;
          utterance.rate = 0.8;
          break;
        case 'lofty':
          utterance.pitch = 1.2;
          utterance.rate = 1.1;
          break;
        case 'panda':
          utterance.pitch = 1.0;
          utterance.rate = 1.2;
          break;
        case 'elsa':
          utterance.pitch = 1.3;
          utterance.rate = 1.0;
          break;
      }

      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendAudioToBackend(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    try {
      const response = await fetch('/api/process-audio', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setText(data.text);
      } else {
        console.error('Error processing audio:', await response.text());
      }
    } catch (error) {
      console.error('Error sending audio to backend:', error);
    }
  };

  return (
    <div className="talking-container">
      <div className="character-display">
        <div className="character-image">
          <img 
            src={selectedCharacter.gif} 
            alt={`Animated ${selectedCharacter.name}`} 
            className="character-gif"
          />
        </div>
        <h1 className="character-name">{selectedCharacter.name}</h1>
        <p className="character-quote">{selectedCharacter.quote}</p>
      </div>
      <div className="control-panel">
        <Form.Select 
          onChange={(e) => setSelectedCharacter(characters.find(c => c.id === e.target.value) || characters[0])}
          className="character-select"
        >
          <option value="">Select a character</option>
          {characters.map((character) => (
            <option key={character.id} value={character.id}>
              {character.name}
            </option>
          ))}
        </Form.Select>
        <div className="input-group">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Enter text or record your voice..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="input-field"
            />
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              className={`record-btn ${isRecording ? 'recording' : ''}`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? <Square className="icon" /> : <Mic className="icon" />}
            </Button>
          </InputGroup>
        </div>
        <Button
          onClick={speak}
          disabled={isSpeaking || !text}
          className="speak-btn"
        >
          {isSpeaking ? "Speaking..." : "Speak"}
        </Button>
      </div>
    </div>
  );
}
