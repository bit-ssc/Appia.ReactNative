package chat.rocket.reactnative.media;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.widget.ImageView;

import com.shuyu.gsyvideoplayer.video.StandardGSYVideoPlayer;

import chat.rocket.reactnative.R;

public class MediaPlayer extends StandardGSYVideoPlayer {

    private ImageView mDownloadView;
    private ImageView mQuitView;

    public MediaPlayer(Context context, Boolean fullFlag) {
        super(context, fullFlag);
    }

    public MediaPlayer(Context context) {
        super(context);
    }

    public MediaPlayer(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    @Override
    protected void init(Context context) {
        super.init(context);
        mDownloadView = findViewById(R.id.download);
        mQuitView = findViewById(R.id.quit);

    }

    @Override
    public int getLayoutId() {
        return R.layout.layout_media_video;
    }

    public View getDownloadButton() {
        return mDownloadView;
    }

    public View getQuitButton() {
        return mQuitView;
    }

}
