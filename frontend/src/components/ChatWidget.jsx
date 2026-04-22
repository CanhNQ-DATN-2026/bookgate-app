import React, { useState, useRef, useEffect } from "react";
import { streamChat } from "../api/chat";

const SUGGESTED = [
  "Thư viện có những sách nào?",
  "Gợi ý sách về lập trình",
  "Tóm tắt sách Clean Code",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, streaming]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || streaming) return;
    setInput("");

    const userMsg = { role: "user", content: msg };
    const assistantMsg = { role: "assistant", content: "" };
    setHistory((h) => [...h, userMsg, assistantMsg]);
    setStreaming(true);

    try {
      for await (const chunk of streamChat(msg, [...history, userMsg])) {
        setHistory((h) => {
          const next = [...h];
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      }
    } catch (err) {
      setHistory((h) => {
        const next = [...h];
        next[next.length - 1] = { ...next[next.length - 1], content: `⚠ Lỗi: ${err.message}` };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clear = () => setHistory([]);

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">📚</div>
              <div>
                <div className="chat-header-title">Bookgate AI</div>
                <div className="chat-header-sub">Trợ lý thư viện</div>
              </div>
            </div>
            <div className="chat-header-actions">
              {history.length > 0 && (
                <button className="chat-icon-btn" onClick={clear} title="Xóa lịch sử">🗑</button>
              )}
              <button className="chat-icon-btn" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          <div className="chat-messages">
            {history.length === 0 && (
              <div className="chat-welcome">
                <div className="chat-welcome-icon">📚</div>
                <p>Xin chào! Tôi có thể giúp bạn tìm sách, gợi ý đọc, hoặc tóm tắt nội dung.</p>
                <div className="chat-suggestions">
                  {SUGGESTED.map((s) => (
                    <button key={s} className="chat-suggestion" onClick={() => send(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {history.map((msg, i) => (
              <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                {msg.role === "assistant" && (
                  <div className="chat-msg-avatar">📚</div>
                )}
                <div className="chat-bubble">
                  {msg.content
                    ? msg.content.split("\n").map((line, j) => (
                        <span key={j}>{line}{j < msg.content.split("\n").length - 1 && <br />}</span>
                      ))
                    : streaming && i === history.length - 1
                    ? <span className="chat-typing"><span /><span /><span /></span>
                    : null
                  }
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-area">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Nhập câu hỏi… (Enter để gửi)"
              rows={1}
              disabled={streaming}
              className="chat-input"
            />
            <button
              className="chat-send-btn"
              onClick={() => send()}
              disabled={!input.trim() || streaming}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button className={`chat-toggle${open ? " chat-toggle-open" : ""}`} onClick={() => setOpen((o) => !o)} title="Trợ lý thư viện">
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
