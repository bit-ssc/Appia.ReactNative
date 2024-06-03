package chat.rocket.reactnative.voicechat;

import android.app.Service;
import android.content.Intent;
import android.media.MediaPlayer;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.Message;
import android.provider.Settings;
import android.util.Log;
import android.widget.Toast;

import chat.rocket.reactnative.R;


public class FloatWindowService extends Service {

    public static final String TAG = "FloatWindowService";
    public static final int HANDLER_DETECT_PERMISSION = 0x2001;

    public static final String SHOW_FLOAT_WINDOW = "show_float_window";

    private MediaPlayer mPlayer;
    private final Handler mHandler = new Handler(Looper.getMainLooper()) {
        @Override
        public void handleMessage(Message msg) {
            int what = msg.what;
            switch (what) {
                case HANDLER_DETECT_PERMISSION:
                    if (Settings.canDrawOverlays(getApplicationContext())) {
                        mHandler.removeMessages(HANDLER_DETECT_PERMISSION);
                        Log.e(TAG, "悬浮窗权限检查成功");
                        Log.e(TAG, "handleMessage: " + msg.obj );
                        showFloatPermissionWindow((String) msg.obj);
                        startMusic();
                    } else {
                        Log.e(TAG, "悬浮窗权限检查失败");
                        Toast.makeText(FloatWindowService.this, "没有悬浮窗权限，请前往设置中开启", Toast.LENGTH_SHORT).show();
                    }
                    break;
            }
        }
    };
    private static FloatWindow mFloatWindow;

    public FloatWindowService() {
    }

    @Override
    public IBinder onBind(Intent intent) {
        // TODO: Return the communication channel to the service.
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        mPlayer = MediaPlayer.create(FloatWindowService.this, R.raw.voice_chat_music);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.e(TAG, "onStartCommand: " + intent.getStringExtra("name"));
        Message message = mHandler.obtainMessage();
        message.what = HANDLER_DETECT_PERMISSION;
        message.obj = intent.getStringExtra("name");
        mHandler.sendMessage(message);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        removeFloatWindow();
        releasePlayer();
        super.onDestroy();
    }

    private void releasePlayer() {
        if (mPlayer != null) {
            if(mPlayer.isPlaying()){
                mPlayer.stop();
            }
            mPlayer.release();
            mPlayer = null;
        }
    }


    private synchronized void startMusic() {
        if (mPlayer != null) {
            mPlayer.start();
            mPlayer.setLooping(true);
        }
    }

    private synchronized void showFloatPermissionWindow(String senderName) {
        if (mFloatWindow != null) {
            mFloatWindow.remove();
            mFloatWindow = null;
        }
        Log.e(TAG, "showFloatPermissionWindow: " + senderName );
        mFloatWindow = FloatWindow.getInstance(FloatWindowService.this, senderName);
        mFloatWindow.show();
    }

    public void removeFloatWindow() {
        if (mFloatWindow != null) {
            mFloatWindow.remove();
            mFloatWindow = null;
        }
    }

}
