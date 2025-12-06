import type { Message, AIResponse } from "./types";

export function convertToAIMessage(msg: Message): Message {
	return {
		role: msg.role === "assistant" ? "assistant" : "user",
		content: msg.content || "",
	};
}

export function logUserMessages(messages: Message[]): void {
	const userMessages = messages.filter((m) => m.role === "user");
	console.log(`[User Messages] Count: ${userMessages.length}`);
	userMessages.forEach((m, idx) => {
		console.log(`[User Message ${idx + 1}]:`, m.content);
	});
}

export function logAIRequest(totalMessages: number): void {
	console.log(`[AI Call] Sending request to AI`);
	console.log(`[AI Call] Messages count: ${totalMessages}`);
}

export function logAIResponse(aiResponse: AIResponse): void {
	console.log("[AI Response] Full response object keys:", Object.keys(aiResponse));
	console.log("[AI Response] Response type:", typeof aiResponse.response);
	console.log("[AI Response] Response length:", aiResponse.response?.length || 0);
	console.log("[AI Response] Response preview:", aiResponse.response?.substring?.(0, 300) || aiResponse.response	);
}

export function isFinalItinerary(response: string): boolean {
	const lowerResponse = response.toLowerCase();
	return (
		lowerResponse.includes("itinerary") &&
		(lowerResponse.includes("day 1") || lowerResponse.includes("day-by-day") || lowerResponse.includes("complete itinerary"))
	);
}
