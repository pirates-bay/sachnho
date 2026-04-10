'use client';

import { useState, useRef, useCallback } from 'react';

interface AudioRecorderProps {
  label: string;
  currentUrl: string | null;
  onSave: (blob: Blob) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  accentColor: string;
}

export function AudioRecorder({ label, currentUrl, onSave, onUpload, accentColor }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      alert('Microphone access denied. Please allow microphone access to record audio.');
    }
  }, [recordedUrl]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!recordedBlob) return;
    setSaving(true);
    await onSave(recordedBlob);
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setSaving(false);
  }, [recordedBlob, recordedUrl, onSave]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    await onUpload(file);
    setSaving(false);
    e.target.value = '';
  }, [onUpload]);

  const playPreview = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlaying(false);
      return;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlaying(true);
    audio.onended = () => { audioRef.current = null; setPlaying(false); };
    audio.play();
  }, []);

  const displayUrl = recordedUrl || currentUrl;

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-600">{label}</span>
        {displayUrl && (
          <span className="text-xs text-green-600 font-semibold">Has audio</span>
        )}
      </div>

      {/* Current/Recorded Audio Preview */}
      {displayUrl && (
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => playPreview(displayUrl)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {playing ? '⏹ Stop' : '▶ Play'}
          </button>
          {recordedUrl && (
            <span className="text-xs text-orange-600 font-semibold">New recording (unsaved)</span>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        {/* Record Button */}
        {recording ? (
          <button
            onClick={stopRecording}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500 text-white"
          >
            <span className="animate-pulse">●</span> Stop Recording
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-colors"
            style={{ backgroundColor: accentColor }}
          >
            🎙 Record
          </button>
        )}

        {/* Upload Button */}
        <label className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer transition-colors">
          📁 Upload
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {/* Save Recorded */}
        {recordedBlob && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500 text-white disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : '💾 Save Recording'}
          </button>
        )}
      </div>
    </div>
  );
}
