export interface Message {
	role: "user" | "assistant" | "system";
	content?: string;
}

export interface AIResponse {
	response: string | null;
}
