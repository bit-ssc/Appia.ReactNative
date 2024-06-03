package com.wix.reactnativenotifications;

import static com.wix.reactnativenotifications.Defs.LOGTAG;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.alibaba.sdk.android.push.huawei.HuaWeiRegister;
import com.alibaba.sdk.android.push.popup.PopupNotifyClick;
import com.alibaba.sdk.android.push.popup.PopupNotifyClickListener;
import com.alibaba.sdk.android.push.register.MiPushRegister;
import com.alibaba.sdk.android.push.register.OppoRegister;
import com.alibaba.sdk.android.push.register.VivoRegister;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.wix.reactnativenotifications.core.AppLifecycleFacade;
import com.wix.reactnativenotifications.core.AppLifecycleFacadeHolder;
import com.wix.reactnativenotifications.core.InitialNotificationHolder;
import com.wix.reactnativenotifications.core.NotificationIntentAdapter;
import com.wix.reactnativenotifications.core.ReactAppLifecycleFacade;
import com.wix.reactnativenotifications.core.notification.IPushNotification;
import com.wix.reactnativenotifications.core.notification.PushNotification;
import com.wix.reactnativenotifications.core.notificationdrawer.IPushNotificationsDrawer;
import com.wix.reactnativenotifications.core.notificationdrawer.PushNotificationsDrawer;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class RNNotificationsPackage implements ReactPackage, AppLifecycleFacade.AppVisibilityListener, Application.ActivityLifecycleCallbacks {

    private final Application mApplication;

    public RNNotificationsPackage(Application application) {
        mApplication = application;
        MiPushRegister.register(mApplication, "2882303761520170667", "5582017049667");
        HuaWeiRegister.register(mApplication);
        VivoRegister.register(mApplication);
        OppoRegister.register(mApplication, "3b23dd8681bf4ad1adfbc685b19769a0", "97da9039651d43f09a0a176b2c7b2721");
        AppLifecycleFacadeHolder.get().addVisibilityListener(this);
        application.registerActivityLifecycleCallbacks(this);
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(new RNNotificationsModule(mApplication, reactContext));
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public void onAppVisible() {
        final IPushNotificationsDrawer notificationsDrawer = PushNotificationsDrawer.get(mApplication.getApplicationContext());
        notificationsDrawer.onAppVisible();
    }

    @Override
    public void onAppNotVisible() {
    }

    @Override
    public void onActivityCreated(Activity activity, Bundle savedInstanceState) {
        final IPushNotificationsDrawer notificationsDrawer = PushNotificationsDrawer.get(mApplication.getApplicationContext());
        notificationsDrawer.onNewActivity(activity);
        callOnOpenedIfNeed(activity);
    }

    @Override
    public void onActivityStarted(Activity activity) {
        boolean isReactInitialized = false;
        if (AppLifecycleFacadeHolder.get() instanceof ReactAppLifecycleFacade) {
            isReactInitialized = AppLifecycleFacadeHolder.get().isReactInitialized();
        }
        if (InitialNotificationHolder.getInstance().get() == null && !isReactInitialized) {
            callOnOpenedIfNeed(activity);
        }
    }

    @Override
    public void onActivityResumed(Activity activity) {
    }

    @Override
    public void onActivityPaused(Activity activity) {
    }

    @Override
    public void onActivityStopped(Activity activity) {
    }

    @Override
    public void onActivitySaveInstanceState(Activity activity, Bundle outState) {
    }

    @Override
    public void onActivityDestroyed(Activity activity) {
    }

    private void callOnOpenedIfNeed(Activity activity) {
        (new PopupNotifyClick(new PopupNotifyClickListener() {
            public void onSysNoticeOpened(String title, String summary, Map<String, String> extMap) {
                Log.e(LOGTAG, "onSysNoticeOpened onActivityCreated, title: " + title + ", summary: " + summary + ", extraMap: " + extMap);
                Bundle bundle = new Bundle();
                bundle.putString("ali.title", title);
                bundle.putString("ali.body", summary);
                for (Map.Entry<String, String> entry : extMap.entrySet()) {
                    bundle.putString(entry.getKey(), entry.getValue());
                }
                bundle.putString("google.message_id", bundle.getString("_ALIYUN_NOTIFICATION_MSG_ID_"));
                bundle.remove("_ALIYUN_NOTIFICATION_MSG_ID_");

                Context appContext = mApplication.getApplicationContext();
                final IPushNotification pushNotification = PushNotification.get(appContext, bundle);
                if (pushNotification != null) {
                    pushNotification.onOpened();
                }
            }
        })).onCreate(activity, activity.getIntent());
        Intent intent = activity.getIntent();
        if (NotificationIntentAdapter.canHandleIntent(intent)) {
            Context appContext = mApplication.getApplicationContext();
            Bundle notificationData = NotificationIntentAdapter.extractPendingNotificationDataFromIntent(intent);
            final IPushNotification pushNotification = PushNotification.get(appContext, notificationData);
            if (pushNotification != null) {
                pushNotification.onOpened();
            }
        }
    }
}
