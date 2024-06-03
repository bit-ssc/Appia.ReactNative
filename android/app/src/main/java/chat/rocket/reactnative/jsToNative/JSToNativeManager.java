package chat.rocket.reactnative.jsToNative;

import static android.Manifest.permission.WRITE_EXTERNAL_STORAGE;
import static chat.rocket.reactnative.BuildConfig.APPLICATION_ID;
import static chat.rocket.reactnative.imagepicker.ImagePicker.RESULT_CODE_BACK;
import static chat.rocket.reactnative.imagepicker.ImagePicker.RESULT_CODE_ITEMS;
import static io.invertase.firebase.app.ReactNativeFirebaseApp.getApplicationContext;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.viewpager2.widget.ViewPager2;
import androidx.webkit.ProxyConfig;
import androidx.webkit.ProxyController;
import androidx.webkit.WebViewFeature;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.reactnativecommunity.webview.WebViewUtils;

import java.io.Serializable;
import java.net.NetworkInterface;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.Executor;

import chat.rocket.reactnative.imagepicker.GlideImageLoader;
import chat.rocket.reactnative.imagepicker.ImagePicker;
import chat.rocket.reactnative.imagepicker.bean.ImageItem;
import chat.rocket.reactnative.imagepicker.ui.ImageGridActivity;
import chat.rocket.reactnative.media.MediaActivity;
import chat.rocket.reactnative.media.ViewPagerAdapter;
import chat.rocket.reactnative.voicechat.FloatWindow;
import me.leolin.shortcutbadger.ShortcutBadger;

public class JSToNativeManager extends ReactContextBaseJavaModule implements ActivityEventListener {

    private static final int XIAOMI_BADGE_COUNT_NOTIFICATION_ID = 0X0001;

    private ReactApplicationContext mContext;

    private Promise mPromise;


    public JSToNativeManager() {
    }

    public JSToNativeManager(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
        mContext = reactContext;

    }

    @NonNull
    @Override
    public String getName() {
        return "JSToNativeManager";
    }

    @ReactMethod
    public void jumpToSystemSetting() {

        Uri packageURI = Uri.parse("package:" + APPLICATION_ID);
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageURI);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        mContext.startActivity(intent);

