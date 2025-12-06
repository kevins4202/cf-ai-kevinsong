import type { Message } from "./types";

export interface ChatHistory {
	passkeyId: string;
	messages: Message[];
	createdAt: string;
	updatedAt: string;
}

const CHAT_HISTORY_PREFIX = "chat:";
const PASSKEY_PREFIX = "passkey:";

export async function loadChatHistory(passkeyId: string, kv: KVNamespace): Promise<Message[]> {
	try {
		const history = await kv.get<ChatHistory>(`${CHAT_HISTORY_PREFIX}${passkeyId}`, "json");
		return history?.messages || [];
	} catch (error) {
		console.error("Error loading chat history:", error);
		return [];
	}
}

export async function saveChatHistory(
	passkeyId: string,
	messages: Message[],
	kv: KVNamespace
): Promise<void> {
	try {
		const history: ChatHistory = {
			passkeyId,
			messages,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		await kv.put(`${CHAT_HISTORY_PREFIX}${passkeyId}`, JSON.stringify(history));
	} catch (error) {
		console.error("Error saving chat history:", error);
	}
}

export async function verifyPasskey(
	passkeyId: string,
	kv: KVNamespace
): Promise<boolean> {
	try {
		const exists = await kv.get(`${PASSKEY_PREFIX}${passkeyId}`);
		return exists !== null;
	} catch (error) {
		console.error("Error verifying passkey:", error);
		return false;
	}
}

export async function registerPasskey(
	passkeyId: string,
	kv: KVNamespace
): Promise<void> {
	try {
		await kv.put(`${PASSKEY_PREFIX}${passkeyId}`, "registered", {
			expirationTtl: 60 * 60 * 24 * 365, // 1 year
		});
	} catch (error) {
		console.error("Error registering passkey:", error);
	}
}
