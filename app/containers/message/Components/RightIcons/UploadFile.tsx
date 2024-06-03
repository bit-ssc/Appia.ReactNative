import React, { memo } from 'react';
import { View, Alert, TouchableOpacity } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Svg, { Path } from 'react-native-svg';

import { IAttachment } from '../../../../definitions';
import I18n from '../../../../i18n';

const UploadFile = memo(({ attachments, resendPress }: { attachments?: IAttachment[]; resendPress: () => void }) => {
	let uploadProgress = 0;
	let isFail = false;

	if (attachments && attachments.length > 0) {
		const a = attachments[0];
		if (attachments[0].uploadProgress) {
			uploadProgress = attachments[0].uploadProgress;
		}
		if (a.uploadFail) {
			isFail = true;
		}
	}

	const FailIcon = () => (
		<Svg viewBox='0 0 1024 1024' width='18' height='18'>
			<Path
				d='M512 1024C229.23 1024 0 794.77 0 512S229.23 0 512 0s512 229.23 512 512-229.23 512-512 512z m-54.422-832l20.027 458.936h68.79L566.422 192H457.578z m53.987 511.82c-17.415 0-32.218 5.379-44.409 17.928C454.096 733.4 448 748.638 448 767.462c0 17.927 6.095 33.165 19.156 45.714C479.346 825.726 494.15 832 511.565 832s33.088-6.275 46.15-17.927c12.19-12.55 18.285-27.787 18.285-46.61 0-18.824-6.095-34.062-18.286-45.715-12.19-12.55-27.864-17.927-46.15-17.927z'
				fill='#FF0000'
				p-id='2538'
			></Path>
		</Svg>
	);

	const onErrorPress = () => {
		Alert.alert(
			`${I18n.t('Resend')}?`, // 弹窗标题
			'',
			[
				{
					text: I18n.t('Cancel'),
					onPress: () => console.log('确认操作')
				},
				{
					text: I18n.t('Upload_File_Resend'),
					onPress: () => {
						resendPress();
					}
				}
			],
			{ cancelable: true }
		);
	};

	return (
		<View
			style={{
				height: '100%',
				display: 'flex',
				alignItems: 'flex-end',
				marginLeft: 8,
				flexDirection: 'row',
				alignSelf: 'flex-end'
			}}
		>
			{isFail ? (
				<TouchableOpacity style={{ height: 40, justifyContent: 'center' }} onPress={onErrorPress}>
					{FailIcon()}
				</TouchableOpacity>
			) : (
				<AnimatedCircularProgress
					size={18}
					width={3.5}
					fill={uploadProgress}
					tintColor='#1B5BFF'
					onAnimationComplete={() => console.log('onAnimationComplete')}
					backgroundColor='#BFDAFF'
					style={{ marginLeft: 2, marginBottom: 5 }}
					rotation={0}
				/>
			)}
		</View>
	);
});

export default UploadFile;
