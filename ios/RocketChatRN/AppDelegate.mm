#import "AppDelegate.h"
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>
#import "RNNotifications.h"
#import "RNBootSplash.h"
#import "Orientation.h"
#import <Firebase.h>
#import <Bugsnag/Bugsnag.h>
#import <MMKV/MMKV.h>
#import <CoreTelephony/CTCellularData.h>
#import <React/RCTLog.h>

#import <React/RCTAppSetupUtils.h>
#if RCT_NEW_ARCH_ENABLED
#import <React/CoreModulesPlugins.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTFabricSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <react/config/ReactNativeConfig.h>
@interface AppDelegate () <RCTCxxBridgeDelegate, RCTTurboModuleManagerDelegate> {
  RCTTurboModuleManager *_turboModuleManager;
  RCTSurfacePresenterBridgeAdapter *_bridgeAdapter;
  std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
  facebook::react::ContextContainer::Shared _contextContainer;
}
@end
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  RCTAppSetupPrepareApp(application);
  RCTBridge *bridge = [self.reactDelegate createBridgeWithDelegate:self launchOptions:launchOptions];
#if RCT_NEW_ARCH_ENABLED
  _contextContainer = std::make_shared<facebook::react::ContextContainer const>();
  _reactNativeConfig = std::make_shared<facebook::react::EmptyReactNativeConfig const>();
  _contextContainer->insert("ReactNativeConfig", _reactNativeConfig);
  _bridgeAdapter = [[RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:bridge contextContainer:_contextContainer];
  bridge.surfacePresenter = _bridgeAdapter.surfacePresenter;
#endif
  if(![FIRApp defaultApp]){
    [FIRApp configure];
  }
  [Bugsnag start];

  
  NSDictionary *properties;
  // AppGroup MMKV
  NSString *groupDir = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:[[NSBundle mainBundle] objectForInfoDictionaryKey:@"AppGroup"]].path;
  [MMKV initializeMMKV:nil groupDir:groupDir logLevel:MMKVLogInfo];
  
  NSString *fontValue = [self mmkvValue:@"default_font_setting"];
  if (fontValue) {
    properties = @{@"default_font_setting":fontValue};
    
    if (![fontValue isEqualToString:@"Follow_System_Setting"]) {
      [UILabel appearance].adjustsFontForContentSizeCategory = NO;
      [UITextView appearance].adjustsFontForContentSizeCategory = NO;
      [UITextField appearance].adjustsFontForContentSizeCategory = NO;
    }
  }

  UIView *rootView = [self.reactDelegate createRootViewWithBridge:bridge moduleName:@"RocketChatRN" initialProperties:properties];

  if (@available(iOS 13.0, *)) {
    rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
    rootView.backgroundColor = [UIColor whiteColor];
  }
  


  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  UINavigationController *navigationController = [[UINavigationController alloc]initWithRootViewController:rootViewController];
  navigationController.navigationBarHidden = YES;
  rootViewController.view = rootView;
  self.window.rootViewController = navigationController;
  [self.window makeKeyAndVisible];
  [RNNotifications startMonitorNotifications];
  [ReplyNotification configure];



  [RNBootSplash initWithStoryboard:@"LaunchScreen" rootView:rootView];
  
  [self checkNetworkPermisson];

  // [self checkNotificationPermission]; //在原生层检测权限会有presentVC冲突问题
  // 静音模式下可播放声音
  AVAudioSession *audioSession = [AVAudioSession sharedInstance];
  [audioSession setCategory:AVAudioSessionCategoryPlayback error:nil];
  
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

#if RCT_NEW_ARCH_ENABLED
#pragma mark - RCTCxxBridgeDelegate
- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  _turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge
                                                             delegate:self
                                                            jsInvoker:bridge.jsCallInvoker];
  return RCTAppSetupDefaultJsExecutorFactory(bridge, _turboModuleManager);
}
#pragma mark RCTTurboModuleManagerDelegate
- (Class)getModuleClassFromName:(const char *)name
{
  return RCTCoreModulesClassProvider(name);
}
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return nullptr;
}
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                     initParams:
                                                         (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}
- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return RCTAppSetupDefaultModuleFromClass(moduleClass);
}
#endif

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  NSLog(@"devoceToken =%@",deviceToken);
  [RNNotifications didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  [RNNotifications didFailToRegisterForRemoteNotificationsWithError:error];
}

- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}

- (UIInterfaceOrientationMask)application:(UIApplication *)application supportedInterfaceOrientationsForWindow:(UIWindow *)window
{
  return [Orientation getOrientation];
}

