import fetch from '../../lib/methods/helpers/fetch';
import { store as reduxStore } from '../../lib/store/auxStore';
import TokenManager from './tokenManager';

const api = 'shengwang-server.appia.vip';
const Server = {
	getApi() {
		if (reduxStore.getState().server.server.match('.dev.')) {
			console.info('测试环境');
			return 'shengwang-server-qa.appia.vip';
		}
		console.info('正式环境');
		return api;
	},

	updateChannelStatus(recordId, status, org) {
		return new Promise((resolve, reject) => {
			TokenManager.getInstance()
				.getToken()
				.then(token => {
					const url = `https://${this.getApi()}/api/v1/oncall/record/status/update?`;
					fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							org,
							token
						},
						body: JSON.stringify({
							recordId,
							status
						})
					})
						.then(res => res.json())
						.then(res => {
							resolve(res);
						});
				})
				.catch(error => {
					reject(error);
				});
		});
	},
	informServer(channelId, initiator, initiatorAppiaId, initiatorUid, org, receivers, roomId, roomType) {
		return new Promise((resolve, reject) => {
			TokenManager.getInstance()
				.getToken()
				.then(token => {
					const url = `https://${this.getApi()}/api/v1/oncall/init?`;
					fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							org,
							token
						},
						body: JSON.stringify({
							channelId,
							initiator,
							initiatorAppiaId,
							initiatorUid,
							org,
							receivers,
							roomId,
							roomType
						})
					})
						.then(res => res.json())
						.then(res => {
							resolve(res);
						});
				})
				.catch(error => {
					reject(error);
				});
		});
	},
	getCurrentRecord(userName, org, token) {
		const url = `https://${this.getApi()}/api/v1/oncall/user/current/record?username=${userName}&org=${org}`;
		console.log('fetchToken', url);
		return fetch(url, {
			method: 'GET',
			headers: {
				org,
				token
			}
		})
			.then(res => res.json())
			.then(res => res);
	},
	getStateOfChannel(recordId, org, token) {
		const url = `https://${this.getApi()}/api/v1/oncall/record/status?recordId=${recordId}`;
		return fetch(url, {
			method: 'GET',
			headers: {
				org,
				token
			}
		})
			.then(res => res.json())
			.then(res => res);
	},
	fetchShengWangToken(channelId, uid, org) {
		return new Promise((resolve, reject) => {
			TokenManager.getInstance()
				.getToken()
				.then(token => {
					const url = `https://${this.getApi()}/api/v1/token?channelName=${channelId}&uid=${uid}`;
					fetch(url, {
						method: 'GET',
						headers: {
							org,
							'X-Auth-Token': token
						}
					})
						.then(res => res.json())
						.then(res => {
							resolve(res);
						})
						.catch(error => {
							reject(error);
						});
				})
				.catch(error => {
					reject(error);
				});
		});
	},
	getAuthCode(userId, token) {
		return fetch(`${reduxStore.getState().server.server}/api/v1/users.externalToken`, {
			method: 'GET',
			headers: {
				'X-User-Id': userId,
				'X-Auth-Token': token
			}
		})
			.then(res => res.json())
			.then(res => res);
	},
	leaveChannel(org, recordId, username) {
		return new Promise((resolve, reject) => {
			TokenManager.getInstance()
				.getToken()
				.then(token => {
					const url = `https://${this.getApi()}/api/v1/oncall/user/leave`;
					fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							org,
							token
						},
						body: JSON.stringify({
							org,
							recordId,
							username
						})
					})
						.then(res => res.json())
						.then(res => {
							resolve(res);
						});
				})
				.catch(error => {
					reject(error);
				});
		});
	},
	joinChannel(org, recordId, username, userUid) {
		const url = `https://${this.getApi()}/api/v1/oncall/user/join`;
		const data = userUid
			? {
					org,
					recordId,
					username,
					userUid
			  }
			: {
					org,
					recordId,
					username
			  };
		TokenManager.getInstance()
			.getToken()
			.then(token => {
				fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						org,
						token
					},
					body: JSON.stringify(data)
				})
					.then(res => res.json())
					.then(res => {
						console.info('joinChannel', res);
					});
			});
	},
	rejectCall(org, recordId, username) {
		return new Promise((resolve, reject) => {
			TokenManager.getInstance()
				.getToken()
				.then(token => {
					const url = `https://${this.getApi()}/api/v1/oncall/user/reject`;
					fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							org,
							token
						},
						body: JSON.stringify({
							org,
							recordId,
							username
						})
					})
						.then(res => res.json())
						.then(res => {
							resolve(res);
						})
						.catch(error => {
							reject(error);
						});
				})
				.catch(error => {
					reject(error);
				});
		});
	},
	notifyHost(org, recordId, username) {
		return new Promise((resolve, reject) => {
			const url = `https://${this.getApi()}/api/v1/oncall/user/get/notify`;
			fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					org
				},
				body: JSON.stringify({
					org,
					recordId,
					username
				})
			})
				.then(res => res.json())
				.then(res => {
					resolve(res);
				})
				.catch(error => {
					reject(error);
				});
		});
	}
};
export default Server;
