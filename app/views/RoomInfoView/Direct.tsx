import React from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import { useSelector } from 'react-redux';

import { TSupportedThemes } from '../../theme';
import { IUserParsed } from '.';
import I18n from '../../i18n';
import { EmailIcon, DepartmentIcon, JobNumberIcon, ResumeIcon } from '../../containers/SvgIcons';
import styles from './styles';
import { themes } from '../../lib/constants';
import { openWebview } from '../../utils/openLink';

const renderListItem = (
	title: string,
	text: string | undefined,
	icon: React.ReactElement,
	isLast?: boolean,
	employeeType?: string
) => (
	<View style={[styles.listItem, isLast && styles.lastListItem]}>
		<View style={styles.listItemTitleBox}>
			<View style={styles.listItemIcon}>{icon}</View>
			<Text style={styles.listItemTitle}>{I18n.t(title)}：</Text>
		</View>
		<Text style={styles.listItemText} numberOfLines={0}>
			{text}
		</Text>
		{employeeType && (
			<View style={styles.workerType}>
				<Text style={styles.workerTypeText}>{employeeType}</Text>
			</View>
		)}
	</View>
);

const Direct: React.FC<{ user: IUserParsed; theme: TSupportedThemes }> = ({ user, theme }) => {
	const u = useSelector(state => state.contacts.userMap[user.username]);
	const employeeType = user.employeeStatus === '离职' ? user.employeeStatus : user.employeeType;

	return (
		<View style={[styles.box, styles.directAvatar, { backgroundColor: themes[theme].backgroundColor }]}>
			<View style={styles.listInfo}>
				<View style={styles.cardTitle}>
					<Text style={styles.cardTitleText}>个人信息</Text>
				</View>
				{Boolean(user.jobName) && renderListItem('Job_Name', user.jobName, <JobNumberIcon />, false, employeeType)}
				{Boolean(u?.departmentNames.length) && renderListItem('Department', u.departmentNames.join('\n'), <DepartmentIcon />)}
				{/* {Boolean(user.employeeID) && renderListItem('Employee_Number', user.employeeID, <JobNumberIcon />)}*/}
				{/* {Boolean(user.employeeID) && renderListItem('Employee_Location', user.workPlaceName, <LocationIcon />, true)}*/}
				{Boolean(user.emails?.length) &&
					renderListItem('Email', user.emails?.map(email => email.address).join('\n'), <EmailIcon />, !user.canViewResume)}
				{user.canViewResume && (
					<View style={[styles.listItem, styles.lastListItem]}>
						<View style={styles.listItemTitleBox}>
							<View style={styles.listItemIcon}>
								<ResumeIcon />
							</View>
							<Text style={styles.listItemTitle}>{I18n.t('Personal_Resume')}：</Text>
						</View>
						{user.resumeDownloadUrl?.length ? (
							<TouchableWithoutFeedback
								onPress={() => {
									openWebview(`https:${user.resumeDownloadUrl}`, { title: I18n.t('Personal_Resume') });
								}}
							>
								<Text style={styles.highlightText}>{I18n.t('View_Resume')}</Text>
							</TouchableWithoutFeedback>
						) : (
							<Text style={styles.greyText}>{I18n.t('None_Resume')}</Text>
						)}
					</View>
				)}
			</View>
		</View>
	);
};

export default Direct;
