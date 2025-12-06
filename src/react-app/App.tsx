import { useState, useRef, useEffect } from "react";
import "./App.css";

interface Message {
	role: "user" | "assistant";
	content: string;
}

const PASSKEY_STORAGE_KEY = "vacation_planner_passkey";
const NEW_PASSKEY_STORAGE_KEY = "vacation_planner_new_passkey";
const DEFAULT_WELCOME_MESSAGE = "Hi! I'm your vacation planning assistant. I'll help you plan your perfect trip! Where would you like to go?";

function App() {
	const [messages, setMessages] = useState<Message[]>([
		{
			role: "assistant",
			content: DEFAULT_WELCOME_MESSAGE,
		},
	]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [passkeyId, setPasskeyId] = useState<string>("");
	const [showPasskeyModal, setShowPasskeyModal] = useState(false);
	const [passkeyInput, setPasskeyInput] = useState("");
	const [isCreatingPasskey, setIsCreatingPasskey] = useState(false);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const [newlyCreatedPasskey, setNewlyCreatedPasskey] = useState<string>("");
	const [copiedPasskey, setCopiedPasskey] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const storedPasskey = localStorage.getItem(PASSKEY_STORAGE_KEY);
		const storedNewPasskey = localStorage.getItem(NEW_PASSKEY_STORAGE_KEY);
		
		if (storedPasskey) {
			setPasskeyId(storedPasskey);
			loadChatHistory(storedPasskey);
		} else {
			setShowPasskeyModal(true);
		}
		
		// Persist newly created passkey even after logout so user can save it
		if (storedNewPasskey) {
			setNewlyCreatedPasskey(storedNewPasskey);
		}
	}, []);

	useEffect(() => {
		document.title = "Vacation Planner - AI Travel Assistant";
	}, []);

	const loadChatHistory = async (passkey: string) => {
		setIsLoadingHistory(true);
		try {
			const response = await fetch("/api/chat/history", {
				method: "GET",
				headers: {
					"X-Passkey-ID": passkey,
				},
			});

			if (response.ok) {
				const data = await response.json();
				if (data.messages && data.messages.length > 0) {
					setMessages(data.messages);
				}
			}
		} catch (error) {
			console.error("Error loading chat history:", error);
		} finally {
			setIsLoadingHistory(false);
		}
	};

	const generatePasskey = () => {
		return `pk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
	};

	const registerPasskey = async (passkey: string) => {
		try {
			const response = await fetch("/api/auth/passkey/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ passkeyId: passkey }),
			});

			if (response.ok) {
				localStorage.setItem(PASSKEY_STORAGE_KEY, passkey);
				setPasskeyId(passkey);
				setShowPasskeyModal(false);
				setPasskeyInput("");
				return true;
			}
			return false;
		} catch (error) {
			console.error("Error registering passkey:", error);
			return false;
		}
	};

	const copyPasskeyToClipboard = async (passkey: string) => {
		try {
			await navigator.clipboard.writeText(passkey);
			setCopiedPasskey(true);
			setTimeout(() => setCopiedPasskey(false), 2000);
		} catch (error) {
			console.error("Failed to copy passkey:", error);
		}
	};

	const handleCreatePasskey = async () => {
		setIsCreatingPasskey(true);
		const newPasskey = generatePasskey();
		const success = await registerPasskey(newPasskey);
		if (success) {
			setNewlyCreatedPasskey(newPasskey);
			localStorage.setItem(NEW_PASSKEY_STORAGE_KEY, newPasskey);
			setMessages([
				{
					role: "assistant",
					content: DEFAULT_WELCOME_MESSAGE,
				},
			]);
		}
		setIsCreatingPasskey(false);
	};

	const handleDismissNewPasskey = () => {
		setNewlyCreatedPasskey("");
		localStorage.removeItem(NEW_PASSKEY_STORAGE_KEY);
	};

	const handleEnterPasskey = async () => {
		if (!passkeyInput.trim()) return;
		const trimmedPasskey = passkeyInput.trim();
		try {
			const response = await fetch("/api/chat/history", {
				method: "GET",
				headers: {
					"X-Passkey-ID": trimmedPasskey,
				},
			});

			if (response.ok) {
				localStorage.setItem(PASSKEY_STORAGE_KEY, trimmedPasskey);
				setPasskeyId(trimmedPasskey);
				setShowPasskeyModal(false);
				setPasskeyInput("");
				loadChatHistory(trimmedPasskey);
			} else {
				const success = await registerPasskey(trimmedPasskey);
				if (success) {
					setShowPasskeyModal(false);
					setPasskeyInput("");
					setMessages([
						{
							role: "assistant",
							content: DEFAULT_WELCOME_MESSAGE,
						},
					]);
				}
			}
		} catch (error) {
			console.error("Error validating passkey:", error);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem(PASSKEY_STORAGE_KEY);
		setPasskeyId("");
		// Keep newlyCreatedPasskey visible so user can save it after logout
		setMessages([
			{
				role: "assistant",
				content: DEFAULT_WELCOME_MESSAGE,
			},
		]);
		setShowPasskeyModal(true);
	};

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleSend = async () => {
		if (!input.trim() || isLoading || !passkeyId) return;

		const userMessage = input.trim();
		setInput("");
		setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
		setIsLoading(true);

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					// Only send new message; backend merges with existing history
					messages: [{ role: "user", content: userMessage }],
					passkeyId: passkeyId,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to get response");
			}

			const data = await response.json();
			setMessages((prev) => [
				...prev,
				{ role: "assistant", content: data.response },
			]);
		} catch (error) {
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: "Sorry, I encountered an error. Please try again.",
				},
			]);
		} finally {
			setIsLoading(false);
			inputRef.current?.focus();
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className="app">
			<div className="chat-container">
				<div className="chat-header">
					<h2>Vacation Planner</h2>
					<div className="header-actions">
						{passkeyId && (
							<button
								onClick={handleLogout}
								className="logout-button"
								title="Logout"
							>
								🚪 Logout
							</button>
						)}
						<button
							onClick={() => setShowPasskeyModal(true)}
							className="passkey-button"
							title="Manage Passkey"
						>
							🔑 {passkeyId ? "Change Passkey" : "Set Passkey"}
						</button>
					</div>
				</div>
				<div className="messages">
					{newlyCreatedPasskey && (
						<div className="passkey-banner">
							<div className="passkey-banner-content">
								<div className="passkey-banner-warning">
									<strong>⚠️ Save Your Passkey!</strong>
									<p>Your passkey is required to access your chat history. Copy and save it now before closing this page.</p>
								</div>
								<div className="passkey-banner-display">
									<code className="passkey-banner-value">{newlyCreatedPasskey}</code>
									<div className="passkey-banner-actions">
										<button
											onClick={() => copyPasskeyToClipboard(newlyCreatedPasskey)}
											className="copy-button-small"
											title="Copy to clipboard"
										>
											{copiedPasskey ? "✓ Copied!" : "📋 Copy"}
										</button>
										<button
											onClick={handleDismissNewPasskey}
											className="dismiss-button"
											title="Dismiss"
										>
											×
										</button>
									</div>
								</div>
							</div>
						</div>
					)}
					{isLoadingHistory && (
						<div className="message assistant">
							<div className="message-content">Loading chat history...</div>
						</div>
					)}
					{messages.map((msg, idx) => (
						<div key={idx} className={`message ${msg.role}`}>
							<div className="message-content">{msg.content}</div>
						</div>
					))}
					{isLoading && (
						<div className="message assistant">
							<div className="message-content">
								<span className="typing-indicator">●</span>
							</div>
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>
				<div className="input-container">
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyPress}
						placeholder={
							passkeyId
								? "Tell me about your vacation preferences..."
								: "Please set a passkey to start chatting..."
						}
						disabled={isLoading || !passkeyId}
						className="input"
					/>
					<button
						onClick={handleSend}
						disabled={isLoading || !input.trim() || !passkeyId}
						className="send-button"
					>
						Send
					</button>
				</div>
			</div>

			{showPasskeyModal && (
				<div className="modal-overlay" onClick={() => setShowPasskeyModal(false)}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3>Passkey Management</h3>
							<button
								className="modal-close"
								onClick={() => setShowPasskeyModal(false)}
							>
								×
							</button>
						</div>
						<div className="modal-body">
							<div className="passkey-section">
								<h4>Create New Passkey</h4>
								<p className="passkey-description">
									Create a new passkey to start a fresh chat session. Your chat
									history will be saved and linked to this passkey.
								</p>
								<button
									onClick={handleCreatePasskey}
									disabled={isCreatingPasskey}
									className="passkey-action-button"
								>
									{isCreatingPasskey ? "Creating..." : "Create New Passkey"}
								</button>
							</div>
							<div className="passkey-divider">
								<span>OR</span>
							</div>
							<div className="passkey-section">
								<h4>Enter Existing Passkey</h4>
								<p className="passkey-description">
									Enter an existing passkey to continue your previous chat
									session.
								</p>
								<input
									type="text"
									value={passkeyInput}
									onChange={(e) => setPasskeyInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleEnterPasskey();
										}
									}}
									placeholder="Enter your passkey..."
									className="passkey-input"
								/>
								<button
									onClick={handleEnterPasskey}
									disabled={!passkeyInput.trim()}
									className="passkey-action-button"
								>
									Use Passkey
								</button>
							</div>
							{newlyCreatedPasskey && (
								<div className="new-passkey-display">
									<div className="passkey-warning">
										<strong>⚠️ Important: Save Your Passkey!</strong>
										<p>
											Your passkey is required to access your chat history. Please save it in a safe place. You won't be able to recover it if you lose it.
										</p>
									</div>
									<div className="passkey-display-box">
										<div className="passkey-label">Your New Passkey:</div>
										<div className="passkey-value-container">
											<code className="passkey-value">{newlyCreatedPasskey}</code>
											<button
												onClick={() => copyPasskeyToClipboard(newlyCreatedPasskey)}
												className="copy-button"
												title="Copy to clipboard"
											>
												{copiedPasskey ? "✓ Copied!" : "📋 Copy"}
											</button>
										</div>
									</div>
								</div>
							)}
							{passkeyId && !newlyCreatedPasskey && (
								<div className="current-passkey">
									<div className="passkey-label">Current Passkey:</div>
									<div className="passkey-value-container">
										<code className="passkey-value">{passkeyId}</code>
										<button
											onClick={() => copyPasskeyToClipboard(passkeyId)}
											className="copy-button"
											title="Copy to clipboard"
										>
											{copiedPasskey ? "✓ Copied!" : "📋 Copy"}
										</button>
									</div>
									<p className="passkey-reminder">
										💡 Save this passkey to access your chat history later
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
