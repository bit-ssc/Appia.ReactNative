import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';

import ActivityIndicator from '../containers/ActivityIndicator';
import { getFanweiHeaderToken } from '../lib/services/restApi';

interface IFanwei {
	uri: string;
}
const FanweiOAiOS = ({ uri }: IFanwei) => {
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
					Weavertoken: token,
					iosUrlScheme: '1'
				}
			}}
			startInLoadingState={true}
			// sharedCookiesEnabled={true}
			originWhitelist={['http://*', 'https://*', 'wemeet://*']}
			renderLoading={() => <ActivityIndicator />}
			injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
			allowsLinkPreview={true}
		/>
	);
};

export default FanweiOAiOS;
