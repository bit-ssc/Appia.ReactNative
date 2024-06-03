package chat.rocket.reactnative.utils;

import android.app.ActivityManager;
import android.content.Context;

import java.util.List;

public class ApplicationUtils {
    public static void moveAppToFront(Context context) {
        final ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        assert activityManager != null;
        List<ActivityManager.RunningTaskInfo> runningTasks = activityManager.getRunningTasks(100);
        for (final ActivityManager.RunningTaskInfo runningTask : runningTasks) {
            assert runningTask.topActivity != null;
            if (runningTask.topActivity.getPackageName().equals(context.getPackageName())) {
                activityManager.moveTaskToFront(runningTask.id, 0);
                break;
            }
        }
    }
}
