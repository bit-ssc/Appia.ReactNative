import React from 'react';
import { connect } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/core';
import { FlatList, Keyboard, NativeModules, Text, View } from 'react-native';
import { Checkbox } from 'react-native-ui-lib';
import * as WebBrowser from 'expo-web-browser';
import Touchable from 'react-native-platform-touchable';
import DocumentPicker from 'react-native-document-picker';
import ModalDropdown from 'react-native-modal-dropdown';

import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { TSupportedThemes, withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import { withActionSheet } from '../../containers/ActionSheet';
import { ChatsStackParamList } from '../../stacks/types';
import { attachmentToPhoto, IApplicationState, IAttachment } from '../../definitions';
import FilePickerView from './FilePickerView';
import sdk from '../../lib/services/sdk';
import styles from './styles';
import { themes } from '../../lib/constants';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { BackButton } from '../../containers/HeaderButton';
import Button from '../../containers/Button';
import { showToast } from '../../lib/methods/helpers/showToast';
import { formatAttachmentUrl } from '../../lib/methods/helpers/formatAttachmentUrl';
import { isAndroid, isIOS } from '../../utils/deviceInfo';
import { createPreviewGetFileId, fileDownloadAndPreview } from '../../utils/fileDownload';
import EventEmitter from '../../utils/events';
import { LISTENER } from '../../containers/Toast';
import I18n from '../../i18n';
import { CustomIcon } from '../../containers/CustomIcon';
import log, { events, logEvent } from '../../utils/log';

const QUERY_SIZE = 50;

interface IHolder {
	label: string;
	value: string;
	icon: string;
}
const FILE_HOLDER: IHolder[] = [
	{
		label: I18n.t('Files_In_Chat'),
		value: 'chat',
		icon: 'giphy-monochromatic'
	},
	{
		label: I18n.t('Files_In_Local'),
		value: 'local',
		icon: 'card'
	}
];

interface IDocumentPickerViewProps {
	user: {
		id: string;
		username: string;
		token: string;
	};
	baseUrl: string;
	navigation: CompositeNavigationProp<
		StackNavigationProp<ChatsStackParamList, 'DocumentPickerView'>,
		StackNavigationProp<MasterDetailInsideStackParamList>
	>;
	route: RouteProp<ChatsStackParamList, 'DocumentPickerView'>;
	theme: TSupportedThemes;
	enterpriseId: string;
	shimoWebUrl: string;
}

interface IDocumentPickerViewState {
	files: string[];
	selected: Set<string>;
	loading: boolean;
	callback: Function;
	spinner: boolean;
}

interface IFile {
	_id: string;
	name: string;
	size: number;
	type: string;
	uploadedAt: string;
	url: string;
	path: string;
	typeGroup: string;
	user: {
		_id: string;
		username: string;
		name: string;
	};
}

class DocumentPickerView extends React.Component<IDocumentPickerViewProps, IDocumentPickerViewState> {
	private fileMap: Record<string, IFile>;
	private selectedArray: Set<IFile>;
	private modal: any;

	constructor(props: IDocumentPickerViewProps) {
		super(props);
		this.setHeader();
		this.state = {
			files: [],
			loading: false,
			selected: new Set(),
			callback: this.props.route.params.callback,
			spinner: false
		};
		this.fileMap = {};
		this.selectedArray = new Set();
		this.modal = React.createRef();
		this.getCurrentFiles();
	}

	showDetailFile = async (item: IFile) => {
		if (item === null) return;

		const { user, enterpriseId, theme, baseUrl, shimoWebUrl } = this.props;
		const attachment = {
			title: item.name,
			title_link: item.path
		} as IAttachment;

		// @ts-ignore
		const url = formatAttachmentUrl(item.url, user.id, user.token);
		if (item.type.indexOf('video') !== -1 || item.type.indexOf('audio') !== -1) {
			if (isIOS) {
				Keyboard.dismiss();
			}
			attachment.video_url = item.path;
			const photo = attachmentToPhoto(attachment);
			const JSToNativeManager = NativeModules?.JSToNativeManager;
			JSToNativeManager.showPhoto(photo);
			return;
		}

		this.setState(
			{
				spinner: true
			},
			() => {
				console.log('spinner open', this.state.spinner);
			}
		);

		if (!isAndroid) {
			await fileDownloadAndPreview(url, attachment).finally(() => {
				this.setState(
					{
						spinner: false
					},
					() => {
						console.log('spinner close', this.state.spinner);
					}
				);
			});
		} else {
			const shimoWeb = shimoWebUrl || 'https://shimo-web.sophmain.vip';
			const downloadUrl = `${baseUrl}/file-proxy/${item._id}/${item.name}`;
			const result = await createPreviewGetFileId(
				this.findFileType(attachment.title_link || '') || '',
				this.findFileName(attachment.title || '未命名文件'),
				downloadUrl,
				attachment.file_size || 0
			);

			this.setState({
				spinner: false
			});

			if (result.code === '0') {
				const { data } = result;
				const docUrl = `${shimoWeb}/clouddocument/${data.fileId}?&org=${enterpriseId}&source=appia&type=preview&token=${user.token}&userId=${user.id}`;
				WebBrowser.openBrowserAsync(docUrl, {
					toolbarColor: themes[theme].headerBackground,
					controlsColor: themes[theme].headerTintColor,
					enableBarCollapsing: true,
					showTitle: true
				});
			} else {
				EventEmitter.emit(LISTENER, { message: I18n.t('Error_Download_file') });
			}
		}
	};

	chooseFileFromLocal = async () => {
		const { callback } = this.state;
		try {
			const res = await DocumentPicker.pickSingle({
				type: [DocumentPicker.types.allFiles]
			});

			if (isIOS) {
				this.modal.current && this.modal.current.hide();
			}
			if (res.size === 0) {
				showToast('不能选择0KB的文件');
				return;
			}
			const file = {
				filename: res.name,
				size: res.size,
				mime: res.type,
				path: res.uri
			};
			callback && callback([file]);
			return res;
		} catch (e) {
			console.log(e);
			if (!DocumentPicker.isCancel(e)) {
				logEvent(events.ROOM_BOX_ACTION_FILE_F);
				log(e);
			}
		}
	};

	findFileType = (url: string) => url.split('.').pop();

	findFileName = (title: string) => {
		const index = title.lastIndexOf('.');
		if (index === -1) {
			return title;
		}
		return title.substring(0, index);
	};

	getCurrentFiles = async () => {
		const { files } = this.state;
		const set = new Set(files);
		this.setState({
			loading: true
		});
		try {
			// @ts-ignore
			const result = await sdk.get('users.files', {
				count: QUERY_SIZE,
				offset: files.length,
				sort: { uploadedAt: -1 },
				query: {
					typeGroup: 'all',
					name: { $regex: '', $options: 'i' }
				}
			});

			if (result.success) {
				// @ts-ignore
				result.files?.forEach((file: IFile) => {
					set.add(file._id);
					this.fileMap[file._id] = file;
				});
			}
			this.setState({
				files: Array.from(set),
				loading: false
			});
		} catch (error) {
			console.info('error', error);
			this.setState({
				files: Array.from(set),
				loading: false
			});
		}
	};

	renderItem = (item: any) => {
		const id = item?.item;
		const file = this.fileMap[id];
		return (
			<Touchable onPress={() => this.showDetailFile(file)}>
				<View style={styles.container}>
					<FilePickerView
						sender={file.user?.name || ''}
						date={file.uploadedAt}
						fileName={file.name}
						fileSize={file.size}
					></FilePickerView>
					<Checkbox
						value={this.state.selected.has(id)}
						style={styles.checkbox}
						onValueChange={() => this.chooseFile(id, file)}
						iconColor={'#ffffff'}
						color={'#2878FF'}
						borderRadius={50}
					></Checkbox>
				</View>
			</Touchable>
		);
	};

	chooseFile = (id: string, file: IFile) => {
		if (this.state.selected.size >= 9 && !this.state.selected.has(id)) {
			showToast('最多只能选择9个文件');
			this.setHeader();
		} else {
			this.setState(
				prevState => {
					const set = new Set(prevState.selected);
					if (set.has(id)) {
						set.delete(id);
						this.selectedArray.delete(file);
					} else {
						set.add(id);
						this.selectedArray.add(file);
					}
					return {
						selected: new Set(set)
					};
				},
				() => {
					this.setHeader();
				}
			);
		}
	};

	sendFiles = (files: Set<IFile>) => {
		if (!files || files.size <= 0) return null;

		const attachments = new Set();
		// @ts-ignore
		files.forEach(value => {
			const file = {
				filename: value.name,
				size: value.size,
				mime: value.type,
				path: value.url
			};
			attachments.add(file);
			// @ts-ignore
			sdk
				.post('file.forward', {
					uploadId: value._id,
					content: '',
					toUserNames: [this.props.route.params.room?._raw.name]
				})
				.then(r => console.info('send file in chat ', r));
		});
		this.props.navigation.pop();
	};

	setHeader = () => {
		const { navigation } = this.props;
		navigation.setOptions({
			headerTitleAlign: 'center',
			title: '',
			headerLeft: () => this.renderHeaderLeft(),
			headerRight: () => this.renderHeaderRight()
		});
	};

	renderHeaderLeft = () => {
		const { navigation } = this.props;
		return (
			<View style={styles.leftContainer}>
				<ModalDropdown
					ref={this.modal}
					isFullWidth={true}
					options={FILE_HOLDER.map(item => item.label)}
					dropdownStyle={styles.dropdownView}
					renderRow={(item, index) => this.renderRow(item, index as unknown as number)}
					showsVerticalScrollIndicator={false}
				>
					<View style={[{ flexDirection: 'row' }]}>
						<BackButton navigation={navigation} />
						<View style={[styles.leftButton]}>
							<Text style={styles.holderText}> {I18n.t('Files_In_Chat')} </Text>
							<CustomIcon name='chevron-down' size={20} color={'#000000'} style={[styles.dropIcon]} />
						</View>
					</View>
				</ModalDropdown>
			</View>
		);
	};

	renderRow = (item: any, index: number) => (
		<Touchable
			onPress={() => {
				this.chooseFileHolder(index);
			}}
		>
			<View style={styles.dropItemView}>
				{/* <CustomIcon name={FILE_HOLDER[index].icon} size={30} color={'#000'} style={styles.dropItemIcon} /> */}
				<Text style={styles.dropItemText}>{item}</Text>
			</View>
		</Touchable>
	);

	chooseFileHolder = (index: number) => {
		if (FILE_HOLDER[index].value === 'local') {
			this.chooseFileFromLocal().then(res => {
				if (res) {
					this.props.navigation.pop();
				}
			});
		} else if (FILE_HOLDER[index].value === 'chat') {
			// todo something
			this.modal.current && this.modal.current.hide();
		}
		if (!isIOS) {
			this.modal.current && this.modal.current.hide();
		}
	};

	renderHeaderRight = () => {
		const unSend = !this.state.selected || this.state.selected.size === 0;
		return (
			<Button
				style={unSend ? styles.unSend : styles.send}
				title={unSend ? '发送' : `发送(${this.selectedArray.size}/9)`}
				onPress={() => this.sendFiles(this.selectedArray)}
			/>
		);
	};

	render() {
		const { files, loading } = this.state;
		const { theme } = this.props;
		return (
			<FlatList
				data={files}
				renderItem={item => this.renderItem(item as unknown as string)}
				style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
				onEndReached={this.getCurrentFiles}
				ListFooterComponent={loading ? <ActivityIndicator /> : null}
			/>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	serverVersion: state.server.version,
	baseUrl: state.server.server,
	user: getUserSelector(state),
	customEmojis: state.customEmojis,
	useRealName: state.settings.UI_Use_Real_Name,
	isMasterDetail: state.app.isMasterDetail,
	enterpriseId: state.settings.Enterprise_ID,
	shimoWebUrl: state.settings.Shimo_Web_Url
});

export default connect(mapStateToProps)(withTheme(withActionSheet(DocumentPickerView)));
