// version: 5.0.1
import { NativeModules, Platform } from 'react-native';

const TD = NativeModules.TalkingDataSDK;
const { TalkingDataProfileType } = NativeModules;
const { TalkingDataGender } = NativeModules;

class TalkingDataProfile {
	// constructor() {
	// 	}

	setName(name) {
		this.name = name;
	}

	setType(type) {
		this.type = type;
	}

	setGender(gender) {
		this.gender = gender;
	}

	setAge(age) {
		this.age = age;
	}

	setProperty1(value) {
		this.value1 = value;
	}

	setProperty2(value) {
		this.value2 = value;
	}

	setProperty3(value) {
		this.value3 = value;
	}

	setProperty4(value) {
		this.value4 = value;
	}

	setProperty5(value) {
		this.value5 = value;
	}

	setProperty6(value) {
		this.value6 = value;
	}

	setProperty7(value) {
		this.value7 = value;
	}

	setProperty8(value) {
		this.value8 = value;
	}

	setProperty9(value) {
		this.value9 = value;
	}

	setProperty10(value) {
		this.value10 = value;
	}

	get profileString() {
		return JSON.stringify({
			name: this.name,
			type: this.type,
			gender: this.gender,
			age: this.age,
			value1: this.value1,
			value2: this.value2,
			value3: this.value3,
			value4: this.value4,
			value5: this.value5,
			value6: this.value6,
			value7: this.value7,
			value8: this.value8,
			value9: this.value9,
			value10: this.value10
		});
	}
}

class TalkingDataOrder {
	constructor(orderId, total, currencyType) {
		this.orderId = orderId;
		this.total = total;
		this.currencyType = currencyType;
		this.items = [];
	}

	addItem(itemId, category, name, unitPrice, amount) {
		this.items.push({ itemId, category, name, unitPrice, amount });
	}

	get orderString() {
		return JSON.stringify({
			orderId: this.orderId,
			total: this.total,
			currencyType: this.currencyType,
			items: this.items
		});
	}
}

class TalkingDataShoppingCart {
	constructor() {
		this.items = [];
	}

	addItem(itemId, category, name, unitPrice, amount) {
		this.items.push({ itemId, category, name, unitPrice, amount });
	}

	get shoppingCartString() {
		return JSON.stringify({
			items: this.items
		});
	}
}

class TalkingDataSearch {
	constructor() {
		this.custom = new Object();
	}

	setCategory(category) {
		this.category = category;
	}

	setContent(content) {
		this.content = content;
	}

	setDestination(destination) {
		this.destination = destination;
	}

	setOrigin(origin) {
		this.origin = origin;
	}

	setItemId(item_id) {
		this.item_id = item_id;
	}

	setItemLocationId(item_location_id) {
		this.item_location_id = item_location_id;
	}

	setStartDate(start_date) {
		this.start_date = start_date;
	}

	setEndDate(end_date) {
		this.end_date = end_date;
	}

	get adSearchString() {
		return JSON.stringify({
			category: this.category,
			content: this.content,
			destination: this.destination,
			origin: this.origin,
			item_id: this.item_id,
			item_location_id: this.item_location_id,
			start_date: this.start_date,
			end_date: this.end_date
		});
	}
}

class TalkingDataTransaction {
	// constructor() {

	// }

	setTransactionId(transactionId) {
		this.transactionId = transactionId;
	}

	setCategory(category) {
		this.category = category;
	}

	setAmount(amount) {
		this.amount = amount;
	}

	setPersonA(personA) {
		this.personA = personA;
	}

	setPersonB(personB) {
		this.personB = personB;
	}

	setStartDate(startDate) {
		this.startDate = startDate;
	}

	setEndDate(endDate) {
		this.endDate = endDate;
	}

	setCurrencyType(currencyType) {
		this.currencyType = currencyType;
	}

	setContent(content) {
		this.content = content;
	}

	get transactionStr() {
		return JSON.stringify({
			transactionId: this.transactionId,
			category: this.category,
			amount: this.amount,
			personA: this.personA,
			personB: this.personB,
			startDate: this.startDate,
			endDate: this.endDate,
			currencyType: this.currencyType,
			content: this.content
		});
	}
}

