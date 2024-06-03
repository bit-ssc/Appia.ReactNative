import React from 'react';

import ExcelIcon from './Excel';
import PdfIcon from './Pdf';
import PptIcon from './Ppt';
import TxtIcon from './Txt';
import UnknownIcon from './Unknown';
import WordIcon from './Word';
import ZipIcon from './Zip';
import Audio from './Audio';
import VideoIcon from './Video';
import ImageIcon from './Image';
import FolderIcon from './Folder';
import CloudExcelIcon from './CloudExcel';
import CloudPptIcon from './CloudPpt';
import CloudWordIcon from './CloudWord';

const typeMap = {
	excel: ExcelIcon,
	cloudexcel: CloudExcelIcon,
	pdf: PdfIcon,
	ppt: PptIcon,
	cloudppt: CloudPptIcon,
	txt: TxtIcon,
	word: WordIcon,
	cloudword: CloudWordIcon,
	zip: ZipIcon,
	audio: Audio,
	video: VideoIcon,
	image: ImageIcon,
	folder: FolderIcon,
	unknown: UnknownIcon
};

const extensionMap: Record<string, string> = {};

[
	['excel', 'xls,xlsx,spreadsheet'],
	['pdf', 'pdf'],
	['ppt', 'ppt,pptx,presentation'],
	['txt', 'txt,document'],
	['word', 'doc,docx,documentPro'],
	['zip', 'zip,rar,tar.gz,apk'],
	['audio', 'm4a,mp3,audio/aac'],
	['image', 'png,jpg,jpeg'],
	['video', 'mp4,mov'],
	['folder', 'folder']
].forEach(([key, names]) => {
	names.split(',').forEach(name => {
		extensionMap[name] = key;
	});
});

interface IFileIcon {
	fileName: string;
	fontSize?: number;
	isCloud?: boolean;
}

const FileIcon = ({ fileName = '', fontSize = 32, isCloud = false }: IFileIcon) => {
	// @ts-ignore
	let fileType = extensionMap[fileName?.trim().split('.').pop().toLocaleLowerCase()] || 'unknown';
	if (isCloud) {
		if (!fileType.match('unknown')) {
			const ft = `cloud${fileType}`;
			// @ts-ignore
			if (typeMap[ft]) {
				fileType = ft;
			}
		}
	}

	// @ts-ignore
	const Com = typeMap[fileType];
	return <Com fontSize={fontSize} />;
};

export default FileIcon;
