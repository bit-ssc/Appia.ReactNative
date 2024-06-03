//
//  RCTTDAdTrackingSDK.m
//  TalkingDataSDKDemo
//
//  Created by bliss_ddo on 2019/6/21.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "RCTTalkingDataSDK.h"
#import "TalkingDataSDK.h"


@implementation TalkingDataProfileTypeRN

RCT_EXPORT_MODULE(TalkingDataProfileType);

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSDictionary *)constantsToExport
{
  return
  @{
    @"ANONYMOUS":@(TalkingDataProfileTypeAnonymous),
    @"REGISTERED":@(TalkingDataProfileTypeRegistered),
    @"SINA_WEIBO":@(TalkingDataProfileTypeSinaWeibo),
    @"QQ":@(TalkingDataProfileTypeQQ),
    @"QQ_WEIBO":@(TalkingDataProfileTypeQQWeibo),
    @"ND91":@(TalkingDataProfileTypeND91),
    @"WEIXIN":@(TalkingDataProfileTypeWeiXin),
    @"TYPE1":@(TalkingDataProfileTypeType1),
    @"TYPE2":@(TalkingDataProfileTypeType2),
    @"TYPE3":@(TalkingDataProfileTypeType3),
    @"TYPE4":@(TalkingDataProfileTypeType4),
    @"TYPE5":@(TalkingDataProfileTypeType5),
    @"TYPE6":@(TalkingDataProfileTypeType6),
    @"TYPE7":@(TalkingDataProfileTypeType7),
    @"TYPE8":@(TalkingDataProfileTypeType8),
    @"TYPE9":@(TalkingDataProfileTypeType9),
    @"TYPE10":@(TalkingDataProfileTypeType10),
    };
}

@end


@implementation RCTConvert (TalkingDataProfileType)

RCT_ENUM_CONVERTER(TalkingDataProfileType,
                   (@{
                      @"ANONYMOUS":@(TalkingDataProfileTypeAnonymous),
                      @"REGISTERED":@(TalkingDataProfileTypeRegistered),
                      @"SINA_WEIBO":@(TalkingDataProfileTypeSinaWeibo),
                      @"QQ":@(TalkingDataProfileTypeQQ),
                      @"QQ_WEIBO":@(TalkingDataProfileTypeQQWeibo),
                      @"ND91":@(TalkingDataProfileTypeND91),
                      @"WEIXIN":@(TalkingDataProfileTypeWeiXin),
                      @"TYPE1":@(TalkingDataProfileTypeType1),
                      @"TYPE2":@(TalkingDataProfileTypeType2),
                      @"TYPE3":@(TalkingDataProfileTypeType3),
                      @"TYPE4":@(TalkingDataProfileTypeType4),
                      @"TYPE5":@(TalkingDataProfileTypeType5),
                      @"TYPE6":@(TalkingDataProfileTypeType6),
                      @"TYPE7":@(TalkingDataProfileTypeType7),
                      @"TYPE8":@(TalkingDataProfileTypeType8),
                      @"TYPE9":@(TalkingDataProfileTypeType9),
                      @"TYPE10":@(TalkingDataProfileTypeType10),
                      }),
                   TalkingDataProfileTypeAnonymous,
                   integerValue)

@end

@implementation TalkingDataGenderRN

RCT_EXPORT_MODULE(TalkingDataGender);

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}


- (NSDictionary *)constantsToExport
{
  return
  @{
    @"UNKNOWN":@(TalkingDataGenderUnknown),
    @"MALE":@(TalkingDataGenderMale),
    @"FEMALE":@(TalkingDataGenderFemale),
    };
}

@end


@implementation RCTConvert (TalkingDataGender)

RCT_ENUM_CONVERTER(TalkingDataGender,
                   (@{
                      @"UNKNOWN":@(TalkingDataGenderUnknown),
                      @"MALE":@(TalkingDataGenderMale),
                      @"FEMALE":@(TalkingDataGenderFemale),
                      }),
                   TalkingDataGenderUnknown,
                   integerValue)

@end


@implementation RCTTalkingDataSDK
RCT_EXPORT_MODULE(TalkingDataSDK);

