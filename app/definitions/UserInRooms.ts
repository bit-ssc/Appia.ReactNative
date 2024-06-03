interface Room {
	_id: string;
	fname: string;
	name: string;
	t: string;
}

interface Users {
	_id: string;
	status: string;
	name: string;
	username: string;
	nickname: string;
}

export interface SearchWithRoomAndUsers {
	room: Room;
	users: Users[];
}
