package chat.rocket.reactnative.imagepicker;


import android.database.Cursor;
import android.os.Bundle;
import android.provider.MediaStore;

import androidx.fragment.app.FragmentActivity;
import androidx.loader.app.LoaderManager;
import androidx.loader.content.CursorLoader;
import androidx.loader.content.Loader;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import chat.rocket.reactnative.R;
import chat.rocket.reactnative.imagepicker.bean.ImageFolder;
import chat.rocket.reactnative.imagepicker.bean.ImageItem;


public class ImageDataSource implements LoaderManager.LoaderCallbacks<Cursor> {

    public static final int LOADER_ALL = 0;         //加载所有图片
    public static final int LOADER_CATEGORY = 1;    //分类加载图片
    private static int OFFSET_LOADING = 1000;
    private final String[] IMAGE_PROJECTION = {     //查询图片需要的数据列
            MediaStore.Files.FileColumns.DISPLAY_NAME,   //图片的显示名称  aaa.jpg
            MediaStore.Files.FileColumns.DATA,           //图片的真实路径  /storage/emulated/0/pp/downloader/wallpaper/aaa.jpg
            MediaStore.Files.FileColumns.SIZE,           //图片的大小，long型  132492
            MediaStore.Files.FileColumns.WIDTH,          //图片的宽度，int型  1920
            MediaStore.Files.FileColumns.HEIGHT,         //图片的高度，int型  1080
            MediaStore.Files.FileColumns.MIME_TYPE,      //图片的类型     image/jpeg
            MediaStore.Files.FileColumns.DATE_ADDED};    //图片被添加的时间，long型  1450518608

    private FragmentActivity activity;
    private OnImagesLoadedListener loadedListener;                     //图片加载完成的回调接口
    private ArrayList<ImageFolder> imageFolders = new ArrayList<>();   //所有的图片文件夹

    private Cursor lastData = null;

    /**
     * @param activity       用于初始化LoaderManager，需要兼容到2.3
     * @param path           指定扫描的文件夹目录，可以为 null，表示扫描所有图片
     * @param loadedListener 图片加载完成的监听
     */
    public ImageDataSource(FragmentActivity activity, String path, OnImagesLoadedListener loadedListener) {
        this.activity = activity;
        this.loadedListener = loadedListener;

        LoaderManager loaderManager = activity.getSupportLoaderManager();
        if (path == null) {
            loaderManager.initLoader(LOADER_ALL, null, this);//加载所有的图片
        } else {
            //加载指定目录的图片
            Bundle bundle = new Bundle();
            bundle.putString("path", path);
            loaderManager.initLoader(LOADER_CATEGORY, bundle, this);
        }
    }

    @Override
    public Loader<Cursor> onCreateLoader(int id, Bundle args) {
        CursorLoader cursorLoader = null;
        //查询条件是查询所有的视频和图片
        String selection = MediaStore.Files.FileColumns.MEDIA_TYPE + "="
                + MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE
                + " OR "
                + MediaStore.Files.FileColumns.MEDIA_TYPE + "="
                + MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO;
        //扫描所有图片
        if (id == LOADER_ALL)
            cursorLoader = new CursorLoader(activity, MediaStore.Files.getContentUri("external") , IMAGE_PROJECTION, selection, null, IMAGE_PROJECTION[6] + " DESC");
        //扫描某个图片文件夹
        if (id == LOADER_CATEGORY)
            cursorLoader = new CursorLoader(activity, MediaStore.Files.getContentUri("external"), IMAGE_PROJECTION, IMAGE_PROJECTION[1] + " like '%" + args.getString("path") + "%'", null, IMAGE_PROJECTION[6] + " DESC");

        return cursorLoader;
    }

    private ImageFolder allImagesFolder = new ImageFolder();

