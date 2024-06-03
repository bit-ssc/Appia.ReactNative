import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';

import ActivityIndicator from '../containers/ActivityIndicator';
import { getFanweiHeaderToken } from '../lib/services/restApi';

interface IFanwei {
	uri: string;
	approved: () => void;
}
const FanweiOA = ({ uri, approved }: IFanwei) => {
	const [token, setToken] = useState<string>('');

	useEffect(() => {
		getFanweiHeaderToken().then(res => {
			setToken(res);
		});
	}, []);
	if (!token) {
		return null;
	}
	const injectedJavaScript = `
;(function () {
    var send = window.XMLHttpRequest.prototype.send;

    window.XMLHttpRequest.prototype.send = function () {
        this.setRequestHeader('WEAVERTOKEN', '${token}')
        send.apply(this, Array.prototype.slice.call(arguments))
    };
    var originFetch = window.fetch;
    window.fetch = function (resource, options) {
        var params = options || {};
        var headers = params.headers || {};
        headers['WEAVERTOKEN'] = '${token}';
        params.headers = headers;

        return originFetch(resource, params)
    };
})();
`;

	return (
		<WebView
			style={{ flex: 0, minHeight: '100%' }}
			containerStyle={{ marginBottom: 1 }}
			source={{
				uri,
				headers: {
					Weavertoken: token
				}
			}}
			startInLoadingState={true}
			// sharedCookiesEnabled={true}
			originWhitelist={['http://*', 'https://*', 'wemeet://*']}
			renderLoading={() => <ActivityIndicator />}
			injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
			allowsLinkPreview={true}
			onShouldStartLoadWithRequest={request => {
				const { url } = request;

				// 泛微流程中自建流程提交后进行拦截
				if (url.includes('static4mobile') && url.includes('#/center/doing')) {
					approved();
					// setLoading(true);
					// setTimeout(() => {
					// 	goBack(navigation);
					// 	setLoading(false);
					// 	showToast('提交成功');
					// }, 1500);
					// setTimeout(() => {
					// 	const ww: WebView = temp.current.wv;
					// 	ww?.injectJavaScript(getInjectableJSMessage({ type: 'refreshApproveList' }));
					// }, 2500);
					// return false;
				}

				return true;
			}}
		/>
	);
};

export default FanweiOA;
