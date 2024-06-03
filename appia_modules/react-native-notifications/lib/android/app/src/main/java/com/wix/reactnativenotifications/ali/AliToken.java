package com.wix.reactnativenotifications.ali;

import static com.wix.reactnativenotifications.Defs.LOGTAG;
import static com.wix.reactnativenotifications.Defs.TOKEN_RECEIVED_EVENT_NAME;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;

import com.alibaba.sdk.android.push.CloudPushService;
import com.alibaba.sdk.android.push.CommonCallback;
import com.alibaba.sdk.android.push.noonesdk.PushServiceFactory;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;
import com.wix.reactnativenotifications.BuildConfig;
import com.wix.reactnativenotifications.core.JsIOHelper;
import com.wix.reactnativenotifications.fcm.IFcmToken;
import com.wix.reactnativenotifications.fcm.IFcmTokenListenerApplication;
import com.wix.reactnativenotifications.fcm.INotificationsFcmApplication;

public class AliToken implements IFcmToken {

    final protected Context mAppContext;
    final protected JsIOHelper mJsIOHelper;

    protected static String sToken;

    protected AliToken(Context appContext) {
        if (!(appContext instanceof ReactApplication)) {
            throw new IllegalStateException("Application instance isn't a react-application");
        }
        mJsIOHelper = new JsIOHelper();
        mAppContext = appContext;
    }

    public static IFcmToken get(Context context) {
        Context appContext = context.getApplicationContext();
        if (appContext instanceof INotificationsFcmApplication) {
            return ((INotificationsFcmApplication) appContext).getFcmToken(context);
        }
        return new AliToken(appContext);
    }

    @Override
    public void onNewTokenReady() {
        synchronized (mAppContext) {
            refreshToken();
        }
    }

    @Override
    public void onManualRefresh() {
        synchronized (mAppContext) {
            if (sToken == null) {
                if (BuildConfig.DEBUG)
                    Log.i(LOGTAG, "Manual token refresh => asking for new token");
                refreshToken();
            } else {
                if (BuildConfig.DEBUG)
                    Log.i(LOGTAG, "Manual token refresh => publishing existing token (" + sToken + ")");
                sendTokenToJS();
            }
        }
    }

    @Override
    public void onAppReady() {
        synchronized (mAppContext) {
            if (sToken == null) {
                if (BuildConfig.DEBUG) Log.i(LOGTAG, "App initialized => asking for new token");
                refreshToken();
            } else {
                // Except for first run, this should be the case.
                if (BuildConfig.DEBUG)
                    Log.i(LOGTAG, "App initialized => publishing existing token (" + sToken + ")");
                sendTokenToJS();
            }
        }
    }

    protected void refreshToken() {
        CloudPushService pushService = PushServiceFactory.getCloudPushService();
        pushService.register(mAppContext, new CommonCallback() {
            @Override
            public void onSuccess(String s) {
                sToken = pushService.getDeviceId();
                Log.e("dxd", "onSuccess: " + sToken );
                if (mAppContext instanceof IFcmTokenListenerApplication) {
                    ((IFcmTokenListenerApplication) mAppContext).onNewFCMToken(sToken);
                }
                if (BuildConfig.DEBUG) Log.i(LOGTAG, "Ali has a new token" + "=" + sToken);
                sendTokenToJS();

            }

            @Override
            public void onFailed(String s, String s1) {

            }
        });
    }

    protected void sendTokenToJS() {
        final ReactInstanceManager instanceManager = ((ReactApplication) mAppContext).getReactNativeHost().getReactInstanceManager();
        final ReactContext reactContext = instanceManager.getCurrentReactContext();

        // Note: Cannot assume react-context exists cause this is an async dispatched service.
        if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
            Bundle tokenMap = new Bundle();
            tokenMap.putString("deviceToken", sToken);
            mJsIOHelper.sendEventToJS(TOKEN_RECEIVED_EVENT_NAME, tokenMap, reactContext);
        }
    }
}
