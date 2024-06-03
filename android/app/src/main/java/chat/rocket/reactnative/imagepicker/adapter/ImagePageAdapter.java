package chat.rocket.reactnative.imagepicker.adapter;

import android.app.Activity;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;

import androidx.viewpager.widget.PagerAdapter;

import com.shuyu.gsyvideoplayer.utils.OrientationUtils;
import com.shuyu.gsyvideoplayer.video.StandardGSYVideoPlayer;

import java.util.ArrayList;
import java.util.Objects;

import chat.rocket.reactnative.imagepicker.ImagePicker;
import chat.rocket.reactnative.imagepicker.bean.ImageItem;
import chat.rocket.reactnative.imagepicker.util.Utils;
import uk.co.senab.photoview.PhotoView;
import uk.co.senab.photoview.PhotoViewAttacher;


public class ImagePageAdapter extends PagerAdapter {

    private int screenWidth;
    private int screenHeight;
    private ImagePicker imagePicker;
    private ArrayList<ImageItem> images = new ArrayList<>();
    private Activity mActivity;
    public PhotoViewClickListener listener;
    private StandardGSYVideoPlayer cacheVideoPlayer;

    public ImagePageAdapter(Activity activity, ArrayList<ImageItem> images) {
        this.mActivity = activity;
        this.images = images;

        DisplayMetrics dm = Utils.getScreenPix(activity);
        screenWidth = dm.widthPixels;
        screenHeight = dm.heightPixels;
        imagePicker = ImagePicker.getInstance();
    }

    public void setData(ArrayList<ImageItem> images) {
        this.images = images;
    }

    public void setPhotoViewClickListener(PhotoViewClickListener listener) {
        this.listener = listener;
    }

    @Override
    public Object instantiateItem(ViewGroup container, int position) {

        ImageItem imageItem = images.get(position);
        String mimeType = imageItem.mimeType;
        String type = null;
        if (mimeType != null) type =  mimeType.split("/")[0];
        if (Objects.equals(type, "video")){

            StandardGSYVideoPlayer videoPlayer = new StandardGSYVideoPlayer(mActivity);
            //设置返回键
            videoPlayer.getBackButton().setVisibility(View.VISIBLE);
            //设置旋转
            OrientationUtils orientationUtils = new OrientationUtils(mActivity, videoPlayer);
            //设置全屏按键功能,这是使用的是选择屏幕，而不是全屏
            videoPlayer.getFullscreenButton().setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    orientationUtils.resolveByClick();
                }
            });
            //是否可以滑动调整
            videoPlayer.setIsTouchWiget(true);
            //设置返回按键功能
            videoPlayer.getBackButton().setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    mActivity.onBackPressed();
                }
            });
            cacheVideoPlayer = videoPlayer;
            videoPlayer.setUp(imageItem.path, false, "");
            videoPlayer.startPlayLogic();
            container.addView(videoPlayer);
            return videoPlayer;
        } else {
            PhotoView photoView = new PhotoView(mActivity);
            imagePicker.getImageLoader().displayImagePreview(mActivity, imageItem.path, photoView, screenWidth, screenHeight);
            photoView.setOnPhotoTapListener(new PhotoViewAttacher.OnPhotoTapListener() {
                @Override
                public void onPhotoTap(View view, float x, float y) {
                    if (listener != null) listener.OnPhotoTapListener(view, x, y);
                }
            });
            container.addView(photoView);
            return photoView;
        }
    }

    public StandardGSYVideoPlayer getPreVideoPlayer() {
        return cacheVideoPlayer;
    }

    @Override
    public int getCount() {
        return images.size();
    }

    @Override
    public boolean isViewFromObject(View view, Object object) {
        return view == object;
    }

    @Override
    public void destroyItem(ViewGroup container, int position, Object object) {
        container.removeView((View) object);
    }

    @Override
    public int getItemPosition(Object object) {
        return POSITION_NONE;
    }

    public interface PhotoViewClickListener {
        void OnPhotoTapListener(View view, float v, float v1);
    }
}
