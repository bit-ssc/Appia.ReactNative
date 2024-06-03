interface IResult {
	content: string;
	index: number;
	finish_reason: string;
}
export interface IStreamData {
	conversation_id: string;
	usage: {
		latency: number;
		total_tokens: number;
		current_tokens: number;
	};
	bot_uuid: string;
	task_id: string;
	results: IResult[];
	timestamp: string;
}
