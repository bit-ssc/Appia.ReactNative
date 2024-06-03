package chat.rocket.reactnative.media;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Environment;
import android.os.Looper;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.RequestBuilder;
import com.bumptech.glide.load.DataSource;
import com.bumptech.glide.load.DecodeFormat;
import com.bumptech.glide.load.engine.DiskCacheStrategy;
import com.bumptech.glide.load.engine.GlideException;
import com.bumptech.glide.load.resource.gif.GifDrawable;
import com.bumptech.glide.request.RequestListener;
import com.bumptech.glide.request.RequestOptions;
import com.bumptech.glide.request.target.ImageViewTarget;
import com.bumptech.glide.request.target.Target;
import com.bumptech.glide.request.transition.Transition;
import com.shuyu.gsyvideoplayer.utils.OrientationUtils;

import java.io.File;
import java.util.List;
import java.util.Map;

import chat.rocket.reactnative.R;
import uk.co.senab.photoview.PhotoView;

public class ViewPagerAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    private List<Map<String, Object>> mSourceList = null;
    private Activity mContext = null;
    private MediaPlayer mPreVideoPlayer = null;


    public ViewPagerAdapter(Activity activity, List<Map<String, Object>> sourceLists) {
        mSourceList = sourceLists;
        mContext = activity;

    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        if (viewType == 0) {
            View view = LayoutInflater.from(mContext).inflate(R.layout.item_photo_view_pager, parent, false);
            return new PictureViewHolder(view);
        } else if (viewType == 1){
            View view = LayoutInflater.from(mContext).inflate(R.layout.item_video_view_pager, parent, false);
            return new MediaViewHolder(view);
        }
        return null;
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        Number type = (Number) mSourceList.get(position).get("type");
        Number width = (Number) mSourceList.get(position).get("width");
        Number height = (Number) mSourceList.get(position).get("height");
        String localPath = null, url = null;
        if (mSourceList.get(position).get("url") == null) {
            localPath =  String.valueOf(mSourceList.get(position).get("localPath"));
        } else {
            url = String.valueOf(mSourceList.get(position).get("url"));
        }
        String thumbnailUrl300 = String.valueOf(mSourceList.get(position).get("thumbnailUrl300"));
        assert type != null;
        if (type.intValue() == 0) {
            assert width != null;
            assert height != null;
            showPhoto((PictureViewHolder) holder, url, localPath, thumbnailUrl300, type.intValue(), width.intValue(), height.intValue());
        } else {
            showVideo((MediaViewHolder) holder, url, localPath, thumbnailUrl300, type.intValue());
        }
    }



    public void updateData (List<Map<String, Object>> newList) {
        mSourceList = newList;
    }

    public void showVideo(MediaViewHolder holder, String url, String localPath, String thumbnailUrl, int type) {
        MediaPlayer videoPlayer = holder.mViewPlayer;
        ImageView imageView = new ImageView(mContext);
        imageView.setScaleType(ImageView.ScaleType.CENTER_CROP);
        Glide.with(mContext).load(thumbnailUrl).into(imageView);
        videoPlayer.setThumbImageView(imageView);
        mPreVideoPlayer = videoPlayer;
        //增加title
        videoPlayer.getTitleTextView().setVisibility(View.VISIBLE);
        //设置返回键
        videoPlayer.getBackButton().setVisibility(View.VISIBLE);
        //设置旋转
        OrientationUtils orientationUtils = new OrientationUtils(mContext, videoPlayer);
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
                mContext.onBackPressed();
            }
        });
        videoPlayer.getDownloadButton().setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                download(type, url);
            }
        });
        videoPlayer.getQuitButton().setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mContext.onBackPressed();
            }
        });
        if (url == null) {
            videoPlayer.setUp(localPath, false, "");
        } else {
            videoPlayer.setUp(url, false, "");
        }

        videoPlayer.startPlayLogic();
    }

    public MediaPlayer getPreVideoPlayer() {
        return mPreVideoPlayer;
    }

    public void showPhoto(PictureViewHolder holder, String url, String localPath, String thumbnailUrl, int type, int width, int height) {
        PhotoView img= holder.mPhotoView;
        ImageView download = holder.mDownload;
        ImageView quit = holder.mQuit;
        ProgressBar loading = holder.mLoading;
        img.setScaleType(ImageView.ScaleType.FIT_CENTER);
        img.setMaximumScale(6);
        Log.e("TAG", "showPhoto: url = " + url );
        if (url == null) {
            Glide.with(mContext).load(Uri.fromFile(new File(localPath.replace("file:///", "/")))).into(img);
        } else {
            RequestBuilder<Drawable> thumbnailRequest = Glide
                    .with( mContext )
                    .load( thumbnailUrl);

            RequestOptions requestOptions = RequestOptions
                    .diskCacheStrategyOf(DiskCacheStrategy.ALL)
                    .override(Target.SIZE_ORIGINAL,Target.SIZE_ORIGINAL)
                    .format(DecodeFormat.PREFER_RGB_565);
           Glide.with(mContext).setDefaultRequestOptions(requestOptions).load(url).thumbnail(thumbnailRequest).listener(new RequestListener<Drawable>() {
                @Override
                public boolean onLoadFailed(@Nullable GlideException e, Object model, Target<Drawable> target, boolean isFirstResource) {
                    Toast.makeText(mContext, "图片加载失败", Toast.LENGTH_SHORT).show();
                    return false;
                }
                @Override
                public boolean onResourceReady(Drawable resource, Object model, Target<Drawable> target, DataSource dataSource, boolean isFirstResource) {
                    loading.setVisibility(View.GONE);
                    return false;
                }
            }).into(new ImageViewTarget<Drawable>(img) {
               @Override
               protected void setResource(@Nullable Drawable resource) {

               }

               @Override
               public void onResourceReady(@NonNull Drawable resource, @Nullable Transition<? super Drawable> transition) {
                   super.onResourceReady(resource, transition);

                    img.setImageDrawable(getSafeDrawable(resource,url,mContext));
               }
           });

        }
        download.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                download(type, url);
            }
        });
        quit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mContext.onBackPressed();
            }
        });
    }

    private Drawable getSafeDrawable(Drawable drawable, String url, Context context) {
        Long freeMemory = Runtime.getRuntime().freeMemory();//获取app可用内存

        if (drawable == null) {
            return null;
        }

        //当图片是动图的时候，放宽条件 给10M
        if (drawable instanceof GifDrawable) {
            if (freeMemory < (long) (10 * 1024 * 1024)) {
                freeMemory = (long) (10 * 1024 * 1024);
            }
        }

        if (drawable.getIntrinsicWidth() * drawable.getIntrinsicHeight() * 2 > freeMemory) {
            //当可用内存小于2M，让它去申请10M；可用内存足够的时候，就在可用内存里加载
            if (freeMemory < (long) (2 * 1024 * 1024)) {
                freeMemory = (long) (5 * 1024 * 1024);
            }

            int width = drawable.getIntrinsicWidth();
            int height = drawable.getIntrinsicHeight();

            //width * height * 2 * (1/sample2) <freeMemory,RGB_565 16位 占2字节，所以*2
            int shrinkSize = (int) Math.ceil(Math.sqrt((double) width * height * 2 / freeMemory));

            //inSampleSize要设置为2的指数，不是2的指数的数字会被向下取整，所以要用shrinkSize计算sampleSize
            int sampleSize = (int) Math.pow(2, (int) Math.ceil(Math.log(shrinkSize) / Math.log(2)));

            String filePath = GlideUtil.getInstance(context).getPath(url);
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inPreferredConfig = Bitmap.Config.RGB_565;
            options.inSampleSize = sampleSize;
            Bitmap bitmap = BitmapFactory.decodeFile(filePath, options);

            //当前路径上没有解析到图片
            if (bitmap == null) return null;
            return new BitmapDrawable(bitmap);
        } else {
            return drawable;
        }

    }
    @Override
    public int getItemViewType(int position) {
        Number type = (Number) mSourceList.get(position).get("type");
        assert type != null;
        return type.intValue();
    }

    @Override
    public int getItemCount() {
        return mSourceList.size();
    }

    private void download(int type, String url) {

        DownLoadUtil.DownloadOkHttp.get().download(type ,url, Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES) + "/Appia", new DownLoadUtil.DownloadOkHttp.OnDownloadListener() {
            @Override
            public void onDownloadSuccess(File file) {
                Intent intent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
                Uri uri = Uri.fromFile(file);
                intent.setData(uri);
                mContext.sendBroadcast(intent);
                Looper.prepare();
                Toast.makeText(mContext, "下载成功", Toast.LENGTH_SHORT).show();
                Looper.loop();
            }

            @Override
            public void onDownloading(int progress) {

            }

            @Override
            public void onDownloadFailed() {
                Looper.prepare();
                Toast.makeText(mContext, "下载失败", Toast.LENGTH_SHORT).show();
                Looper.loop();
            }
        });

    }

    class MediaViewHolder extends RecyclerView.ViewHolder {

        MediaPlayer mViewPlayer;

        public MediaViewHolder(@NonNull View itemView) {
            super(itemView);
            mViewPlayer = itemView.findViewById(R.id.video_view);
        }
    }

    class PictureViewHolder extends RecyclerView.ViewHolder {

        PhotoView mPhotoView;
        ImageView mQuit;
        ImageView mDownload;
        ProgressBar mLoading;

        public PictureViewHolder(@NonNull View itemView) {
            super(itemView);
            mPhotoView = itemView.findViewById(R.id.img);
            mQuit = itemView.findViewById(R.id.quit);
            mDownload = itemView.findViewById(R.id.download);
            mLoading =itemView.findViewById(R.id.loading_progressbar);
        }
    }
}
