//
//  ServiceExtension.h
//  NotificationService
//
//  Created by wangchengyu on 2023/11/16.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UserNotifications/UNNotification.h>
#import <UserNotifications/UNNotificationContent.h>

NS_ASSUME_NONNULL_BEGIN

@interface ServiceExtension : NSObject

@property (nonatomic, strong, nullable) void (^contentHandler)(UNNotificationContent *contentToDeliver);
@property (nonatomic, strong, nullable) UNMutableNotificationContent *bestAttemptContent;
//振动计时器
@property (nonatomic, strong, nullable) dispatch_source_t vibrationTimer;

- (void)startVibrate;

- (void)stopVibrate;

@end

NS_ASSUME_NONNULL_END
