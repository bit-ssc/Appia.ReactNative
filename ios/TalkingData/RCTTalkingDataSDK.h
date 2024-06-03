//
//  RCTTDAdTrackingSDK.h
//  TalkingDataSDKDemo
//
//  Created by bliss_ddo on 2019/6/21.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>

NS_ASSUME_NONNULL_BEGIN
//注意这个类的命名，如果命名成TDProfileType 就会报错。 所以这里加个RN后缀，在导出module的时候，去掉RN即可。
@interface TalkingDataProfileTypeRN : NSObject<RCTBridgeModule>
@end

@interface RCTConvert (TalkingDataProfileType)
@end

@interface TalkingDataGenderRN : NSObject<RCTBridgeModule>
@end

@interface RCTConvert (TalkingDataGender)
@end

@interface RCTTalkingDataSDK : NSObject<RCTBridgeModule>

@end

NS_ASSUME_NONNULL_END
