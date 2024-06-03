package chat.rocket.reactnative.voicechat;

import static android.content.Context.WINDOW_SERVICE;
import static android.view.WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;

import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.res.Resources;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewTreeObserver;
import android.view.WindowManager;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.CallSuper;
import androidx.annotation.LayoutRes;

import java.util.Calendar;
import java.util.GregorianCalendar;

import chat.rocket.reactnative.R;
import chat.rocket.reactnative.utils.ApplicationUtils;

public class FloatWindow {

    public static final String TAG = "AbsFloatBase";

    WindowManager.LayoutParams mLayoutParams;

    View mInflate;

    View mRoot;
    Context mContext;
    WindowManager mWindowManager;
    private boolean mAdded;
    private boolean mRequestFocus = false;
    int mGravity =  Gravity.CENTER_HORIZONTAL | Gravity.TOP;
    Handler mHandler = new Handler(Looper.getMainLooper());
    protected int mAddX = 0;
    protected int mAddY = 0;

    private String mSenderName;

    public FloatWindow(Context context, String name) {
        mSenderName = name;
        mContext = context.getApplicationContext();
        create();
    }

    private static volatile FloatWindow instance;

    public static FloatWindow getInstance(Context context, String name) {
        if (instance == null) {
            synchronized (FloatWindow.class) {
                if (instance == null) {
                    instance = new FloatWindow(context, name);
                }
            }
        }
        return instance;
    }


    @CallSuper
    public void create() {
        mWindowManager = (WindowManager) mContext.getApplicationContext().getSystemService(WINDOW_SERVICE);
        inflate(R.layout.layout_float_window);
        mInflate.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                ApplicationUtils.moveAppToFront(mContext);
                remove();
            }
        });
        mInflate.getViewTreeObserver().addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
            @Override
            public void onGlobalLayout() {
                enterAnimator();
            }
        });
        Log.e(TAG, "create: mSenderName = " + mSenderName );
        if (mSenderName != null) {
            TextView nameText = mInflate.findViewById(R.id.m_title);
            nameText.setText(mSenderName);
        }
        TextView timeText = mInflate.findViewById(R.id.time);
        timeText.setText(getTime());

    }

    private String getTime() {
        GregorianCalendar t = new GregorianCalendar();
        String m = t.get(Calendar.MINUTE) < 10 ? "0" + t.get(Calendar.MINUTE) : String.valueOf(t.get(Calendar.MINUTE));
        return  t.get(Calendar.HOUR_OF_DAY) + ":" + m;
    }

    private void stopService() {
       Intent intent = new Intent("com.alibaba.sdk.android.push.RECEIVE");
       intent.setAction("com.alibaba.sdk.android.push.RECEIVE");
       intent.setPackage(mContext.getPackageName());
       mContext.stopService(intent);
    }

    private void enterAnimator() {
        ObjectAnimator alpha = ObjectAnimator.ofFloat(mInflate, "alpha", 0, 1);
        ObjectAnimator translationY = ObjectAnimator.ofFloat(mRoot, "translationY", -mRoot.getHeight(), 0);
        AnimatorSet set = new AnimatorSet();
        set.setDuration(400);
        set.playTogether(alpha, translationY);
        set.setInterpolator(new AccelerateDecelerateInterpolator());
        set.start();
    }

    @CallSuper
    public synchronized void show() {
        if (mInflate == null)
            throw new IllegalStateException("FloatView can not be null");

        if (mAdded) {
            mInflate.setVisibility(View.VISIBLE);
            return;
        }
        getLayoutParam();

        mInflate.setVisibility(View.VISIBLE);

        try {
            mWindowManager.addView(mInflate, mLayoutParams);
            mAdded = true;
        } catch (Exception e) {
            Log.e(TAG, "添加悬浮窗失败！！！！！！请检查悬浮窗权限");
            onAddWindowFailed(e);
        }
    }

    @CallSuper
    public void remove() {
        stopService();
        if (mInflate != null && mWindowManager != null) {
            if (mInflate.isAttachedToWindow()) {
                mWindowManager.removeView(mInflate);
                instance = null;
            }
            mAdded = false;
        }

        if (mHandler != null) {
            mHandler.removeCallbacksAndMessages(null);
        }
    }

    @CallSuper
    protected View inflate(@LayoutRes int layout) {
        mInflate = View.inflate(mContext, layout, null);
        mRoot = mInflate.findViewById(R.id.root);
        return mInflate;
    }

    protected void onAddWindowFailed(Exception e) {
        Toast.makeText(mContext, e.toString(), Toast.LENGTH_SHORT).show();
    }

    /**
     * 获取悬浮窗LayoutParam
     */
    protected void getLayoutParam() {
        mLayoutParams = getFloatLayoutParam();
        if (mRequestFocus) {
            mLayoutParams.flags = mLayoutParams.flags & ~WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
        }
        mLayoutParams.gravity = mGravity;
    }

    public int getStatusBarHeight() {
        int statusBarHeight = -1;
        @SuppressLint({"InternalInsetResource", "DiscouragedApi"})
        int resourceId = mContext.getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (resourceId != 0) {
            //根据资源ID获取响应的尺寸值
            statusBarHeight = mContext.getResources().getDimensionPixelSize(resourceId);
        }
        return statusBarHeight;
    }

    public static int dp2px(float dpValue) {
        float scale = Resources.getSystem().getDisplayMetrics().density;
        return (int) (dpValue * scale + 0.5F);
    }

    public WindowManager.LayoutParams getFloatLayoutParam() {

        WindowManager.LayoutParams layoutParams = new WindowManager.LayoutParams();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutParams.type = TYPE_APPLICATION_OVERLAY;
            //刘海屏延伸到刘海里面
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                layoutParams.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            }
        } else {
            layoutParams.type = WindowManager.LayoutParams.TYPE_PHONE;
        }
        layoutParams.flags |= WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED;

        layoutParams.flags |= WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL;
        layoutParams.flags |= WindowManager.LayoutParams.FLAG_FULLSCREEN
                | WindowManager.LayoutParams.FLAG_LAYOUT_INSET_DECOR
                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN;

        layoutParams.width = mContext.getResources().getDisplayMetrics().widthPixels - dp2px(16);
        layoutParams.height = WindowManager.LayoutParams.WRAP_CONTENT;
        layoutParams.y = getStatusBarHeight() + dp2px(16);
        Log.e(TAG, "getFloatLayoutParam: " + layoutParams.y);

        layoutParams.format = PixelFormat.TRANSPARENT;

        return layoutParams;
    }

}
