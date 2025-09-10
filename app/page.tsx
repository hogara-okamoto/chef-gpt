"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import Image from "next/image";
// If you want to specify the endpoint explicitly, you can pass a transport.
// import { DefaultChatTransport } from "ai";

// helper: turn a v5 message into plain text
const getMessageText = (m: { parts: { type: string; text?: string }[] }) =>
  m.parts
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text as string)
    .join("\n");


export default function Chat() {
  const { messages, status, sendMessage } = useChat();
  const isLoading = status !== "ready";
  const [imageIsLoading, setImageIsLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [audioIsLoading, setAudioIsLoading] = useState(false);
  const [audio, setAudio] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Cleanup audio URL when component unmounts or audio changes
  useEffect(() => {
    return () => {
      if (audio) {
        URL.revokeObjectURL(audio);
      }
    };
  }, [audio]);
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);
  if (imageIsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-slate-700 h-10 w-10"></div>
          </div>
        </div>
      </div>
    );
  }
  // Show image above chat messages if it exists
  const imageSection = image && (
    <div className="flex flex-col items-center gap-4 mb-2">
      <Image 
        src={`data:image/jpeg;base64,${image}`} 
        alt="Generated recipe image"
        width={512}
        height={512}
        className="max-w-full h-auto rounded-lg shadow-lg"
      />
      <div className="flex flex-col justify-center items-center">
        {audio && (
          <>
            <p className="text-sm text-gray-600 mb-2">Listen to the recipe:</p>
            <audio 
              controls 
              src={audio} 
              className="w-full max-w-md"
              preload="metadata"
              onError={(e) => console.error('Audio error:', e)}
            />
          </>
        )}
        {audioIsLoading && !audio && <p className="text-sm text-gray-600">Audio is being generated...</p>}
        {!audioIsLoading && !audio && (
          <button
            className="bg-blue-500 p-2 text-white rounded shadow-xl hover:bg-blue-600 transition-colors"
            onClick={async () => {
              try {
                setAudioIsLoading(true);
                
                // iOS Safari workaround: create audio context on user interaction
                if (typeof window !== 'undefined' && 'AudioContext' in window) {
                  const AudioContextClass = (window as Window & { AudioContext: typeof AudioContext }).AudioContext;
                  const audioContext = new AudioContextClass();
                  if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                  }
                }
                
                const response = await fetch("/api/audio", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    message: messages.length ? getMessageText(messages[messages.length - 1]) : "",
                  }),
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Test audio loading on iOS
                const testAudio = new Audio();
                testAudio.src = audioUrl;
                testAudio.preload = 'metadata';
                
                testAudio.oncanplaythrough = () => {
                  setAudio(audioUrl);
                  setAudioIsLoading(false);
                };
                
                testAudio.onerror = () => {
                  console.error('Audio failed to load');
                  setAudioIsLoading(false);
                  alert('Audio generation failed. Please try again.');
                };
                
                // Fallback timeout
                setTimeout(() => {
                  if (audioIsLoading) {
                    setAudioIsLoading(false);
                    setAudio(audioUrl);
                  }
                }, 5000);
                
              } catch (error) {
                console.error('Audio generation error:', error);
                setAudioIsLoading(false);
                alert('Audio generation failed. Please try again.');
              }
            }}
          >
            Generate Audio
          </button>
        )}
      </div>
    </div>
  );
  return (
    <div className="flex flex-col w-full h-screen max-w-md pt-4 pb-16 mx-auto stretch overflow-hidden">
      {imageSection}
      <div
        className="overflow-auto w-full mb-8 flex-1 min-h-96"
        ref={messagesContainerRef}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-green-300 p-4 m-3 rounded-lg text-sm"
                : "bg-slate-300 p-4 m-3 rounded-lg text-sm leading-relaxed"
            }`}
          >
            {m.role === "user" ? "User: " : "AI: "}
            {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-end pr-4">
            <span className="animate-pulse text-2xl">...</span>
          </div>
        )}
      </div>
      {messages.length == 0 && (
        <div className="flex flex-col justify-center items-center h-screen absolute inset-0">
          <Image 
            src="/images/chef.png" 
            alt="Friendly Chef" 
            width={128}
            height={128}
            className="w-32 h-32 mb-4 rounded-lg shadow-lg"
          />
          <button
            className="bg-blue-500 p-2 text-white rounded shadow-xl"
            disabled={isLoading}
            onClick={() => sendMessage({ text: "Give me a random recipe" })}
          >
            Random Recipe
          </button>
        </div>
      )}
      
      {messages.length > 0 && (
        <div className="fixed bottom-0 w-full max-w-md">
          <div className="flex flex-col justify-center mb-2 items-center">
            {messages.length == 2 && !isLoading && !image && (
              <button
                className="bg-blue-500 p-2 text-white rounded shadow-xl"
                disabled={isLoading}
                onClick={async () => {
                  setImageIsLoading(true);
                  const last = messages[messages.length - 1];
                  const lastText = last ? getMessageText(last) : "";

                  const response = await fetch("api/images", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      message: lastText,
                    }),
                  });
                  const data = await response.json();
                  setImage(data);
                  setImageIsLoading(false);
                }}
              >
                Generate image
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