class TalkingDataSDK {
	static init(appId, channelId, custom) {
		TD.init(appId, channelId, custom);
	}

	/**
	 * 获取SDK所使用Device的ID
	 * iOS Android
	 * @return {string} deviceID
	 */
	static getDeviceID(callback) {
		TD.getDeviceID().then(callback);
	}

	/**
	 * 获取SDK所使用Device的ID
	 * iOS Android
	 * @return {string} OAID
	 */
	static getOAID(callback) {
		if (Platform.OS === 'android') {
			TD.getOAID().then(callback);
		}
	}

	/**
	 * 设置经纬度
	 * iOS only
	 * @param {number} lat
	 * @param {number} lnt
	 */
	static setLocation(lat, lnt) {
		if (typeof lat !== 'number') {
			return;
		}
		if (typeof lnt !== 'number') {
			return;
		}
		if (Platform.OS === 'ios') {
			TD.setLatitude(lat, lnt);
		}
	}

	/**
	 * 记录事件
	 * iOS Android
	 * @param {string} eventName 事件名称
	 * @param {object} parameters 事件标签(自定义)
	 */
	static onEvent(eventName, parameters) {
		TD.onEvent(eventName, parameters);
	}

	/**
	* 添加全局的字段，这里的内容会每次的自定义事都会带着，发到服务器。
	也就是说如果您的自定义事件中每一条都需要带同样的内容，如用户名称等，就可以添加进去
	* iOS Android
	* @param {string} k 全局的key，string类型。
	* @param {any} v 全局的value，任意类型。
	*/
	static setGlobalKV(k, v) {
		if (typeof k !== 'string') {
			return;
		}
		if (Platform.OS === 'ios') {
			TD.setGlobalKV(k, v);
		} else if (Platform.OS === 'android') {
			switch (typeof v) {
				case 'number':
					TD.setGlobalKVDouble(k, v);
					break;
				case 'string':
					TD.setGlobalKVString(k, v);
					break;
				case 'boolean':
					TD.setGlobalKVBoolean(k, v);
					break;
				case 'object':
					if (v instanceof Array) {
						TD.setGlobalKVArray(k, v);
					} else {
						TD.setGlobalKVMap(k, v);
					}
					break;
				default:
					TD.setGlobalKVMap(k, { v });
			}
		}
	}

	/**
	 * 删除全局数据
	 * iOS Android
	 * @param {string} k 全局的key，string类型。
	 */
	static removeGlobalKV(k) {
		if (typeof k !== 'string') {
			return;
		}
		TD.removeGlobalKV(k);
	}

	/**
	 * 开始跟踪某一页面，记录页面打开时间。
	 * iOS Android
	 * @param {string} pageName 页面名称。
	 */
	static onPageBegin(pageName) {
		if (typeof pageName !== 'string') {
			return;
		}
		TD.onPageBegin(pageName);
	}

	/**
	 * 结束跟踪某一页面，记录页面关闭时间。
	 * iOS Android
	 * @param {string} pageName 页面名称。
	 */
	static onPageEnd(pageName) {
		if (typeof pageName !== 'string') {
			return;
		}
		TD.onPageEnd(pageName);
	}

	static onReceiveDeepLink(link) {
		TD.onReceiveDeepLink(link);
	}

	/**
	 * 注册
	 * iOS Android
	 * @param {string} profileId 账户ID
	 * @param {TalkingDataProfileType} profileType 账户类型 详见
	 * @param {string} name 账户昵称
	 * @param {string} invitationCode 邀请码
	 */
	static onRegister(profileId, profile, invitationCode) {
		TD.onRegister(profileId, profile, invitationCode);
	}

	/**
	 * 登录
	 * iOS Android
	 * @param {string} profileId 账户ID
	 * @param {TalkingDataProfileType} profileType 账户类型 详见
	 * @param {string} name 账户昵称
	 */
	static onLogin(profileId, profile) {
		TD.onLogin(profileId, profile);
	}