- (void)applicationWillEnterForeground:(UIApplication *)application{
  [self stopBackRuning];
  CFNotificationCenterRef notification = CFNotificationCenterGetDarwinNotifyCenter ();
  NSString *identifier = @"stopVibrate";
  CFStringRef str = (__bridge CFStringRef)identifier;
  CFNotificationCenterPostNotification(notification, str,NULL, NULL, YES);
  NSUserDefaults *shared = [[NSUserDefaults standardUserDefaults]     initWithSuiteName:@"group.cn.appia.whitelabel"];
  [shared setObject:@"1" forKey:@"isStopVibrate"];
  [shared synchronize];
}

- (void)applicationDidEnterBackground:(UIApplication *)application{
  if (self.uploadingFile) {
    [self startBackRuning];
  }
  CFNotificationCenterRef notification = CFNotificationCenterGetDarwinNotifyCenter ();
  NSString *identifier = @"startVibrate";
  CFStringRef str = (__bridge CFStringRef)identifier;
  CFNotificationCenterPostNotification(notification, str,NULL,NULL, YES);
  NSUserDefaults *shared = [[NSUserDefaults standardUserDefaults]     initWithSuiteName:@"group.cn.appia.whitelabel"];
  [shared setObject:@"0" forKey:@"isStopVibrate"];
  [shared synchronize];
}


- (NSString*)mmkvValue:(NSString *)rnKey{
  SecureStorage *secureStorage = [[SecureStorage alloc] init];
  NSString *key = [secureStorage getSecureKey:[self stringToHex:@"com.MMKV.default"]];

  if (key != NULL) {
      NSData *cryptKey = [key dataUsingEncoding:NSUTF8StringEncoding];
      MMKV *mmkv = [MMKV mmkvWithID:@"default" cryptKey:cryptKey mode:MMKVMultiProcess];
      NSString *result = [mmkv getStringForKey:rnKey];
      if (result && result.length > 0) {
        return result;
      }
  }
  return @"";
}

- (NSString *)stringToHex:(NSString *)string
{
  char *utf8 = (char *)[string UTF8String];
  NSMutableString *hex = [NSMutableString string];
  while (*utf8) [hex appendFormat:@"%02X", *utf8++ & 0x00FF];

  return [[NSString stringWithFormat:@"%@", hex] lowercaseString];
}


#pragma mark ============== 首次安装网络权限获取 =============
/*
 获取网络权限状态
 */
- (void)checkNetworkPermisson{
    //2.根据权限执行相应的交互
    CTCellularData *cellularData = [[CTCellularData alloc] init];
    /*
     此函数会在网络权限改变时再次调用
     */
    cellularData.cellularDataRestrictionDidUpdateNotifier = ^(CTCellularDataRestrictedState state) {
        switch (state) {
            case kCTCellularDataRestricted:
                  
                NSLog(@"Restricted");
                //2.1权限关闭的情况下 再次请求网络数据会弹出设置网络提示
                //[self getAppInfo];
                break;
            case kCTCellularDataNotRestricted:
                  
                NSLog(@"NotRestricted");
                //2.2已经开启网络权限 监听网络状态
                //[self addReachabilityManager:application didFinishLaunchingWithOptions:launchOptions];
                break;
            case kCTCellularDataRestrictedStateUnknown:
                  
                NSLog(@"Unknown");
                //2.3未知情况 （还没有遇到推测是有网络但是连接不正常的情况下）
                //[self getAppInfo];
                break;
                  
            default:
                break;
        }
    };
}

#pragma mark ============== 检测通知权限 =============
- (void)checkNotificationPermission{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings * _Nonnull settings) {
      if (settings.authorizationStatus == UNAuthorizationStatusNotDetermined)
      {
          NSLog(@"未选择");
          // [self opentNotificationAlert];
      }else if (settings.authorizationStatus == UNAuthorizationStatusDenied){
          NSLog(@"未授权");
          [self opentNotificationAlert];
      }else if (settings.authorizationStatus == UNAuthorizationStatusAuthorized){
          NSLog(@"已授权");
      }
  }];
}
/** 跳转系统设置方法*/
- (void)opentNotificationAlert {
  NSString *title = @"推送功能提醒";
  NSString *message = @"请前往系统设置打开通知，获取即时消息";
  NSString *ensure = @"确定";
  if (![self isChineseLanguage]){
    title = @"Alert";
    message = @"Please go to system settings to open notifications and get instant messages";
    ensure = @"Confirm";
  }
    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:title
                                                                             message:message
                                                                      preferredStyle:UIAlertControllerStyleAlert];
