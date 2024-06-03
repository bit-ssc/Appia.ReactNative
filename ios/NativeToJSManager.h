//
//  NativeToJSManager.h
//  RocketChatRN
//
//  Created by appia on 2024/2/22.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

@interface NativeToJSManager : RCTEventEmitter<RCTBridgeModule>

- (void)sendMessageToRN: (NSDictionary *)dict eventName:(NSString *)name;

@end

NS_ASSUME_NONNULL_END
