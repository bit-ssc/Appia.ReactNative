package chat.rocket.reactnative;

import static chat.rocket.reactnative.BuildConfig.APPLICATION_ID;

import android.app.AlertDialog;
import android.app.NotificationManager;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.google.firebase.analytics.FirebaseAnalytics;
import com.zoontek.rnbootsplash.RNBootSplash;

import java.util.Locale;

import expo.modules.ReactActivityDelegateWrapper;
import me.leolin.shortcutbadger.ShortcutBadger;

public class MainActivity extends ReactActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        RNBootSplash.init(this);
        // https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
        super.onCreate(null);

        FirebaseAnalytics.getInstance(this);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            boolean isOpened = notificationManager.areNotificationsEnabled();
            if (!isOpened) {
                String title = "推送功能提醒";
                String message = "请前往系统设置打开通知，获取即时消息";
                String ensure = "确定";
                Locale locale = getResources().getConfiguration().getLocales().get(0);
                String language = locale.getLanguage();
                if (!language.endsWith("zh")) {
                    title = "Alert";
                    message = "Please go to system settings to open notifications and get instant messages";
                    ensure = "Confirm";
                }
                new AlertDialog.Builder(this).
                        setTitle(title).
                        setMessage(message).
                        setPositiveButton(ensure, new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                Uri packageURI = Uri.parse("package:" + APPLICATION_ID);
                                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageURI);
                                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                startActivity(intent);
                            }
                        }).show();
            }
        }

    }

    @Override
    protected void onResume() {
        super.onResume();
        ShortcutBadger.removeCount(getApplicationContext());
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.cancelAll();
    }

    @Override
    public void invokeDefaultOnBackPressed() {
        moveTaskToBack(true);
    }

    /**
    * Returns the name of the main component registered from JavaScript. This is used to schedule
    * rendering of the component.
    */
    @Override
    protected String getMainComponentName() {
        return "RocketChatRN";
    }

    // from react-native-orientation
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        Intent intent = new Intent("onConfigurationChanged");
        intent.putExtra("newConfig", newConfig);
        this.sendBroadcast(intent);
    }

    /**
    * Returns the instance of the {@link ReactActivityDelegate}. There the RootView is created and
    * you can specify the rendered you wish to use (Fabric or the older renderer).
    */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegateWrapper(this, new MainActivityDelegate(this, getMainComponentName()));
    }

    public static class MainActivityDelegate extends ReactActivityDelegate {
        public MainActivityDelegate(ReactActivity activity, String mainComponentName) {
            super(activity, mainComponentName);
        }

        @Override
        protected ReactRootView createRootView() {
            ReactRootView reactRootView = new ReactRootView(getContext());
            // If you opted-in for the New Architecture, we enable the Fabric Renderer.
            reactRootView.setIsFabric(BuildConfig.IS_NEW_ARCHITECTURE_ENABLED);
            return reactRootView;
        }
    }
}