//    [alertController addAction:[UIAlertAction actionWithTitle:@"取消" style:UIAlertActionStyleDefault handler:^(UIAlertAction * _Nonnull action) {
//
//    }]];
    [alertController addAction:[UIAlertAction actionWithTitle:ensure style:UIAlertActionStyleDefault handler:^(UIAlertAction * _Nonnull action) {
      [[UIApplication sharedApplication] openURL:[NSURL URLWithString:UIApplicationOpenSettingsURLString] options:@{} completionHandler:nil];
    }]];
  UIViewController *vc = [UIApplication sharedApplication].keyWindow.rootViewController;
  if (vc.presentedViewController){
    [vc.presentedViewController presentViewController:alertController animated:YES completion:nil];
  }else{
    [vc presentViewController:alertController animated:YES completion:nil];
  }
}

- (BOOL)isChineseLanguage {
  NSArray *languages = [NSLocale preferredLanguages];
  NSString *pfLanguageCode = [languages objectAtIndex:0];
  if ([pfLanguageCode isEqualToString:@"zh-Hant"] ||
      [pfLanguageCode hasPrefix:@"zh-Hant"] ||
      [pfLanguageCode hasPrefix:@"yue-Hant"] ||
      [pfLanguageCode isEqualToString:@"zh-HK"] ||
      [pfLanguageCode isEqualToString:@"zh-TW"]||
      [pfLanguageCode isEqualToString:@"zh-Hans"] ||
      [pfLanguageCode hasPrefix:@"yue-Hans"] ||
      [pfLanguageCode hasPrefix:@"zh-Hans"]
      )
  {
      return YES;
  }
  else
  {
      return NO;
  }
  return NO;
}

#pragma mark ============== 保活 =============
- (void)setUploadingFile:(BOOL)uploadingFile{
  _uploadingFile = uploadingFile;
  if (!uploadingFile) {
    RCTLogInfo(@"stop");
    [self stopBackRuning];
  }
  RCTLogInfo(@"uploadingFile%@",uploadingFile ? @"1":@"0");
}
- (void)stopBackRuning {
    NSLog(@"%@ stopBackRuning",NSStringFromClass([self class]));
    if (self.bgTask) {
        [[UIApplication sharedApplication] endBackgroundTask:self.bgTask];
        self.bgTask = UIBackgroundTaskInvalid;
    }
    [self stopDoTask];
}

- (void)startBackRuning {
    NSLog(@"%@ startBackRuning",NSStringFromClass([self class]));
    self.bgTask = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:^{
        [[UIApplication sharedApplication] endBackgroundTask:self.bgTask];
        self.bgTask = UIBackgroundTaskInvalid;
        [self startDoTask];
    }];

}

- (void)startDoTask {
  [NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(startDoTask) object:nil];
  [self doTask];
  [self performSelector:@selector(startDoTask) withObject:nil afterDelay:10];
}
- (void)doTask {
  [self playTask];
}

- (void)stopDoTask {
    [NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(startDoTask) object:nil];
}

- (void)playTask {
    [self setAudioPlaySession];
    [self playSound];
    NSLog(@"%@ playTask",NSStringFromClass([self class]));
}

- (void)setAudioPlaySession {
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    if([NSThread mainThread]){
        [audioSession setCategory:AVAudioSessionCategoryPlayback withOptions:AVAudioSessionCategoryOptionMixWithOthers error:nil];
        [audioSession setActive:YES error:nil];
    }else{
        dispatch_async(dispatch_get_main_queue(), ^{
            [audioSession setCategory:AVAudioSessionCategoryPlayback withOptions:AVAudioSessionCategoryOptionMixWithOthers error:nil];
            [audioSession setActive:YES error:nil];
        });
    }
}

- (void)playSound
{
    if (!self.audioPlayer) {
        // 播放文件
        NSString *filePath = [[NSBundle mainBundle] pathForResource:@"RunInBackground" ofType:@"mp3"];
        NSURL *fileURL = [[NSURL alloc] initFileURLWithPath:filePath];
        if (!fileURL) {
            NSLog(@"playEmptyAudio 找不到播放文件");
        }
        
        // 0.0~1.0,默认为1.0
        NSError *error = nil;
        self.audioPlayer = [[AVAudioPlayer alloc] initWithContentsOfURL:fileURL error:&error];
        self.audioPlayer.volume = 0.0;
        // 循环播放 保活在后台导航时 容易不生效
        self.audioPlayer.numberOfLoops = -1;
        [self.audioPlayer prepareToPlay];
    }
    [self.audioPlayer play];

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(.2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self.audioPlayer pause];
        self.audioPlayer = nil;
    });
}
@end
