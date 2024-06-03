package com.wix.reactnativenotifications.ali;

import static com.wix.reactnativenotifications.Defs.LOGTAG;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import com.alibaba.sdk.android.push.MessageReceiver;
import com.alibaba.sdk.android.push.notification.CPushMessage;
import com.wix.reactnativenotifications.BuildConfig;
import com.wix.reactnativenotifications.core.AppLifecycleFacadeHolder;
import com.wix.reactnativenotifications.core.notification.IPushNotification;
import com.wix.reactnativenotifications.core.notification.PushNotification;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;

import me.leolin.shortcutbadger.ShortcutBadger;

public class AliMessageReceiver extends MessageReceiver {
    private static final int XIAOMI_BADGE_COUNT_NOTIFICATION_ID = 0X0003;

    public static final HashMap<String, Integer> mNotificationMap = new HashMap<>();

    public static final String MESSAGE_CHAT_VOICE  = "oncall";

    @Override
    public void onNotification(Context context, String title, String summary, Map<String, String> extraMap) {
        Log.e("dxd", "onNotification:  onNotification");
        if (BuildConfig.DEBUG)
            Log.e(LOGTAG, "onNotification, title: " + title + ", summary: " + summary + ", extraMap: " + extraMap);
        Bundle bundle = new Bundle();
        bundle.putString("ali.title", title);
        bundle.putString("ali.body", summary);
        bundle.putString("notId", extraMap.get("_ALIYUN_NOTIFICATION_ID_"));
        bundle.putString("ali.time", extraMap.get("timestamp"));
        for (Map.Entry<String, String> entry : extraMap.entrySet()) {
            Log.e("dxd", "onNotification: key= " + entry.getKey() + "  value= " + entry.getValue());
            bundle.putString(entry.getKey(), entry.getValue());
        }


        Log.e("dxd", "onNotification: title = " + title + ", summary = " + summary);
        clearPreNotification(extraMap, context);
        showBadge(extraMap, context);
        if (!AppLifecycleFacadeHolder.get().isAppVisible() && extraMap.get("msgType").trim().equals(MESSAGE_CHAT_VOICE)){
            showFloatWindow(context, title);
        }
//         final IPushNotification notification = PushNotification.get(context, bundle);
//         try {
//             NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
//             notification.onReceived();
//         } catch (Exception e) {
//             e.printStackTrace();
//         }
    }

    private void showFloatWindow(Context context, String name) {
        Intent intent = new Intent("com.alibaba.sdk.android.push.RECEIVE");
        intent.setAction("com.alibaba.sdk.android.push.RECEIVE");
        Log.e(TAG, "showFloatWindow: " + name );
        intent.putExtra("name", name);
        intent.setPackage(context.getPackageName());
        context.startService(intent);
    }


    private void clearPreNotification(Map<String, String> extraMap, Context context) {
        String roomId = extraMap.get("roomId");
        int notificationId = Integer.parseInt(extraMap.get("_ALIYUN_NOTIFICATION_ID_"));
        Integer preNotificationId = mNotificationMap.get(roomId);
        Log.e("dxd", "clearPreNotification: mNotificationMap" + mNotificationMap );
        if (preNotificationId != null) {
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.cancel(preNotificationId);
        }
        mNotificationMap.put(roomId, notificationId);
        Log.e("dxd", "clearPreNotification: mNotificationMap" + mNotificationMap );

    }

    private Notification buildXiaomiNotification(Context context) {
        return new Notification.Builder(context).build();
    }

    private void showBadge(Map<String, String> extraMap, Context context) {
        if (Build.MANUFACTURER.toLowerCase(Locale.ROOT).equals("xiaomi")) {
            Notification xiaomiBadge = buildXiaomiNotification(context);
            Log.e("dxd", "badgeCount: " + extraMap.get("badgeCount"));
            ShortcutBadger.applyNotification(context, xiaomiBadge, Integer.parseInt(extraMap.get("badgeCount")));
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.notify(XIAOMI_BADGE_COUNT_NOTIFICATION_ID, xiaomiBadge);
            notificationManager.cancel(XIAOMI_BADGE_COUNT_NOTIFICATION_ID);
        } else {
            ShortcutBadger.applyCount(context, Integer.parseInt(extraMap.get("badgeCount")));
        }
    }

