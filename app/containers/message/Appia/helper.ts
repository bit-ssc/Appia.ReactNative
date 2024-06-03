import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const maxMessageWidth = width - 80;

export const getMaxMessageWidth = () => {
	const { width, height } = Dimensions.get('window');

	if (width > height) {
		return width - 260;
	}

	return width - 80;
};