RCT_EXPORT_METHOD(init:(NSString *)appID channelId:(NSString *)channelId custom:(NSString *)custom)
{
  [TalkingDataSDK init:appID channelId:channelId custom:custom];
}

RCT_REMAP_METHOD(getDeviceID, getDeviceID:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString * deviceId = [TalkingDataSDK getDeviceId];
//  NSArray *events = @[deviceId];
  if (deviceId) {
    resolve(deviceId);
  } else {
    reject(@"",@"",nil);
  }
}

RCT_EXPORT_METHOD(setVerboseLogDisable)
{
  [TalkingDataSDK setVerboseLogDisable];
}

RCT_EXPORT_METHOD(setLatitude:(double)latitude longitude:(double)longitude)
{
  [TalkingDataSDK setLatitude:latitude longitude:longitude];
}

RCT_EXPORT_METHOD(onPageBegin:(NSString *)pageName)
{
  [TalkingDataSDK onPageBegin:pageName];
}

RCT_EXPORT_METHOD(onPageEnd:(NSString *)pageName)
{
  [TalkingDataSDK onPageEnd:pageName];
}

RCT_EXPORT_METHOD(onEvent:(NSString *)eventId
                  parameters:(NSDictionary*)parameters)
{
  [TalkingDataSDK onEvent:eventId parameters:parameters];
}

RCT_EXPORT_METHOD(setGlobalKV:(NSString *)key value:(id)value)
{
  [TalkingDataSDK setGlobalKV:key value:value];
}
RCT_EXPORT_METHOD(removeGlobalKV:(NSString *)key)
{
  [TalkingDataSDK removeGlobalKV:key];
}

RCT_EXPORT_METHOD(onReceiveDeepLink:(NSString *)link)
{
  NSURL *url = [NSURL URLWithString:link];
  [TalkingDataSDK onReceiveDeepLink:url];
}

RCT_EXPORT_METHOD(onRegister:(NSString *)profileId profile:(NSString *)profile invitationCode:(NSString *)invitationCode)
{
  TalkingDataProfile *p = [TalkingDataProfile createProfile];
  NSError * error = nil;
  NSDictionary * dictProfile = [NSJSONSerialization JSONObjectWithData:[profile dataUsingEncoding:NSUTF8StringEncoding] options:0 error:&error];
  p.name = dictProfile[@"name"];
  p.type = (TalkingDataProfileType)[dictProfile[@"type"] unsignedIntegerValue];
  [TalkingDataSDK onRegister:profileId profile:p invitationCode:invitationCode];
}

RCT_EXPORT_METHOD(onLogin:(NSString *)profileId profile:(NSString *)profile)
{
  TalkingDataProfile *p = [TalkingDataProfile createProfile];
  NSError * error = nil;
  NSDictionary * dictProfile = [NSJSONSerialization JSONObjectWithData:[profile dataUsingEncoding:NSUTF8StringEncoding] options:0 error:&error];
  p.name = dictProfile[@"name"];
  p.type = (TalkingDataProfileType)[dictProfile[@"type"] unsignedIntegerValue];
  [TalkingDataSDK onLogin:profileId profile:p];
}

RCT_EXPORT_METHOD(onProfileUpdate:(NSString *)profile)
{
  TalkingDataProfile *p = [TalkingDataProfile createProfile];
  NSError * error = nil;
  NSDictionary * dictProfile = [NSJSONSerialization JSONObjectWithData:[profile dataUsingEncoding:NSUTF8StringEncoding] options:0 error:&error];
  p.name = dictProfile[@"name"];
  p.type = (TalkingDataProfileType)[dictProfile[@"type"] unsignedIntegerValue];
  p.gender = (TalkingDataGender)[dictProfile[@"gender"] unsignedIntegerValue];
  p.age = [dictProfile[@"age"] intValue];
  p.property1 = dictProfile[@"value1"];
  p.property2 = dictProfile[@"value2"];
  p.property3 = dictProfile[@"value3"];
  p.property4 = dictProfile[@"value4"];
  p.property5 = dictProfile[@"value5"];
  p.property6 = dictProfile[@"value6"];
  p.property7 = dictProfile[@"value7"];
  p.property8 = dictProfile[@"value8"];
  p.property9 = dictProfile[@"value9"];
  p.property10 = dictProfile[@"value10"];
  [TalkingDataSDK onProfileUpdate:p];
}

