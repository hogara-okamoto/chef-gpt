"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
// If you want to specify the endpoint explicitly, you can pass a transport.
// import { DefaultChatTransport } from "ai";

export default function Chat() {
  const { messages, sendMessage, status, error } = useChat({
    // transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const [input, setInput] = useState("");

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // auto-scroll to bottom when messages change
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const isLoading = status !== "ready";

  return (
    <div className="flex flex-col w-full h-screen max-w-md py-24 mx-auto overflow-hidden">
      <div className="overflow-auto w-full mb-8" ref={messagesContainerRef}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-green-100 p-3 m-2 rounded-lg"
                : "bg-slate-100 p-3 m-2 rounded-lg"
            }`}
          >
            {m.role === "user" ? "User: " : "AI: "}
            {/* v5: render message.parts */}
            {m.parts.map((part, i) =>
              part.type === "text" ? <span key={i}>{part.text}</span> : null
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-end pr-4">
            <span className="animate-pulse text-2xl">...</span>
          </div>
        )}

        {error && (
          <div className="text-red-400 px-4">Error: {String(error)}</div>
        )}
      </div>

      <div className="fixed bottom-0 w-full max-w-md">
        <div className="flex flex-col justify-center mb-2 items-center">
          <button
            className="bg-blue-500 p-2 text-white rounded shadow-xl"
            disabled={isLoading}
            onClick={() => sendMessage({ text: "Give me a random recipe" })}
          >
            Random Recipe
          </button>
        </div>

        <form
          className="flex justify-center"
          onSubmit={(e) => {
            e.preventDefault();
            const text = input.trim();
            if (!text) return;
            sendMessage({ text });
            setInput("");
          }}
        >
          <input
            className="w-[95%] p-2 mb-8 border border-gray-300 rounded shadow-xl text-black"
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
        </form>
      </div>
    </div>
  );
}
