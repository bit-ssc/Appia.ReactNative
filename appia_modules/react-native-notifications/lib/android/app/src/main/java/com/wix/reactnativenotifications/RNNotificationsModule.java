package com.wix.reactnativenotifications;

import static com.wix.reactnativenotifications.Defs.LOGTAG;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.alibaba.sdk.android.push.popup.PopupNotifyClick;
import com.alibaba.sdk.android.push.popup.PopupNotifyClickListener;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.wix.reactnativenotifications.ali.AliTokenRefreshHandlerService;
import com.wix.reactnativenotifications.core.AppLifecycleFacadeHolder;
import com.wix.reactnativenotifications.core.InitialNotificationHolder;
import com.wix.reactnativenotifications.core.ReactAppLifecycleFacade;
import com.wix.reactnativenotifications.core.notification.INotificationChannel;
import com.wix.reactnativenotifications.core.notification.IPushNotification;
import com.wix.reactnativenotifications.core.notification.NotificationChannel;
import com.wix.reactnativenotifications.core.notification.PushNotification;
import com.wix.reactnativenotifications.core.notification.PushNotificationProps;
import com.wix.reactnativenotifications.core.notificationdrawer.IPushNotificationsDrawer;
import com.wix.reactnativenotifications.core.notificationdrawer.PushNotificationsDrawer;

import java.util.Map;

public class RNNotificationsModule extends ReactContextBaseJavaModule implements ActivityEventListener {

    public RNNotificationsModule(Application application, ReactApplicationContext reactContext) {
        super(reactContext);
        if (AppLifecycleFacadeHolder.get() instanceof ReactAppLifecycleFacade) {
            ((ReactAppLifecycleFacade) AppLifecycleFacadeHolder.get()).init(reactContext);
        }

        reactContext.addActivityEventListener(this);
    }

    @Override
    public String getName() {
        return "RNBridgeModule";
    }

    @Override
    public void initialize() {
        if(BuildConfig.DEBUG) Log.d(LOGTAG, "Native module init");
        startAliIntentService(AliTokenRefreshHandlerService.EXTRA_IS_APP_INIT);
        final IPushNotificationsDrawer notificationsDrawer = PushNotificationsDrawer.get(getReactApplicationContext().getApplicationContext());
        notificationsDrawer.onAppInit();
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {

    }

    @Override
    public void onNewIntent(Intent intent) {
        (new PopupNotifyClick(new PopupNotifyClickListener() {
            public void onSysNoticeOpened(String title, String summary, Map<String, String> extMap) {
                Log.e(LOGTAG, "onSysNoticeOpened onNewIntent, title: " + title + ", summary: " + summary + ", extraMap: " + extMap);
                Bundle bundle = new Bundle();
                bundle.putString("ali.title", title);
                bundle.putString("ali.body", summary);
                for (Map.Entry<String, String> entry : extMap.entrySet()) {
                    bundle.putString(entry.getKey(), entry.getValue());
                }
                bundle.putString("google.message_id", bundle.getString("_ALIYUN_NOTIFICATION_MSG_ID_"));
                bundle.remove("_ALIYUN_NOTIFICATION_MSG_ID_");
                final Context appContext = getReactApplicationContext().getApplicationContext();
                final IPushNotification pushNotification = PushNotification.get(appContext, bundle);
                if (pushNotification != null) {
                    pushNotification.onOpened();
                }
            }
        })).onCreate(getReactApplicationContext(), intent);
    }

    @ReactMethod
    public void refreshToken() {
        if(BuildConfig.DEBUG) Log.d(LOGTAG, "Native method invocation: refreshToken()");
        startAliIntentService(AliTokenRefreshHandlerService.EXTRA_MANUAL_REFRESH);
    }

    @ReactMethod
    public void getInitialNotification(final Promise promise) {
        if(BuildConfig.DEBUG) Log.d(LOGTAG, "Native method invocation: getInitialNotification");
        Object result = null;

        try {
            final PushNotificationProps notification = InitialNotificationHolder.getInstance().get();
            if (notification == null) {
                return;
            }

            result = Arguments.fromBundle(notification.asBundle());
            InitialNotificationHolder.getInstance().clear();
        } catch (NullPointerException e) {
            Log.e(LOGTAG, "getInitialNotification: Null pointer exception");
        } finally {
            promise.resolve(result);
        }
    }

    @ReactMethod
    public void postLocalNotification(ReadableMap notificationPropsMap, int notificationId) {
        if(BuildConfig.DEBUG) Log.d(LOGTAG, "Native method invocation: postLocalNotification");
        final Bundle notificationProps = Arguments.toBundle(notificationPropsMap);
        final IPushNotification pushNotification = PushNotification.get(getReactApplicationContext().getApplicationContext(), notificationProps);
        pushNotification.onPostRequest(notificationId);
    }

    @ReactMethod
    public void cancelLocalNotification(int notificationId) {
        IPushNotificationsDrawer notificationsDrawer = PushNotificationsDrawer.get(getReactApplicationContext().getApplicationContext());
        notificationsDrawer.onNotificationClearRequest(notificationId);
    }

    @ReactMethod
    public void setCategories(ReadableArray categories) {
    
    }
    
    public void cancelDeliveredNotification(String tag, int notificationId) {
        IPushNotificationsDrawer notificationsDrawer = PushNotificationsDrawer.get(getReactApplicationContext().getApplicationContext());
        notificationsDrawer.onNotificationClearRequest(tag, notificationId);
    }

    @ReactMethod
    public void isRegisteredForRemoteNotifications(Promise promise) {
        boolean hasPermission = NotificationManagerCompatFacade.from(getReactApplicationContext()).areNotificationsEnabled();
        promise.resolve(new Boolean(hasPermission));
    }

    @ReactMethod void removeAllDeliveredNotifications() {
        IPushNotificationsDrawer notificationsDrawer = PushNotificationsDrawer.get(getReactApplicationContext().getApplicationContext());
        notificationsDrawer.onAllNotificationsClearRequest();
    }

    @ReactMethod
    void setNotificationChannel(ReadableMap notificationChannelPropsMap) {
        final Bundle notificationChannelProps = Arguments.toBundle(notificationChannelPropsMap);
        INotificationChannel notificationsDrawer = NotificationChannel.get(
                getReactApplicationContext().getApplicationContext(),
                notificationChannelProps
        );
        notificationsDrawer.setNotificationChannel();
    }

    protected void startAliIntentService(String extraFlag) {
        final Context appContext = getReactApplicationContext().getApplicationContext();
        final Intent tokenFetchIntent = new Intent(appContext, AliTokenRefreshHandlerService.class);
        tokenFetchIntent.putExtra(extraFlag, true);
        AliTokenRefreshHandlerService.enqueueWork(appContext, tokenFetchIntent);
    }
}