RCT_EXPORT_METHOD(onCreateCard:(NSString *)profile method:(NSString *)method content:(NSString *)content)
{
  [TalkingDataSDK onCreateCard:profile method:method content:content];
}

RCT_EXPORT_METHOD(onFavorite:(NSString *)category content:(NSString *)content)
{
  [TalkingDataSDK onFavorite:category content:content];
}

RCT_EXPORT_METHOD(onShare:(NSString *)profile content:(NSString *)content)
{
  [TalkingDataSDK onShare:profile content:content];
}

RCT_EXPORT_METHOD(onPunch:(NSString *)profile punchId:(NSString *)punchId)
{
  [TalkingDataSDK onPunch:profile punchId:punchId];
}


RCT_EXPORT_METHOD(onSearch:(NSString *)search)
{
  TalkingDataSearch * s = [[TalkingDataSearch alloc]init];
  NSError * error = nil;
  NSDictionary * dictADS = [NSJSONSerialization JSONObjectWithData:[search dataUsingEncoding:NSUTF8StringEncoding] options:0 error:&error];
  s.category = dictADS[@"category"];
  s.content = dictADS[@"content"];
//  s.destination = dictADS[@"destination"];
//  s.origin = dictADS[@"origin"];
//  s.itemId = dictADS[@"item_id"];
//  s.itemLocationId = dictADS[@"item_location_id"];
//  s.startDate = [dictADS[@"startDate"] longLongValue];
//  s.endDate = [dictADS[@"endDate"] longLongValue];
  [TalkingDataSDK onSearch:s];
}