        //mContext.startActivity(new Intent(Settings.ACTION_SETTINGS));
    }

    @ReactMethod
    public void showPhotoBrowser(int index, ReadableArray readableArray) {
        Activity currentActivity = getCurrentActivity();
        if (null != currentActivity) {
            Intent intent = new Intent(currentActivity, MediaActivity.class);
            intent.putExtra("source", readableArray.toArrayList());
            intent.putExtra("index", index);
            currentActivity.startActivity(intent);
        }
    }

    @ReactMethod
    public void showPhoto(ReadableMap readableMap) {
        Activity currentActivity = getCurrentActivity();
        List<Map<String, Object>> mapList = new ArrayList<>();
        ReadableNativeMap map = (ReadableNativeMap) readableMap;
        mapList.add(map.toHashMap());

        if (null != currentActivity) {
            Intent intent = new Intent(currentActivity, MediaActivity.class);
            intent.putExtra("source", (Serializable) mapList);
            currentActivity.startActivity(intent);
        }
    }

    @ReactMethod
    public void changePhoto (int direct , ReadableArray readableArray) {
        Activity currentActivity = getCurrentActivity();
        if (null != currentActivity && currentActivity  instanceof MediaActivity) {
            ViewPagerAdapter adapter = ((MediaActivity)currentActivity).getAdapter();
            ArrayList<Map<String, Object>> castedList = new ArrayList<>();
            Log.e("TAG", "changePhoto: " + adapter.getItemCount() + " " + readableArray.size());
            for (Object object : readableArray.toArrayList()) {
                if (object instanceof Map<?, ?>) {
                    // 这里的转换是安全的，因为我们检查了对象的类型
                    @SuppressWarnings("unchecked")
                    Map<String, Object> map = (Map<String, Object>) object;
                    castedList.add(map);
                } else {
                    // 处理 object 不是 Map 的情况
                }
            }
            if (direct == 1 ) {
                ViewPager2 viewPager2 = ((MediaActivity)currentActivity).getPager();
                int difference = readableArray.size() - adapter.getItemCount();
                int current = viewPager2.getCurrentItem();
                viewPager2.setCurrentItem(current + difference, false);
            }
            adapter.updateData(castedList);
            adapter.notifyDataSetChanged();
        }
    }


    private ImagePicker imagePicker;

    @ReactMethod
    public void getAllFilePermission(Callback HasGetPermission, Callback rejectPermission) {
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (!Environment.isExternalStorageManager()) {
                getAllFilePermission();
            } else {
                HasGetPermission.invoke("true");
            }
        }
    }

    @ReactMethod
    public void checkVPNIsOpen(Callback callback) {
        try {
            List<NetworkInterface> networkList = Collections.list(NetworkInterface.getNetworkInterfaces());
            for (NetworkInterface networkInterface : networkList) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.GINGERBREAD) {
                    if (networkInterface.isUp()) {
                        if (networkInterface.getName().contains("tun") || networkInterface.getName().contains("ppp") || networkInterface.getName().contains("pptp")) {
                            callback.invoke(true);
                            return;
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        callback.invoke(false);
    }

    public void getAllFilePermission() {
        Activity currentActivity = getCurrentActivity();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (!Environment.isExternalStorageManager()) {
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION);
                    intent.addCategory("android.intent.category.DEFAULT");
                    intent.setData(Uri.parse(String.format("package:%s", getApplicationContext().getPackageName())));
                    if (currentActivity != null) {
                        currentActivity.startActivityForResult(intent, 2296);
                    }
                } catch (Exception e) {
                    Intent intent = new Intent();
                    intent.setAction(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
                    if (currentActivity != null) {
                        currentActivity.startActivityForResult(intent, 2296);
                    }
                }
            } else {
                //below android 11
                if (currentActivity != null) {
                    ActivityCompat.requestPermissions(currentActivity, new String[]{WRITE_EXTERNAL_STORAGE}, 1);
                }
            }
        }

    }


    @ReactMethod
    public void chooseFromGallery(Promise promise) {
        Activity currentActivity = getCurrentActivity();
        mPromise = promise;
        if (null != currentActivity) {
            imagePicker = ImagePicker.getInstance();
            imagePicker.setImageLoader(new GlideImageLoader());
            Intent intent = new Intent(currentActivity, ImageGridActivity.class);
            currentActivity.startActivityForResult(intent, 100);
        }
    }

    @ReactMethod
    private void showMessageBadge(int badgeCount) {
        Context context = getApplicationContext();
        if (Build.MANUFACTURER.toLowerCase(Locale.ROOT).equals("xiaomi")) {
            Notification xiaomiBadge = buildXiaomiNotification(context);
            ShortcutBadger.applyNotification(context, xiaomiBadge, badgeCount);
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.notify(XIAOMI_BADGE_COUNT_NOTIFICATION_ID, xiaomiBadge);
            notificationManager.cancel(XIAOMI_BADGE_COUNT_NOTIFICATION_ID);
        } else {
            ShortcutBadger.applyCount(context, badgeCount);
        }
    }

    private Notification buildXiaomiNotification(Context context) {
        return new Notification.Builder(context).build();
    }

    ArrayList<ImageItem> images = null;
    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (resultCode == RESULT_CODE_ITEMS) {

            if (data != null && requestCode == 100) {

                try {
                    images = (ArrayList<ImageItem>) data.getSerializableExtra(ImagePicker.EXTRA_RESULT_ITEMS);

                    putImageToWritableArray(images);

                } catch (Exception e) {
                    e.printStackTrace();
                    notifyProblem();
                }

            } else {
                notifyProblem();
            }
        } else if (resultCode == RESULT_CODE_BACK) {
            notifyProblem();
        }
    }

    private synchronized void notifyProblem() {
        mPromise.reject("", "");
    }

    private synchronized void putImageToWritableArray(ArrayList<ImageItem> images) {
        WritableArray arrayResult = new WritableNativeArray();
        for (int i = 0; i < images.size(); i++) {
            arrayResult.pushMap(getImage(images.get(i)));
        }
        mPromise.resolve(arrayResult);
    }

    public WritableMap getImage(ImageItem image) {
        WritableMap writableImage = new WritableNativeMap();
        writableImage.putString("path", image.path);
        writableImage.putString("mime", image.mimeType);
        writableImage.putInt("height", image.height);
        writableImage.putInt("width", image.width);
        writableImage.putString("filename", image.name);
        writableImage.putDouble("addTime", image.addTime);
        writableImage.putDouble("size", image.size);

        return writableImage;
    }

    @ReactMethod
    private void setProxy() {
        if (WebViewFeature.isFeatureSupported(WebViewFeature.PROXY_OVERRIDE)) {
            String webviewProxy = WebViewUtils.getValueFromMMKV("Appia_Webview_Global_Proxy", mContext);
            if(webviewProxy == null) return;
            String[] proxys = webviewProxy.split(",");
            ProxyConfig.Builder builder = new ProxyConfig.Builder();
            for (String proxy : proxys) {
                builder.addProxyRule(proxy);
            }
            ProxyConfig proxyConfig = builder.addDirect().build();
            ProxyController.getInstance().setProxyOverride(proxyConfig, new Executor() {
                @Override
                public void execute(Runnable command) {
                    //do nothing
                }
            }, new Runnable() {
                @Override
                public void run() {
                    Log.w("dxd", "WebView代理改变");
                }
            });
        }
    }

    @ReactMethod
    private void clearProxy() {
        if (WebViewFeature.isFeatureSupported(WebViewFeature.PROXY_OVERRIDE)) {
            ProxyController.getInstance().clearProxyOverride(new Executor() {
                @Override
                public void execute(Runnable command) {

                }
            }, new Runnable() {
                @Override
                public void run() {
                    Log.e("dxd", "清除代理成功" );
                }
            });
        }
    }

    @Override
    public void onNewIntent(Intent intent) {

    }

    @ReactMethod
    public void removeVoiceChatWindow() {
        Log.e("JS", "removeVoiceChatWindow: " + 111111);
        FloatWindow floatWindow = FloatWindow.getInstance(mContext, "");
        if (floatWindow != null) {
            Log.e("JS", "removeVoiceChatWindow: " + 22222);

            floatWindow.remove();
        }
    }
}
