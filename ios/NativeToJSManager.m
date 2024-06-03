//
//  NativeToJSManager.m
//  RocketChatRN
//
//  Created by appia on 2024/2/22.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import "NativeToJSManager.h"


@interface NativeToJSManager()

@property(nonatomic, strong)NSArray * nameArrays;

@end

@implementation NativeToJSManager

RCT_EXPORT_MODULE();

/// 重写方法，添加事件名
-(NSArray<NSString *> *)supportedEvents {
  return self.nameArrays;
}
//重写方法，单例获取bridge。
+ (id)allocWithZone:(struct _NSZone *)zone {
  static NativeToJSManager *live = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    live = [super allocWithZone:zone];
  });
  
  return live;
}

///发送事件给js
- (void)sendMessageToRN: (NSDictionary *)dict eventName:(NSString *)name {
  [self sendEventWithName:name body:dict];
}

- (NSArray *)nameArrays {
  if (_nameArrays == nil) {
    _nameArrays = @[@"slidePhoto"];
  }
  return _nameArrays;
}

@end