/*

RCT_EXPORT_METHOD(onContact:(NSString *)profile content:(NSString *)content)
{
  [TalkingDataSDK onContact:profile content:content];
}

RCT_EXPORT_METHOD(onPay:(NSString *)profile orderId:(NSString *)orderId amount:(int)amount currencyType:(NSString *)currencyType paymentType:(NSString *)paymentType itemId:(NSString *)itemId itemCount:(int)itemCount)
{
  [TalkingDataSDK onPay:profile orderId:orderId amount:amount currencyType:currencyType paymentType:paymentType itemId:itemId itemCount:itemCount];
}

RCT_EXPORT_METHOD(onChargeBack:(NSString *)profile orderId:(NSString *)orderId reason:(NSString *)reason type:(NSString *)type)
{
  [TalkingDataSDK onChargeBack:profile orderId:orderId reason:reason type:type];
}

RCT_EXPORT_METHOD(onReservation:(NSString *)profile reservationId:(NSString *)reservationId category:(NSString *)category amount:(int)amount term:(NSString *)term)
{
  [TalkingDataSDK onReservation:profile reservationId:reservationId category:category amount:amount term:term];
}

RCT_EXPORT_METHOD(onBooking:(NSString *)profile bookingId:(NSString *)bookingId category:(NSString *)category amount:(int)amount content:(NSString *)content)
{
  [TalkingDataSDK onBooking:profile bookingId:bookingId category:category amount:amount content:content];
}

RCT_EXPORT_METHOD(onViewItem:(NSString *)itemId category:(NSString *)category name:(NSString *)name unitPrice:(int)unitPrice)
{
  [TalkingDataSDK onViewItem:itemId category:category name:name unitPrice:unitPrice];
}

RCT_EXPORT_METHOD(onAddItemToShoppingCart:(NSString *)itemId category:(NSString *)category name:(NSString *)name unitPrice:(int)unitPrice amount:(int)amount)
{
  [TalkingDataSDK onAddItemToShoppingCart:itemId category:category name:name unitPrice:unitPrice amount:amount];
}

RCT_EXPORT_METHOD(onViewShoppingCart:(NSString *)shoppingCartString)
{
  if (!shoppingCartString) {
    return;
  }

  NSError * error = nil;
  NSDictionary * shoppingCartDict = [NSJSONSerialization JSONObjectWithData:[shoppingCartString dataUsingEncoding:NSUTF8StringEncoding] options:0 error:&error];
  if (!error) {
    NSArray * items = [shoppingCartDict objectForKey:@"items"];
    TalkingDataShoppingCart * shoppingCart = [TalkingDataShoppingCart createShoppingCart];
    if (!shoppingCart) {
      return;
    }
    if (items && items.count!=0) {
      for (NSDictionary * eachItem in items) {
        NSString * itemId = [eachItem objectForKey:@"itemId"];
        NSString * category = [eachItem objectForKey:@"category"];
        NSString * name = [eachItem objectForKey:@"name"];
        NSString * unitPrice = [eachItem objectForKey:@"unitPrice"];
        NSString * amount = [eachItem objectForKey:@"amount"];
        [shoppingCart addItem:itemId category:category name:name unitPrice:unitPrice.intValue amount:amount.intValue];
      }
    }
    [TalkingDataSDK onViewShoppingCart:shoppingCart];
  }
}



RCT_EXPORT_METHOD(onPlaceOrder:(NSString *)orderString profile:(NSString *)profile)
{
  NSError * error = nil;
  NSDictionary * orderDict = [NSJSONSerialization JSONObjectWithData:[orderString dataUsingEncoding:NSUTF8StringEncoding] options:0 error:&error];
  if (!error) {
    NSString * orderId = [orderDict objectForKey:@"orderId"];
    NSString * total = [orderDict objectForKey:@"total"];
    NSString * currencyType = [orderDict objectForKey:@"currencyType"];
    NSArray * items = [orderDict objectForKey:@"items"];
    TalkingDataOrder * order = [TalkingDataOrder createOrder:orderId total:[total intValue] currencyType:currencyType];

    if (!order) {
      return;
    }
    if (items && items.count!=0) {
      for (NSDictionary * eachItem in items) {
        NSString * itemId = [eachItem objectForKey:@"itemId"];
        NSString * category = [eachItem objectForKey:@"category"];
        NSString * name = [eachItem objectForKey:@"name"];
        NSString * unitPrice = [eachItem objectForKey:@"unitPrice"];
        NSString * amount = [eachItem objectForKey:@"amount"];
        [order addItem:itemId category:category name:name unitPrice:[unitPrice intValue] amount:[amount intValue]];
      }
    }
    [TalkingDataSDK onPlaceOrder:order profileId:profile];
    
  }
}

RCT_EXPORT_METHOD(onOrderPaySucc:(NSString *)orderString paymentType:(NSString *)paymentType profile:(NSString *)profile){
  NSError * error = nil;
  NSDictionary * orderDict = [NSJSONSerialization JSONObjectWithData:[orderString dataUsingEncoding:NSUTF8StringEncoding] options:0 error:&error];
  if (!error) {
    NSString * orderId = [orderDict objectForKey:@"orderId"];
    NSString * total = [orderDict objectForKey:@"total"];
    NSString * currencyType = [orderDict objectForKey:@"currencyType"];
    NSArray * items = [orderDict objectForKey:@"items"];
    TalkingDataOrder * order = [TalkingDataOrder createOrder:orderId total:[total intValue] currencyType:currencyType];

    if (!order) {
      return;
    }
    if (items && items.count!=0) {
      for (NSDictionary * eachItem in items) {
        NSString * itemId = [eachItem objectForKey:@"itemId"];
        NSString * category = [eachItem objectForKey:@"category"];
        NSString * name = [eachItem objectForKey:@"name"];
        NSString * unitPrice = [eachItem objectForKey:@"unitPrice"];
        NSString * amount = [eachItem objectForKey:@"amount"];
        [order addItem:itemId category:category name:name unitPrice:[unitPrice intValue] amount:[amount intValue]];
      }
    }
    [TalkingDataSDK onOrderPaySucc:order paymentType:paymentType profileId:profile];
  }
}

RCT_EXPORT_METHOD(onCancelOrder:(NSString *)orderString){
  NSError * error = nil;
  NSDictionary * orderDict = [NSJSONSerialization JSONObjectWithData:[orderString dataUsingEncoding:NSUTF8StringEncoding] options:0 error:&error];
  if (!error) {
    NSString * orderId = [orderDict objectForKey:@"orderId"];
    NSString * total = [orderDict objectForKey:@"total"];
    NSString * currencyType = [orderDict objectForKey:@"currencyType"];
    NSArray * items = [orderDict objectForKey:@"items"];
    TalkingDataOrder * order = [TalkingDataOrder createOrder:orderId total:[total intValue] currencyType:currencyType];

    if (!order) {
      return;
    }
    if (items && items.count!=0) {
      for (NSDictionary * eachItem in items) {
        NSString * itemId = [eachItem objectForKey:@"itemId"];
        NSString * category = [eachItem objectForKey:@"category"];
        NSString * name = [eachItem objectForKey:@"name"];
        NSString * unitPrice = [eachItem objectForKey:@"unitPrice"];
        NSString * amount = [eachItem objectForKey:@"amount"];
        [order addItem:itemId category:category name:name unitPrice:[unitPrice intValue] amount:[amount intValue]];
      }
    }
    [TalkingDataSDK onCancelOrder:order];
  }
}



RCT_EXPORT_METHOD(onCredit:(NSString *)profile amount:(int)amount content:(NSString *)content)
{
  [TalkingDataSDK onCredit:profile amount:amount content:content];
}

RCT_EXPORT_METHOD(onTransaction:(NSString *)profile transaction:(NSString *)transactionString)
{
  TalkingDataTransaction * t = [[TalkingDataTransaction alloc]init];
  NSError * error = nil;
  NSDictionary * dictADS = [NSJSONSerialization JSONObjectWithData:[transactionString dataUsingEncoding:NSUTF8StringEncoding] options:0 error:&error];
  t.transactionId = dictADS[@"transactionId"];
  t.category = dictADS[@"category"];
  t.amount = [dictADS[@"amount"] intValue];
  t.personA = dictADS[@"personA"];
  t.personB = dictADS[@"personB"];
  t.startDate = [dictADS[@"startDate"] longLongValue];
  t.endDate = [dictADS[@"endDate"] longLongValue];
  t.currencyType = dictADS[@"currencyType"];
  t.content = dictADS[@"content"];

  [TalkingDataSDK onTransaction:profile transaction:t];
}

RCT_EXPORT_METHOD(onCreateRole:(NSString *)name)
{
  [TalkingDataSDK onCreateRole:name];
}

RCT_EXPORT_METHOD(onLevelPass:(NSString *)profile levelId:(NSString *)levelId)
{
  [TalkingDataSDK onLevelPass:profile levelId:levelId];
}

RCT_EXPORT_METHOD(onGuideFinished:(NSString *)profile content:(NSString *)content)
{
  [TalkingDataSDK onGuideFinished:profile content:content];
}

RCT_EXPORT_METHOD(onLearn:(NSString *)profile course:(NSString *)course begin:(int64_t)begin duration:(int)duration)
{
  [TalkingDataSDK onLearn:profile course:course begin:begin duration:duration];
}

RCT_EXPORT_METHOD(onPreviewFinished:(NSString *)profile content:(NSString *)content)
{
  [TalkingDataSDK onPreviewFinished:profile content:content];
}

RCT_EXPORT_METHOD(onRead:(NSString *)profile book:(NSString *)book begin:(int64_t)begin duration:(int)duration)
{
  [TalkingDataSDK onRead:profile book:book begin:begin duration:duration];
}

RCT_EXPORT_METHOD(onFreeFinished:(NSString *)profile content:(NSString *)content)
{
  [TalkingDataSDK onFreeFinished:profile content:content];
}

RCT_EXPORT_METHOD(onAchievementUnlock:(NSString *)profile achievementId:(NSString *)achievementId)
{
  [TalkingDataSDK onAchievementUnlock:profile achievementId:achievementId];
}

RCT_EXPORT_METHOD(onBrowse:(NSString *)profile content:(NSString *)content begin:(int64_t)begin duration:(int)duration)
{
  [TalkingDataSDK onBrowse:profile content:content begin:begin duration:duration];
}

RCT_EXPORT_METHOD(onTrialFinished:(NSString *)profile content:(NSString *)content)
{
  [TalkingDataSDK onTrialFinished:profile content:content];
}
*/

@end
