package com.wix.reactnativenotifications.core.notification;

import android.os.Bundle;
import android.util.Log;

public class PushNotificationProps {

    protected Bundle mBundle;

    public PushNotificationProps(Bundle bundle) {
        mBundle = bundle;
    }

    public String getTitle() {
        return getBundleStringFirstNotNull("ali.title", "title");
    }

    public String getBody() {
        return getBundleStringFirstNotNull("ali.body", "body");
    }

    public Integer getBadgeCount() {
        return Integer.valueOf(getBundleStringFirstNotNull("badgeCount", "count"));
    }



    public String getChannelId() {
        //TODO 阿里啥字段
        return getBundleStringFirstNotNull("ali_channel_id", "android_channel_id");
    }

    public Bundle asBundle() {
        return (Bundle) mBundle.clone();
    }


    public boolean isDataOnlyPushNotification() {
        Log.e("dxd", "isDataOnlyPushNotification: body = " +  getBody());
        Log.e("dxd", "isDataOnlyPushNotification: badge = " +  getBadgeCount());
        return getTitle() == null && getBody() == null;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder(1024);
        for (String key : mBundle.keySet()) {
            sb.append(key).append("=").append(mBundle.get(key)).append(", ");
        }
        return sb.toString();
    }

    protected PushNotificationProps copy() {
        return new PushNotificationProps((Bundle) mBundle.clone());
    }

    private String getBundleStringFirstNotNull(String key1, String key2) {
        String result = mBundle.getString(key1);
        return result == null ? mBundle.getString(key2) : result;
    }
}
