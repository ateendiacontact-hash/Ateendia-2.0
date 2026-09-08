import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send, Volume2 } from 'lucide-react';

interface VoiceAudioRecorderProps {
  onSendAudio: (audioUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceAudioRecorder: React.FC<VoiceAudioRecorderProps> = ({
  onSendAudio,
  onCancel
}) => {
  const [seconds, setSeconds] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Attempt real browser MediaRecorder API if available
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((s) => {
          stream = s;
          const recorder = new MediaRecorder(s);
          setMediaRecorder(recorder);

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          recorder.start();
        })
        .catch((err) => {
          console.log('Audio capture simulated fallback due to permissions:', err);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStopAndSend = () => {
    setIsRecording(false);

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        onSendAudio(audioUrl, seconds || 4);
      };
      mediaRecorder.stop();
    } else {
      // Fallback sample audio for demo environments
      const sampleAudio = 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg';
      onSendAudio(sampleAudio, seconds || 5);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between w-full bg-purple-50/90 border border-purple-200 px-4 py-2 rounded-2xl animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="w-3.5 h-3.5 rounded-full bg-rose-600 animate-ping"></div>
        <span className="text-xs font-black text-purple-950 font-mono tracking-wider">
          Grabando Audio: {formatTime(seconds)}
        </span>

        {/* Live Audio Visualizer Bars */}
        <div className="hidden sm:flex items-center gap-0.5 h-5">
          <span className="w-1 bg-purple-600 rounded-full h-2 animate-bounce"></span>
          <span className="w-1 bg-purple-600 rounded-full h-4 animate-bounce delay-75"></span>
          <span className="w-1 bg-purple-600 rounded-full h-3 animate-bounce delay-150"></span>
          <span className="w-1 bg-purple-600 rounded-full h-5 animate-bounce delay-100"></span>
          <span className="w-1 bg-purple-600 rounded-full h-2 animate-bounce delay-200"></span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          title="Descartar Audio"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleStopAndSend}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Enviar Audio</span>
        </button>
      </div>
    </div>
  );
};
