package chat.rocket.reactnative.media;

import android.content.Context;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.engine.cache.DiskLruCacheFactory;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import kotlin.jvm.Volatile;

public class GlideUtil {
    @Volatile
    private static GlideUtil mInstance;

    private Context context;

    public GlideUtil(Context context) {
        this.context = context;
    }

    public String getPath(String url) {
        if (url == null || url.equals("")) return "";
        try {
            MessageDigest messageDigest;
            String encodeStr = "";
            try {
                messageDigest = MessageDigest.getInstance("SHA-256");
                messageDigest.update(url.getBytes("UTF-8"));
                encodeStr = byte2Hex(messageDigest.digest());
            } catch (NoSuchAlgorithmException e) {
                e.printStackTrace();
            } catch (UnsupportedEncodingException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }

            String path = null;
            if (context != null) {
                path = Glide.getPhotoCacheDir(context) + "/" + encodeStr + ".0";
            } else {
                path = "/data/user/0/chat.rocket.reactnative/cache/" + DiskLruCacheFactory.DEFAULT_DISK_CACHE_DIR + "/" + encodeStr + ".0";
            }
            return path;

        } catch (Exception e) {
            e.printStackTrace();
        }
        return "";
    }


    /**
     * 将byte转为16进制
     *
     * @param bytes
     * @return
     */
    private static String byte2Hex(byte[] bytes) {
        StringBuffer stringBuffer = new StringBuffer();
        String temp;
        for (int i = 0; i < bytes.length; i++) {
            temp = Integer.toHexString(bytes[i] & 0xFF);
            if (temp.length() == 1) {
                //1得到一位的进行补0操作
                stringBuffer.append("0");
            }
            stringBuffer.append(temp);
        }
        return stringBuffer.toString();
    }

    public static GlideUtil getInstance(Context context) {
        if (mInstance == null) {
            synchronized (GlideUtil.class) {
                if (mInstance == null) {
                    mInstance = new GlideUtil(context);
                    return mInstance;
                }
            }
        }
        return mInstance;
    }
}