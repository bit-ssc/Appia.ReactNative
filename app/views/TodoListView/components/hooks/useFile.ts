import { OpenFile } from '../../../../lib/methods/openFile';
import { Attachment } from '../../types';

// 此hook 负责 处理组件传入的数据 并且提供一个可以打开文件的方法 组件直接调用即可
const useFile = (fileItem: Attachment) => {
	const getType = (message: string) => {
		const parts = message && message.split('.');
		const lastPart = parts && parts[parts.length - 1];
		if (lastPart !== undefined) {
			return lastPart.trim();
		}
		return 'file';
	};
	const attachment = {
		title: fileItem.title,
		title_link: fileItem.title_link && fileItem.title_link.trim(),
		type: getType(fileItem.title)
	};
	const openFile = async () => {
		await OpenFile(attachment);
	};
	return { openFile, attachment };
};

export default useFile;
