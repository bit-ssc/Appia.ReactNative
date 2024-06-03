#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>  
#import "RNNotificationEventHandler.h"

@interface RNNotificationCenterListener : NSObject <UNUserNotificationCenterDelegate>

- (instancetype)initWithNotificationEventHandler:(RNNotificationEventHandler *)notificationEventHandler;

@end
