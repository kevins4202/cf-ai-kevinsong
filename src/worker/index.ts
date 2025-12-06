import { Hono } from "hono";
import {
	MODEL_NAME,
	MAX_TOKENS,
	TEMPERATURE,
	DEFAULT_RESPONSE,
	VACATION_PLANNING_SYSTEM_PROMPT,
} from "./constants";
import type { Message, AIResponse } from "./types";
import {
	convertToAIMessage,
	logUserMessages,
	logAIRequest,
	logAIResponse,
	isFinalItinerary,
} from "./utils";
import {
	loadChatHistory,
	saveChatHistory,
	verifyPasskey,
	registerPasskey,
} from "./storage";

const app = new Hono<{ Bindings: Env }>();

app.post("/api/auth/passkey/register", async (c) => {
	try {
		const { passkeyId } = await c.req.json();

		if (!passkeyId) {
			return c.json({ error: "passkeyId required" }, 400);
		}

		await registerPasskey(passkeyId, c.env.CHAT_HISTORY);

		return c.json({ success: true, passkeyId });
	} catch (error) {
		console.error("Error registering passkey:", error);
		return c.json({ error: "Failed to register passkey" }, 500);
	}
});

app.get("/api/chat/history", async (c) => {
	try {
		const passkeyId = c.req.header("X-Passkey-ID");
		
		if (!passkeyId) {
			return c.json({ error: "passkeyId required in X-Passkey-ID header" }, 400);
		}

		const messages = await loadChatHistory(passkeyId, c.env.CHAT_HISTORY);

		return c.json({ messages });
	} catch (error) {
		console.error("Error loading chat history:", error);
		return c.json({ error: "Failed to load history" }, 500);
	}
});

app.post("/api/chat", async (c) => {
	try {
		const { messages: newMessages, passkeyId } = await c.req.json();

		if (!passkeyId) {
			return c.json({ error: "passkeyId required" }, 400);
		}

		// Auto-register passkey if it doesn't exist
		const passkeyExists = await verifyPasskey(passkeyId, c.env.CHAT_HISTORY);
		if (!passkeyExists) {
			await registerPasskey(passkeyId, c.env.CHAT_HISTORY);
		}

		console.log(`[Request] Passkey ID: ${passkeyId}`);
		console.log("[Request] New messages:", JSON.stringify(newMessages, null, 2));

		let existingMessages = await loadChatHistory(passkeyId, c.env.CHAT_HISTORY);
		console.log(`[History] Loaded ${existingMessages.length} existing messages`);

		// Merge new messages with existing history
		let messages: Message[];
		if (newMessages && Array.isArray(newMessages) && newMessages.length > 0) {
			messages = [...existingMessages, ...newMessages];
		} else {
			messages = existingMessages;
		}

		if (messages.length === 0) {
			return c.json({ error: "No messages provided" }, 400);
		}

		const aiMessages: Message[] = [
			{
				role: "system",
				content: VACATION_PLANNING_SYSTEM_PROMPT,
			},
			...messages.map(convertToAIMessage),
		];

		logUserMessages(aiMessages);

		console.log(`[Messages] Total messages to AI: ${aiMessages.length}`);
		console.log("[Messages] Message structure:", aiMessages.map((m) => ({
			role: m.role,
			contentLength: m.content?.length || 0,
		})));

		logAIRequest(aiMessages.length);

		// Type assertion needed: Workers AI expects specific message format
		const aiResponse = (await c.env.AI.run(MODEL_NAME, {
			messages: aiMessages as any,
			max_tokens: MAX_TOKENS,
			temperature: TEMPERATURE,
		})) as AIResponse;

		logAIResponse(aiResponse);

		const finalResponse = aiResponse.response || DEFAULT_RESPONSE;
		
		console.log("[Final Response] Response length:", finalResponse.length);
		console.log("[Final Response] Response preview:", finalResponse.substring(0, 300));
		
		const conversationComplete = isFinalItinerary(finalResponse);
		if (conversationComplete) {
			console.log("[Final Response] Detected final itinerary - conversation complete");
		}

		const updatedMessages: Message[] = [
			...messages,
			{
				role: "assistant",
				content: finalResponse,
			},
		];
		await saveChatHistory(passkeyId, updatedMessages, c.env.CHAT_HISTORY);

		return c.json({ 
			response: finalResponse,
			complete: conversationComplete,
		});
	} catch (error) {
		console.error("Error processing chat:", error);
		return c.json(
			{
				error: "Failed to process request",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500
		);
	}
});

app.get("/api/", (c) => c.json({ status: "ok", service: "vacation-planner" }));

export default app;
