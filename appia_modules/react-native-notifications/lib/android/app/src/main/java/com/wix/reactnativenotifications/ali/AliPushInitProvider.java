

package com.wix.reactnativenotifications.ali;

import android.app.Application;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.alibaba.sdk.android.push.HonorRegister;
import com.alibaba.sdk.android.push.huawei.HuaWeiRegister;
import com.alibaba.sdk.android.push.noonesdk.PushServiceFactory;
import com.alibaba.sdk.android.push.notification.BasicCustomPushNotification;
import com.alibaba.sdk.android.push.notification.CustomNotificationBuilder;
import com.alibaba.sdk.android.push.register.GcmRegister;
import com.alibaba.sdk.android.push.register.MiPushRegister;
import com.alibaba.sdk.android.push.register.OppoRegister;
import com.alibaba.sdk.android.push.register.VivoRegister;

import anet.channel.util.ALog;

public class AliPushInitProvider extends ContentProvider {

    final private String DEFAULT_CHANNEL_ID = "channel_01";
    final private String DEFAULT_CHANNEL_NAME = "Channel Name";

    final private String FCM_SEND_ID = "964966494053";
    final private String FCM_APPLICATION_ID = "1:964966494053:android:f3c6049a696f38cef33b8c";
    final private String FCM_PROJECT_ID = "appia-reactnative";
    final private String FCM_API_KEY = "AIzaSyBSPhgLItegKwCcr_DhyCwhIh8N3nIHgEM";

    final int ADVANCED_CUSTOM_NOTIF_ID = 2;

    @Override
    public boolean onCreate() {
        ALog.setLevel(0);
        PushServiceFactory.init(getContext());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel defaultChannel = new NotificationChannel(DEFAULT_CHANNEL_ID,
                    DEFAULT_CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH);
            Log.e("dxd", "onCreate: channel通道初始化成功" );
            final NotificationManager notificationManager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.createNotificationChannel(defaultChannel);
        }

        //todo
        boolean vivoFlag = VivoRegister.register(getContext().getApplicationContext());
        boolean huaweiFlag = HuaWeiRegister.register((Application) getContext().getApplicationContext());
        boolean honor = HonorRegister.register((Application) getContext().getApplicationContext());
        if (!vivoFlag && !oppoFlag && !miFlag && !huaweiFlag && !honor) {
            GcmRegister.register(getContext().getApplicationContext(), FCM_SEND_ID, FCM_APPLICATION_ID, FCM_PROJECT_ID, FCM_API_KEY);
        }


        //setAdvCusNotf();
        return false;
    }

    private void setAdvCusNotf() {
        BasicCustomPushNotification notification = new BasicCustomPushNotification();
        //设置服务端配置优先
        notification.setServerOptionFirst(true);
        //设置当推送到达时如果应用处于前台不创建通知
        notification.setBuildWhenAppInForeground(false);
        notification.setRemindType(BasicCustomPushNotification.REMIND_TYPE_VIBRATE);
        notification.setNotificationFlags(Notification.FLAG_SHOW_LIGHTS);
        notification.setNotificationFlags(Notification.FLAG_FOREGROUND_SERVICE);
        //注册该通知,并设置ID为2
        boolean res = CustomNotificationBuilder.getInstance().setCustomNotification(ADVANCED_CUSTOM_NOTIF_ID, notification);
        Log.e("dxd", "CustomNotificationBuilder: "  + res);

    }



    @Nullable
    @Override
    public Cursor query(
            @NonNull Uri uri,
            @Nullable String[] projection,
            @Nullable String selection,
            @Nullable String[] selectionArgs,
            @Nullable String sortOrder) {
        return null;
    }

    @Nullable
    @Override
    public String getType(@NonNull Uri uri) {
        return null;
    }

    @Nullable
    @Override
    public Uri insert(@NonNull Uri uri, @Nullable ContentValues values) {
        return null;
    }

    @Override
    public int delete(
            @NonNull Uri uri, @Nullable String selection, @Nullable String[] selectionArgs) {
        return 0;
    }

    @Override
    public int update(
            @NonNull Uri uri,
            @Nullable ContentValues values,
            @Nullable String selection,
            @Nullable String[] selectionArgs) {
        return 0;
    }
}
