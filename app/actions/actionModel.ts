const REQUEST = 'REQUEST';
const SUCCESS = 'SUCCESS';
const FAILURE = 'FAILURE';
const defaultTypes = [REQUEST, SUCCESS, FAILURE];

function createRequestTypes(base = {}, types = defaultTypes): Record<string, string> {
	const res: Record<string, string> = {};
	types.forEach(type => (res[type] = `${base}_${type}`));
	return res;
}

export const MODEL = createRequestTypes('MODEL', ['CLOSE_MODEL', 'OPEN_MODEL']);