    //纯消息
    @Override
    public void onMessage(Context context, CPushMessage cPushMessage) {
        Log.e("dxd", "onNotification:  onNotification");
        if (BuildConfig.DEBUG)
            Log.e(LOGTAG, "onMessage, messageId: " + cPushMessage.getMessageId() + ", title: " + cPushMessage.getTitle() + ", content:" + cPushMessage.getContent());
        Bundle bundle = new Bundle();
        bundle.putString("google.message_id", cPushMessage.getMessageId());
        try {
            String content = cPushMessage.getContent();
            JSONObject data = new JSONObject(content);
            Iterator<String> keys = data.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                bundle.putString(key, data.optString(key));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        final IPushNotification notification = PushNotification.get(context, bundle);
        try {
            notification.onReceived();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onNotificationOpened(Context context, String title, String summary, String extraMap) {
        Log.e("dxd", "onNotificationOpened:  onNotificationOpened");

//         if (BuildConfig.DEBUG)
//             Log.e(LOGTAG, "onNotificationOpened, title: " + title + ", summary: " + summary + ", extraMap: " + extraMap);
//         Bundle bundle = new Bundle();
//         bundle.putString("ali.title", title);
//         bundle.putString("ali.body", summary);
//         Log.e("dxd", "onNotificationOpened:  打开通知回调");
//
//         try {
//             JSONObject data = new JSONObject(extraMap);
//             Iterator<String> keys = data.keys();
//             while (keys.hasNext()) {
//                 String key = keys.next();
//                 bundle.putString(key, data.optString(key));
//             }
//         } catch (Exception e) {
//             e.printStackTrace();
//         }
//         final IPushNotification notification = PushNotification.get(context, bundle);
//         try {
//             notification.onOpened();
//         } catch (Exception e) {
//             e.printStackTrace();
//         }
    }

    @Override
    protected void onNotificationClickedWithNoAction(Context context, String title, String summary, String extraMap) {
        Log.e("dxd", "onNotificationClickedWithNoAction:  onNotificationClickedWithNoAction");
        if (BuildConfig.DEBUG)
            Log.e(LOGTAG, "onNotificationClickedWithNoAction, title: " + title + ", summary: " + summary + ", extraMap: " + extraMap);
        Bundle bundle = new Bundle();
        bundle.putString("ali.title", title);
        bundle.putString("ali.body", summary);
        try {
            JSONObject data = new JSONObject(extraMap);
            Iterator<String> keys = data.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                bundle.putString(key, data.optString(key));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        final IPushNotification notification = PushNotification.get(context, bundle);
        try {
            notification.onOpened();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onNotificationReceivedInApp(Context context, String title, String summary, Map<String, String> extraMap, int openType, String openActivity, String openUrl) {
        Log.e("dxd", "onNotificationReceivedInApp:  onNotificationReceivedInApp");
        if (BuildConfig.DEBUG)
            Log.e(LOGTAG, "onNotificationReceivedInApp, title: " + title + ", summary: " + summary + ", extraMap: " + extraMap);
        Bundle bundle = new Bundle();
        bundle.putString("ali.title", title);
        bundle.putString("ali.body", summary);
        for (Map.Entry<String, String> entry : extraMap.entrySet()) {
            bundle.putString(entry.getKey(), entry.getValue());
        }
        final IPushNotification notification = PushNotification.get(context, bundle);
        try {
            notification.onReceived();
        } catch (IPushNotification.InvalidNotificationException e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onNotificationRemoved(Context context, String messageId) {
        if (BuildConfig.DEBUG)
            Log.e(LOGTAG, "onNotificationRemoved messageId:" + messageId);
        Log.e("dxd", "onNotificationRemoved:  移除通知回调");
    }

}