    @Override
    public void onLoadFinished(Loader<Cursor> loader, Cursor data) {
        if (lastData == data) return; // 加载图片耗时,导致退回浏览页面的时候很慢
        lastData = data;
        imageFolders.clear();
        if (data != null && data.moveToFirst()) {
            ArrayList<ImageItem> allImages = new ArrayList<>();   //所有图片的集合,不分文件夹
            new Thread(new Runnable() {
                @Override
                public void run() {
                    int count = 0;
                    try {
                        do {
//                        防止activity关闭，data取消了，导致崩溃
                            if (activity.isDestroyed() || data.isClosed()) return;
                            if (count == OFFSET_LOADING) {
                                makeAllImagesFolder(data, allImages);
                                callback(data, allImages);
                                count = 0;
                            }
                            //查询数据
                            String imageName = data.getString(data.getColumnIndexOrThrow(IMAGE_PROJECTION[0]));
                            String imagePath = data.getString(data.getColumnIndexOrThrow(IMAGE_PROJECTION[1]));

                            File file = new File(imagePath);
                            if (!file.exists() || file.length() <= 0) {
                                continue;
                            }

                            long imageSize = data.getLong(data.getColumnIndexOrThrow(IMAGE_PROJECTION[2]));
                            int imageWidth = data.getInt(data.getColumnIndexOrThrow(IMAGE_PROJECTION[3]));
                            int imageHeight = data.getInt(data.getColumnIndexOrThrow(IMAGE_PROJECTION[4]));
                            String imageMimeType = data.getString(data.getColumnIndexOrThrow(IMAGE_PROJECTION[5]));
                            long imageAddTime = data.getLong(data.getColumnIndexOrThrow(IMAGE_PROJECTION[6]));
                            //封装实体
                            ImageItem imageItem = new ImageItem();
                            imageItem.name = imageName;
                            imageItem.path = imagePath;
                            imageItem.size = imageSize;
                            imageItem.width = imageWidth;
                            imageItem.height = imageHeight;
                            imageItem.mimeType = imageMimeType;
                            imageItem.addTime = imageAddTime;
                            allImages.add(imageItem);
                            //根据父路径分类存放图片
                            File imageFile = new File(imagePath);
                            File imageParentFile = imageFile.getParentFile();
                            ImageFolder imageFolder = new ImageFolder();
                            imageFolder.name = imageParentFile.getName();
                            imageFolder.path = imageParentFile.getAbsolutePath();

                            if (!imageFolders.contains(imageFolder)) {
                                ArrayList<ImageItem> images = new ArrayList<>();
                                images.add(imageItem);
                                imageFolder.cover = imageItem;
                                imageFolder.images = images;
                                imageFolders.add(imageFolder);
                            } else {
                                imageFolders.get(imageFolders.indexOf(imageFolder)).images.add(imageItem);
                            }
                            count ++;
                        } while (data.moveToNext());
                        makeAllImagesFolder(data, allImages);
                        callback(data, allImages);
                    } catch (Exception e ) {
                        e.printStackTrace();
                    }
                }
            }).start();
        }
    }

    private void makeAllImagesFolder(Cursor data, ArrayList<ImageItem> allImages) {
        if (data.getCount() > 0 && allImages.size()>0) {
            //构造所有图片的集合
            if (imageFolders.contains(allImagesFolder)) {
                allImagesFolder.images = allImages;
                imageFolders.set(0, allImagesFolder);  //确保第一条是所有图片
            } else {
                allImagesFolder.name = activity.getResources().getString(R.string.ip_all_images);
                allImagesFolder.path = "/";
                allImagesFolder.cover = allImages.get(0);
                allImagesFolder.images = allImages;
                imageFolders.add(0, allImagesFolder);  //确保第一条是所有图片
            }
        }
    }

    private void  callback(Cursor data, ArrayList<ImageItem> allImages) {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                ImagePicker.getInstance().setImageFolders(imageFolders);
                loadedListener.onImagesLoaded(imageFolders);
            }
        });

    }

    @Override
    public void onLoaderReset(Loader<Cursor> loader) {
        System.out.println("--------");
    }

    /** 所有图片加载完成的回调接口 */
    public interface OnImagesLoadedListener {
        void onImagesLoaded(List<ImageFolder> imageFolders);
    }
}
