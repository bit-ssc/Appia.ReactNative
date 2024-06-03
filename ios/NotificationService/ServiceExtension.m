//
//  ServiceExtension.m
//  NotificationService
//
//  Created by wangchengyu on 2023/11/16.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import "ServiceExtension.h"
#import <AudioToolbox/AudioToolbox.h>
#import <UIKit/UIApplication.h>

@interface ServiceExtension ()

@end

@implementation ServiceExtension





- (void)startVibrate {
  
  dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
     if (self.vibrationTimer) {
         dispatch_cancel(self.vibrationTimer);
         self.vibrationTimer = nil;
     }
     self.vibrationTimer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, queue);
     dispatch_time_t start = dispatch_time(DISPATCH_TIME_NOW, 1 * NSEC_PER_SEC);
     uint64_t interval = 1 * NSEC_PER_SEC;
     dispatch_source_set_timer(self.vibrationTimer, start, interval, 0);
     __block int times = 0;
     //最多震动20次，或者用户点击了推送的通知，则停止震动
     dispatch_source_set_event_handler(self.vibrationTimer, ^{
         self.contentHandler(self.bestAttemptContent);
         AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
         times++;
       NSUserDefaults *userDefaults = [[NSUserDefaults standardUserDefaults] initWithSuiteName:@"group.cn.appia.whitelabel"];
       NSString *status = [userDefaults objectForKey:@"isStopVibrate"];
       if(times >=6 ||[status isEqualToString:@"1"]){
             dispatch_suspend(self.vibrationTimer);
             dispatch_cancel(self.vibrationTimer);
         }
     });
     dispatch_resume(self.vibrationTimer);
}



- (void)stopVibrate {
  dispatch_suspend(self.vibrationTimer);
  dispatch_cancel(self.vibrationTimer);
}

//如果在30s内还没有执行完想要执行的任务，就会执行这个方法
- (void)serviceExtensionTimeWillExpire {
    // Called just before the extension will be terminated by the system.
    // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
    if (self.vibrationTimer) {
        dispatch_cancel(self.vibrationTimer);
        self.vibrationTimer = nil;
    }
    self.contentHandler(self.bestAttemptContent);
}

@end
