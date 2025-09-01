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
    <div className="flex flex-col items-center gap-4 mb-4">
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
            <audio controls src={audio} className="w-full max-w-md" />
          </>
        )}
        {audioIsLoading && !audio && <p className="text-sm text-gray-600">Audio is being generated...</p>}
        {!audioIsLoading && !audio && (
          <button
            className="bg-blue-500 p-2 text-white rounded shadow-xl hover:bg-blue-600 transition-colors"
            onClick={async () => {
              setAudioIsLoading(true);
              const response = await fetch("/api/audio", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  message: messages.length ? getMessageText(messages[messages.length - 1]) : "",
                }),
              });
              const audioBlob = await response.blob();
              const audioUrl = URL.createObjectURL(audioBlob);
              setAudio(audioUrl);
              setAudioIsLoading(false);
            }}
          >
            Generate Audio
          </button>
        )}
      </div>
    </div>
  );
  return (
    <div className="flex flex-col w-full h-screen max-w-md py-16 mx-auto stretch overflow-hidden">
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
        <div className="flex flex-col justify-center items-center h-full">
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
