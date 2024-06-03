package chat.rocket.reactnative.media;


import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import androidx.appcompat.app.AppCompatActivity;
import androidx.viewpager2.widget.ViewPager2;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.shuyu.gsyvideoplayer.GSYVideoManager;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import chat.rocket.reactnative.MainApplication;
import chat.rocket.reactnative.R;
import chat.rocket.reactnative.nativeToJS.NativeToJSManager;


public class MediaActivity extends AppCompatActivity{

    private static final String SLIDING_PHOTO = "slidePhoto";
    private static final String SLIDING_DIRECTION = "slideDirection";
    private static final String LEFT_SLIDING = "previous";
    private ViewPager2 mPager;
    private int mStartIndex;
    private List<Map<String, Object>> mSourceList = new ArrayList<>();

    private NativeToJSManager mNativeToJSManager;

    private ViewPagerAdapter mAdapter;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_view_pager);
        getDataFromJS();
        initView();
    }

    private void getDataFromJS() {
        Intent intent = getIntent();
        mStartIndex = intent.getIntExtra("index", 0);
        mSourceList = (List<Map<String, Object>>) getIntent().getSerializableExtra("source");
        Log.e("TAG", "getDataFromJS: " + mSourceList);
    }

    private void initView() {
        mPager = findViewById(R.id.pager);
        mAdapter = new ViewPagerAdapter(this, mSourceList);
        mPager.setAdapter(mAdapter);

        mPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            private int previousPosition = -1;
            private ReactContext reactContext = ((MainApplication)getApplication()).getReactNativeHost().getReactInstanceManager().getCurrentReactContext();
            private NativeToJSManager nativeToJSManager = new NativeToJSManager((ReactApplicationContext) reactContext);
            @Override
            public void onPageScrolled(int position, float positionOffset, int positionOffsetPixels) {
                super.onPageScrolled(position, positionOffset, positionOffsetPixels);
                if (mAdapter.getPreVideoPlayer() != null) {
                    mAdapter.getPreVideoPlayer().release();
                }

                if (previousPosition != -1) {
                    // 往左滑动 ViewPager
                    if (previousPosition > position) {
                        WritableMap params = Arguments.createMap();
                        params.putString(SLIDING_DIRECTION, LEFT_SLIDING);
                        nativeToJSManager.sendEventToJS(SLIDING_PHOTO, params);
                    }
                }
                previousPosition = position;
            }
        });
        mPager.setCurrentItem(mStartIndex, false);
    }

    public ViewPagerAdapter getAdapter() {
        return mAdapter;
    }

    public ViewPager2 getPager() {
        return mPager;
    }

    @Override
    public void onBackPressed() {
        if (GSYVideoManager.backFromWindowFull(this)) {
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onPause() {
        super.onPause();
        GSYVideoManager.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        GSYVideoManager.onResume(false);
    }

    @Override
    protected void onDestroy() {
        GSYVideoManager.releaseAllVideos();
        Runtime.getRuntime().gc();
        super.onDestroy();
    }

}