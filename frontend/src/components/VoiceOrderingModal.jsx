import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export const VoiceOrderingModal = ({ isOpen, onClose, allFoods = [] }) => {
  const { addToCart, clearCart, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [manualText, setManualText] = useState("");
  const [aiFeedback, setAiFeedback] = useState(
    "🎙️ Tap the big microphone to speak, or type any command below!"
  );
  const [actionLog, setActionLog] = useState([]);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);

  const recognitionRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Check Web Speech API Support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setAiFeedback(
        "Microphone API is not supported on this browser. You can type commands below or use the quick buttons!"
      );
    }
  }, []);

  // Equalizer waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let angle = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const bars = 36;
      const barWidth = width / bars - 3;

      for (let i = 0; i < bars; i++) {
        const factor = isListening ? Math.sin(angle + i * 0.3) * 0.7 + 0.3 : 0.15;
        const barHeight = isListening
          ? Math.max(6, Math.sin(angle * 2 + i * 0.4) * (height * 0.45) * factor + height * 0.22)
          : 6;

        const x = i * (barWidth + 3);
        const y = centerY - barHeight / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isListening) {
          gradient.addColorStop(0, "#10b981");
          gradient.addColorStop(0.5, "#34d399");
          gradient.addColorStop(1, "#059669");
        } else {
          gradient.addColorStop(0, "#64748b");
          gradient.addColorStop(1, "#475569");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, 3);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      angle += isListening ? 0.08 : 0.02;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening]);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    }
  }, [isOpen]);

  const speakVoiceResponse = (text) => {
    if (!audioFeedbackEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAiFeedback("Speech Recognition is not available. Please type your command below.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setAiFeedback("🎙️ Listening... Speak your order now (e.g. 'Add 2 Burgers', 'Book a table')");
      };

      recognition.onresult = (event) => {
        let currentInterim = "";
        let finalSpeech = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalSpeech += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        setInterimTranscript(currentInterim);
        if (finalSpeech) {
          setTranscript(finalSpeech);
          processVoiceCommand(finalSpeech);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setAiFeedback("⚠️ Microphone permission was blocked. Please click allow in your browser address bar, or use the instant buttons/text box below.");
        } else if (event.error === "no-speech") {
          setAiFeedback("Didn't catch that. Tap the mic to try again or type below!");
        } else {
          setAiFeedback(`Mic paused (${event.error}). Tap mic to speak or type below.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Mic start exception:", err);
      setIsListening(false);
      setAiFeedback("Could not access microphone directly. Please type below or tap quick buttons.");
    }
  };

  const toggleMic = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      setAiFeedback("Microphone paused. Tap to speak again or type below.");
    } else {
      startSpeechRecognition();
    }
  };

  // Natural Language Command Processor
  const processVoiceCommand = (cmdText) => {
    const raw = cmdText.trim().toLowerCase();
    let feedback = "";

    // Extract quantity
    const numWords = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };
    let quantity = 1;
    for (const [word, val] of Object.entries(numWords)) {
      if (raw.includes(` ${word} `) || raw.startsWith(`${word} `)) {
        quantity = val;
        break;
      }
    }
    const digitMatch = raw.match(/\b([1-9]|10)\b/);
    if (digitMatch) {
      quantity = parseInt(digitMatch[1], 10);
    }

    // 1. Navigation Commands
    if (
      raw.includes("book a table") ||
      raw.includes("reservation") ||
      raw.includes("table booking") ||
      raw.includes("reserve table")
    ) {
      feedback = "Taking you to Table Reservations!";
      speakVoiceResponse(feedback);
      onClose();
      navigate("/reservation");
      return;
    }
    if (
      raw.includes("driver portal") ||
      raw.includes("driver dispatch") ||
      raw.includes("delivery driver") ||
      raw.includes("driver")
    ) {
      feedback = "Switching to Driver Portal!";
      speakVoiceResponse(feedback);
      onClose();
      navigate("/driver");
      return;
    }
    if (
      raw.includes("track order") ||
      raw.includes("my orders") ||
      raw.includes("where is my food") ||
      raw.includes("orders")
    ) {
      feedback = "Taking you to your active orders!";
      speakVoiceResponse(feedback);
      onClose();
      navigate("/orders");
      return;
    }
    if (
      raw.includes("craft dish") ||
      raw.includes("customizer") ||
      raw.includes("build burger") ||
      raw.includes("craft burger")
    ) {
      feedback = "Launching 3D Dish Customizer!";
      speakVoiceResponse(feedback);
      onClose();
      navigate("/customizer");
      return;
    }
    if (
      raw.includes("menu") ||
      raw.includes("dishes") ||
      raw.includes("food list") ||
      raw.includes("show menu")
    ) {
      feedback = "Taking you to the Menu!";
      speakVoiceResponse(feedback);
      onClose();
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById("menu-explorer");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
      return;
    }

    // 2. Cart Operations
    if (
      raw.includes("clear cart") ||
      raw.includes("empty cart") ||
      raw.includes("delete all items")
    ) {
      clearCart();
      feedback = "Your shopping cart has been cleared.";
      speakVoiceResponse(feedback);
      setAiFeedback(feedback);
      setActionLog((prev) => [`🗑️ ${feedback}`, ...prev]);
      return;
    }
    if (
      raw.includes("open cart") ||
      raw.includes("show cart") ||
      raw.includes("view cart") ||
      raw.includes("checkout")
    ) {
      setIsCartOpen(true);
      onClose();
      feedback = "Opening your cart now.";
      speakVoiceResponse(feedback);
      return;
    }

    // 3. Search or Add to Cart
    const cleanTarget = raw
      .replace("add", "")
      .replace("order", "")
      .replace("get me", "")
      .replace("i want", "")
      .replace("to cart", "")
      .replace("please", "")
      .replace("one", "")
      .replace("two", "")
      .replace("three", "")
      .trim();

    const matchedFood = allFoods.find((food) => {
      const name = (food.name || "").toLowerCase();
      const cat = (food.category || "").toLowerCase();
      return (
        name.includes(cleanTarget) ||
        cleanTarget.includes(name) ||
        (cleanTarget.length > 2 && (cat.includes(cleanTarget) || cleanTarget.includes(cat)))
      );
    });

    if (matchedFood) {
      addToCart(matchedFood, quantity);
      feedback = `✨ Added ${quantity}x ${matchedFood.name} to your cart!`;
      speakVoiceResponse(feedback);
      setAiFeedback(feedback);
      setActionLog((prev) => [
        `🛒 Added ${quantity}x ${matchedFood.name} (₹${matchedFood.price * quantity})`,
        ...prev,
      ]);
    } else {
      feedback = `Heard: "${cmdText}". Try saying "Add Cheeseburger", "Add Pepperoni Pizza" or "Book a Table".`;
      setAiFeedback(feedback);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setTranscript(prompt);
    processVoiceCommand(prompt);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    setTranscript(manualText.trim());
    processVoiceCommand(manualText.trim());
    setManualText("");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay voice-modal-overlay" onClick={onClose}>
      <div className="voice-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close-corner-btn"
          onClick={onClose}
          aria-label="Close voice assistant"
        >
          ✕
        </button>

        {/* Header */}
        <div className="voice-modal-header">
          <div className="voice-title-row">
            <span className="voice-ai-sparkle">🎙️</span>
            <div>
              <h2 className="voice-modal-title">AI Voice Concierge</h2>
              <span className="voice-modal-sub">
                Speak or type naturally to order food or navigate
              </span>
            </div>
          </div>
          <button
            className={`voice-audio-toggle ${audioFeedbackEnabled ? "active" : ""}`}
            onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
            title="Toggle Voice Speech Feedback"
            type="button"
          >
            {audioFeedbackEnabled ? "🔊 Voice On" : "🔇 Muted"}
          </button>
        </div>

        {/* Real-time Frequency Waveform */}
        <div className="voice-waveform-container">
          <canvas
            ref={canvasRef}
            width={460}
            height={90}
            className="voice-audio-canvas"
          ></canvas>
        </div>

        {/* Live Mic Button & Feedback */}
        <div className="voice-center-control">
          <button
            className={`voice-mic-main-btn ${isListening ? "pulsing" : "paused"}`}
            onClick={toggleMic}
            aria-label={isListening ? "Stop listening" : "Start listening"}
            type="button"
          >
            <span className="mic-icon-big">{isListening ? "🎙️" : "🎤"}</span>
            <span className="mic-halo-ring"></span>
          </button>
          <span className="mic-status-text">
            {isListening
              ? "🔴 LISTENING... Speak now!"
              : "Tap Microphone to Speak"}
          </span>
        </div>

        {/* Live Transcript & AI Feedback */}
        <div className="voice-transcript-box">
          <div className="voice-heard-row">
            <small className="transcript-label">Recognized Speech:</small>
            <p className="transcript-text">
              {transcript || interimTranscript || "(Awaiting speech input...)"}
            </p>
          </div>
          <div className="voice-ai-response-row">
            <span className="ai-response-icon">🤖</span>
            <p className="ai-response-text">{aiFeedback}</p>
          </div>
        </div>

        {/* Manual Type / Text Command Input */}
        <form onSubmit={handleManualSubmit} className="voice-manual-input-row">
          <input
            type="text"
            className="voice-text-command-input"
            placeholder="Or type a command (e.g. Add 2 Burgers, Book Table)..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
          />
          <button type="submit" className="voice-text-submit-btn">
            Execute ➔
          </button>
        </form>

        {/* Action History Log */}
        {actionLog.length > 0 && (
          <div className="voice-action-log">
            <span className="action-log-title">Recent Voice Actions:</span>
            <div className="action-log-chips">
              {actionLog.slice(0, 3).map((act, i) => (
                <span key={i} className="action-chip-pill">
                  {act}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Suggested Voice Prompts */}
        <div className="voice-prompts-section">
          <span className="prompts-label">Instant 1-Click Commands:</span>
          <div className="voice-chips-grid">
            <button
              className="voice-chip-btn"
              onClick={() => handleQuickPrompt("Add 2 Burgers")}
              type="button"
            >
              🍔 "Add 2 Burgers"
            </button>
            <button
              className="voice-chip-btn"
              onClick={() => handleQuickPrompt("Add Pepperoni Pizza")}
              type="button"
            >
              🍕 "Add Pepperoni Pizza"
            </button>
            <button
              className="voice-chip-btn"
              onClick={() => handleQuickPrompt("Add Chocolate Lava Cake")}
              type="button"
            >
              🧁 "Add Lava Cake"
            </button>
            <button
              className="voice-chip-btn"
              onClick={() => handleQuickPrompt("Book a table")}
              type="button"
            >
              🍽️ "Book a Table"
            </button>
            <button
              className="voice-chip-btn"
              onClick={() => handleQuickPrompt("Open cart")}
              type="button"
            >
              🛒 "Open Cart"
            </button>
            <button
              className="voice-chip-btn"
              onClick={() => handleQuickPrompt("Clear cart")}
              type="button"
            >
              🗑️ "Clear Cart"
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default VoiceOrderingModal;
