import { store as reduxStore } from '../../lib/store/auxStore';
import sdk from '../../lib/services/sdk';

class TokenManager {
	// 私有静态属性，用于存储类的实例
	static instance = null;

	// 私有属性，用于存储token和过期时间
	token = null;

	expiry = null;

	// 私有构造函数，防止直接实例化
	constructor() {
		if (TokenManager.instance) {
			return TokenManager.instance;
		}
		TokenManager.instance = this;
	}

	// 公有静态方法，用于获取类的实例
	static getInstance() {
		if (!TokenManager.instance) {
			TokenManager.instance = new TokenManager();
		}
		return TokenManager.instance;
	}

	// 判断token是否过期
	isTokenExpired() {
		if (!this.token || !this.expiry) {
			return true;
		}
		return Date.now() > this.expiry;
	}

	// 请求新的token
	fetchNewToken() {
		return new Promise((resolve, reject) => {
			// 这里应该是你的API请求逻辑
			const { userId, authToken } = sdk.current.currentLogin;
			fetch(`${reduxStore.getState().server.server}/api/v1/users.externalToken`, {
				method: 'GET',
				headers: {
					'X-User-Id': userId,
					'X-Auth-Token': authToken
				}
			})
				.then(response => response.json())
				.then(data => {
					if (data.success === true) {
						this.token = data.token;
						// 假设后端返回的token有效期是以天为单位
						this.expiry = Date.now() + 2 * 24 * 60 * 60 * 1000;
						resolve(this.token);
					} else {
						reject(data);
					}
				})
				.catch(error => {
					reject(error);
				});
		});
	}

	// 对外暴露的获取token的方法
	getToken() {
		return new Promise((resolve, reject) => {
			if (!this.isTokenExpired()) {
				resolve(this.token);
			} else {
				this.fetchNewToken().then(resolve).catch(reject);
			}
		});
	}
}

export default TokenManager;
