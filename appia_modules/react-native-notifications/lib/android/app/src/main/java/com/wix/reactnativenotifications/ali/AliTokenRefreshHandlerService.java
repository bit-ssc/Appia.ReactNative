package com.wix.reactnativenotifications.ali;

import android.content.Context;
import android.content.Intent;

import androidx.annotation.NonNull;
import androidx.core.app.JobIntentService;

import com.wix.reactnativenotifications.fcm.IFcmToken;

public class AliTokenRefreshHandlerService extends JobIntentService {

    public static String EXTRA_IS_APP_INIT = "isAppInit";
    public static String EXTRA_MANUAL_REFRESH = "doManualRefresh";
    public static final int JOB_ID = 2400;

    public static void enqueueWork(Context context, Intent work) {
        enqueueWork(context, AliTokenRefreshHandlerService.class, JOB_ID, work);
    }

    @Override
    protected void onHandleWork(@NonNull Intent intent) {
        IFcmToken fcmToken = AliToken.get(this);
        if (fcmToken == null) {
            return;
        }

        if (intent.getBooleanExtra(EXTRA_IS_APP_INIT, false)) {
            fcmToken.onAppReady();
        } else if (intent.getBooleanExtra(EXTRA_MANUAL_REFRESH, false)) {
            fcmToken.onManualRefresh();
        } else {
            fcmToken.onNewTokenReady();
        }
    }
}