	static onProfileUpdate(profile) {
		TD.onProfileUpdate(profile);
	}

	static onCreateCard(profile, method, content) {
		if (typeof profile !== 'string') {
			return;
		}
		if (typeof method !== 'string') {
			return;
		}
		if (typeof content !== 'string') {
			return;
		}
		TD.onCreateCard(profile, method, content);
	}

	static onFavorite(category, content) {
		if (typeof category !== 'string') {
			return;
		}

		if (typeof content !== 'string') {
			return;
		}
		TD.onFavorite(category, content);
	}

	static onShare(profile, content) {
		if (typeof profile !== 'string') {
			return;
		}
		if (typeof content !== 'string') {
			return;
		}
		TD.onShare(profile, content);
	}

	static onPunch(profile, punchId) {
		if (typeof profile !== 'string') {
			return;
		}
		if (typeof punchId !== 'string') {
			return;
		}
		TD.onPunch(profile, punchId);
	}

	static onSearch(adSearch) {
		TD.onSearch(adSearch);
	}

	static onContact(profile, content) {
		if (typeof profile !== 'string') {
			return;
		}

		if (typeof content !== 'string') {
			return;
		}

		TD.onContact(profile, content);
	}

	static onPay(profile, orderId, amount, currencyType, paymentType, itemId, itemcount) {
		if (typeof profile !== 'string') {
			return;
		}
		if (typeof orderId !== 'string') {
			return;
		}
		if (typeof amount !== 'number') {
			return;
		}
		if (typeof currencyType !== 'string') {
			return;
		}
		if (typeof paymentType !== 'string') {
			return;
		}
		TD.onPay(profile, orderId, amount, currencyType, paymentType, itemId, itemcount);
	}

	static onChargeBack(profile, orderId, reason, type) {
		if (typeof profile !== 'string') {
			return;
		}
		if (typeof orderId !== 'string') {
			return;
		}
		if (typeof reason !== 'string') {
			return;
		}
		if (typeof type !== 'string') {
			return;
		}
		TD.onChargeBack(profile, orderId, reason, type);
	}

	static onReservation(profile, reservationId, category, amount, term) {
		if (typeof profile !== 'string') {
			return;
		}
		if (typeof reservationId !== 'string') {
			return;
		}
		if (typeof category !== 'string') {
			return;
		}
		if (typeof amount !== 'number') {
			return;
		}
		if (typeof term !== 'string') {
			return;
		}

		TD.onReservation(profile, reservationId, category, amount, term);
	}

	static onBooking(profile, bookingId, category, amount, content) {
		if (typeof profile !== 'string') {
			return;
		}
		if (typeof bookingId !== 'string') {
			return;
		}
		if (typeof category !== 'string') {
			return;
		}
		if (typeof amount !== 'number') {
			return;
		}
		if (typeof content !== 'string') {
			return;
		}

		TD.onBooking(profile, bookingId, category, amount, content);
	}

	static onViewItem(itemId, category, name, unitPrice) {
		if (typeof itemId !== 'string') {
			return;
		}
		if (typeof category !== 'string') {
			return;
		}
		if (typeof name !== 'string') {
			return;
		}
		if (typeof unitPrice !== 'number') {
			return;
		}
		TD.onViewItem(itemId, category, name, unitPrice);
	}

	static onAddItemToShoppingCart(itemId, category, name, unitPrice, amount) {
		if (typeof itemId !== 'string') {
			return;
		}
		if (typeof category !== 'string') {
			return;
		}
		if (typeof name !== 'string') {
			return;
		}
		if (typeof unitPrice !== 'number') {
			return;
		}
		if (typeof amount !== 'number') {
			return;
		}
		TD.onAddItemToShoppingCart(itemId, category, name, unitPrice, amount);
	}

	static onViewShoppingCart(shoppingCart) {
		if (typeof shoppingCart !== 'string') {
			return;
		}
		TD.onViewShoppingCart(shoppingCart);
	}

