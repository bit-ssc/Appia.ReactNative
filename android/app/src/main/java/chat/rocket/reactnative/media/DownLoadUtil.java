package chat.rocket.reactnative.media;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.os.Environment;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLDecoder;
import java.util.Objects;

import chat.rocket.reactnative.R;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class DownLoadUtil {

    public static class DownloadOkHttp {

        private static DownloadOkHttp downloadUtil;
        private final OkHttpClient okHttpClient;

        public static DownloadOkHttp get() {

            if (downloadUtil == null) {

                downloadUtil = new DownloadOkHttp();
            }
            return downloadUtil;
        }

        private DownloadOkHttp() {

            okHttpClient = new OkHttpClient();
        }

        /**
         * * @param url 下载连接 * @param saveDir 储存下载文件的SDCard目录 * @param listener 下载监听
         */
        public void download(Number type, String url, final String saveDir, final OnDownloadListener listener) {

            Request request = new Request.Builder().url(url).build();
            okHttpClient.newCall(request).enqueue(new Callback() {

                @Override
                public void onFailure(Call call, IOException e) {
                    // 下载失败
                    listener.onDownloadFailed();
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {

                    InputStream is = null;
                    byte[] buf = new byte[2048];
                    int len = 0;
                    FileOutputStream fos = null;
                    // 储存下载文件的目录
                    String savePath = isExistDir(saveDir);
                    try {
                        is = Objects.requireNonNull(response.body()).byteStream();
                        long total = Objects.requireNonNull(response.body()).contentLength();

                        File file = new File(savePath, getNameFromUrl(type, url));
                        fos = new FileOutputStream(file);
                        long sum = 0;
                        while ((len = is.read(buf)) != -1) {

                            fos.write(buf, 0, len);
                            sum += len;
                            int progress = (int) (sum * 1.0f / total * 100);
                            // 下载中
                            listener.onDownloading(progress);
                        }
                        fos.flush();
                        // 下载完成
                        listener.onDownloadSuccess(file);
                    } catch (Exception e) {

                        listener.onDownloadFailed();
                    } finally {

                        try {

                            if (is != null)
                                is.close();
                        } catch (IOException e) {

                        }
                        try {

                            if (fos != null)
                                fos.close();
                        } catch (IOException e) {

                        }
                    }
                }
            });
        }

        /**
         * 判断下载目录是否存在 * @param saveDir * @return * @throws IOException
         */
        private String isExistDir(String saveDir) throws IOException {

            // 下载位置
            File downloadFile = new File(saveDir, "");
            if (!downloadFile.mkdirs()) {
                downloadFile.createNewFile();
            }
            String savePath = downloadFile.getAbsolutePath();
            return savePath;
        }

        /**
         * url * 从下载连接中解析出文件名
         */
        @NonNull
        public static String getNameFromUrl(Number type, String url) {
            url = url.split("[?]")[0];
            url =  url.substring(url.lastIndexOf("/") + 1).replace(":", "_");
            // 上传文件的时，后端做了三次encode的操作，但是不知道为啥，目前这么操作
            return URLDecoder.decode(URLDecoder.decode(URLDecoder.decode(url)));
        }

        public interface OnDownloadListener {

            /**
             * 下载成功
             */
            void onDownloadSuccess(File file);

            /**
             * @param progress * 下载进度
             */
            void onDownloading(int progress);

            /**
             * 下载失败
             */
            void onDownloadFailed();
        }
    }

    public static class Download {

        private String fileSavePath = "";//保存文件的本地路径
        private String fileDownLoad_path = "";//下载的URL
        private String mfileName = "";//下载的文件名字
        private boolean mIsCancel = false;
        private int mProgress;
        private ProgressBar mProgressBar;
        private TextView text;
        private Dialog mDownloadDialog;
        private final Context context;
        private static final int DOWNLOADING = 1;
        private static final int DOWNLOAD_FINISH = 2;
        private Handler mUpdateProgressHandler = new Handler() {

            @SuppressLint("HandlerLeak")
            public void handleMessage(Message msg) {

                switch (msg.what) {

                    case DOWNLOADING:
                        // 设置进度条
                        mProgressBar.setProgress(mProgress);
                        text.setText(String.valueOf(mProgress));
                        break;
                    case DOWNLOAD_FINISH:
                        // 隐藏当前下载对话框
                        mDownloadDialog.dismiss();
                }
            }
        };

        /**
         * 下载初始化 * @param context 上下文 * @param fileDownLoad_path 下载的URL * @param mfileName 下载的文件名字 * @param fileSavePath 保存文件的本地路径
         */
        public Download(Context context, String fileDownLoad_path, String mfileName, String fileSavePath) {

            this.context = context;
            this.fileDownLoad_path = fileDownLoad_path;
            this.mfileName = mfileName;
            this.fileSavePath = Environment.getExternalStorageDirectory() + "/" + fileSavePath;
            showDownloadDialog();
        }

        /**
         * 显示正在下载的对话框
         */
        protected void showDownloadDialog() {

            AlertDialog.Builder builder = new AlertDialog.Builder(context);
            builder.setTitle("下载中");
            View view = LayoutInflater.from(context).inflate(R.layout.dialog_progress, null);
            mProgressBar = (ProgressBar) view.findViewById(R.id.id_progress);
            text = view.findViewById(R.id.id_text);
            builder.setView(view);
            builder.setNegativeButton("取消", new DialogInterface.OnClickListener() {

                @Override
                public void onClick(DialogInterface dialog, int which) {

                // 隐藏当前对话框
                    dialog.dismiss();
                // 设置下载状态为取消
                    mIsCancel = true;
                }
            });
            mDownloadDialog = builder.create();
            mDownloadDialog.show();
            // 下载文件
            downloadFile();
        }

        /**
         * 下载文件
         */
        private void downloadFile() {

            new Thread(new Runnable() {

                @Override
                public void run() {

                    try {

                        if (Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED)) {

                            File dir = new File(fileSavePath);
                            if (!dir.exists()) {

                                dir.mkdirs();
                            }
                            // 下载文件
                            HttpURLConnection conn = (HttpURLConnection) new URL(fileDownLoad_path).openConnection();
                            conn.connect();
                            InputStream is = conn.getInputStream();
                            int length = conn.getContentLength();
                            File apkFile = new File(fileSavePath, mfileName);
                            FileOutputStream fos = new FileOutputStream(apkFile);
                            int count = 0;
                            byte[] buffer = new byte[1024];
                            while (!mIsCancel) {

                                int numread = is.read(buffer);
                                count += numread;
                                // 计算进度条当前位置
                                mProgress = (int) (((float) count / length) * 100);
                                // 更新进度条
                                mUpdateProgressHandler.sendEmptyMessage(DOWNLOADING);
                                // 下载完成
                                if (numread < 0) {

                                    mUpdateProgressHandler.sendEmptyMessage(DOWNLOAD_FINISH);
                                    break;
                                }
                                fos.write(buffer, 0, numread);
                            }
                            fos.close();
                            is.close();
                        }
                    } catch (Exception e) {

                        e.printStackTrace();
                    }
                }
            }).start();
        }
    }
}