	/**
	* 下单。
	* iOS Android
	* @param {string} profileId 账户ID
	* @param {object} order 订单对象
	* order 订单对象
		{
			orderId(string) 订单id
			total(number) 订单总价
			currencyType(string) 币种
			category(string) 商品类别

		}
	*/
	static onPlaceOrder(profileId, order) {
		if (typeof profileId !== 'string') {
			return;
		}
		if (typeof order !== 'string') {
			return;
		}
		TD.onPlaceOrder(profileId, order);
	}

	static onOrderPaySucc(order, paymentType, profile) {
		if (typeof order !== 'string') {
			return;
		}
		if (typeof paymentType !== 'string') {
			return;
		}
		if (typeof profile !== 'string') {
			return;
		}
		TD.onOrderPaySucc(order, paymentType, profile);
	}

	static onCancelOrder(order) {
		if (typeof order !== 'string') {
			return;
		}
		TD.onCancelOrder(order);
	}

	static onCredit(profile, amount, content) {
		if (typeof profile !== 'string') {
			return;
		}
		if (typeof amount !== 'number') {
			return;
		}
		if (typeof content !== 'string') {
			return;
		}
		TD.onCredit(profile, amount, content);
	}

	static onTransaction(profile, transactionStr) {
		if (typeof profile !== 'string') {
			return;
		}

		if (typeof transactionStr !== 'string') {
			return;
		}

		TD.onTransaction(profile, transactionStr);
	}

	/**
	 * 创建角色
	 * iOS Android
	 * @param {string} name 角色名称
	 */
	static onCreateRole(rolename) {
		if (typeof rolename !== 'string') {
			return;
		}
		TD.onCreateRole(rolename);
	}

	static onLevelPass(profile, levelId) {
		if (typeof profile !== 'string') {
			return;
		}
		if (typeof levelId !== 'string') {
			return;
		}
		TD.onLevelPass(profile, levelId);
	}

	static onGuideFinished(profile, content) {
		if (typeof profile !== 'string') {
			return;
		}
		if (typeof content !== 'string') {
			return;
		}
		TD.onGuideFinished(profile, content);
	}

	static onLearn(profile, course, begin, duration) {
		if (typeof profile !== 'string') {
			return;
		}

		if (typeof course !== 'string') {
			return;
		}

		if (typeof begin !== 'number') {
			return;
		}

		if (typeof duration !== 'number') {
			return;
		}
		TD.onLearn(profile, course, begin, duration);
	}

	static onPreviewFinished(profile, content) {
		if (typeof profile !== 'string') {
			return;
		}
		if (typeof content !== 'string') {
			return;
		}
		TD.onPreviewFinished(profile, content);
	}

	static onRead(profile, book, begin, duration) {
		if (typeof profile !== 'string') {
			return;
		}

		if (typeof book !== 'string') {
			return;
		}

		if (typeof begin !== 'number') {
			return;
		}

		if (typeof duration !== 'number') {
			return;
		}
		TD.onRead(profile, book, begin, duration);
	}

	static onFreeFinished(profile, content) {
		if (typeof profile !== 'string') {
			return;
		}
		if (typeof content !== 'string') {
			return;
		}
		TD.onFreeFinished(profile, content);
	}

	static onAchievementUnlock(profile, achievementId) {
		if (typeof profile !== 'string') {
			return;
		}
		if (typeof achievementId !== 'string') {
			return;
		}
		TD.onAchievementUnlock(profile, achievementId);
	}

	static onBrowse(profile, content, begin, duration) {
		if (typeof profile !== 'string') {
			return;
		}

		if (typeof content !== 'string') {
			return;
		}

		if (typeof begin !== 'number') {
			return;
		}

		if (typeof duration !== 'number') {
			return;
		}
		TD.onBrowse(profile, content, begin, duration);
	}

	static onTrialFinished(profile, content) {
		if (typeof profile !== 'string') {
			return;
		}
		if (typeof content !== 'string') {
			return;
		}
		TD.onTrialFinished(profile, content);
	}
}

export {
	TalkingDataSDK,
	TalkingDataProfile,
	TalkingDataProfileType,
	TalkingDataGender,
	TalkingDataOrder,
	TalkingDataShoppingCart,
	TalkingDataSearch,
	TalkingDataTransaction
};
