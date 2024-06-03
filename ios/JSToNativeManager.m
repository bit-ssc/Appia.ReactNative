//
//  JSToNativeManager.m
//  RocketChatRN
//
//  Created by appia on 2023/6/6.
//  Copyright © 2023 Facebook. All rights reserved.
//

#import "JSToNativeManager.h"
#import "AppDelegate.h"
#import "YBImageBrowser.h"
#import "YBIBVideoData.h"
#import <SDWebImage.h>
#import <AVFoundation/AVFoundation.h>

@implementation JSToNativeManager

RCT_EXPORT_MODULE();

//获取麦克风权限
RCT_EXPORT_METHOD(requestMicrophonePermission:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
        if (granted) {
            resolve(@(YES)); // 权限被授予，解析 promise 为 true
        } else {
            NSError *error = [NSError errorWithDomain:@"com.yourapp" code:0 userInfo:@{NSLocalizedDescriptionKey:@"Microphone permission denied"}];
            reject(@"permission_denied", @"Microphone permission was denied", error); // 权限被拒绝，拒绝 promise
        }
    }];
}


// 改变文件上传状态
RCT_EXPORT_METHOD(changeFileUploadStatus:(NSNumber * _Nonnull)status)
{
  RCTLogInfo(@"change%@", status);
  AppDelegate *del = (AppDelegate*)[UIApplication sharedApplication].delegate;
  del.uploadingFile = ([status integerValue] == 1) ? YES : NO;
}

// 跳转到系统设置
RCT_EXPORT_METHOD(jumpToSystemSetting)
{
  [[UIApplication sharedApplication] openURL:[NSURL URLWithString:UIApplicationOpenSettingsURLString] options:@{} completionHandler:nil];
}

// 唤起单个图片/视频预览
RCT_EXPORT_METHOD(showPhoto:(NSDictionary*)photo)
{
  [self showBrowser:[NSNumber numberWithInt:0] photos:@[photo]];
}

// 唤起多个图片/视频预览
RCT_EXPORT_METHOD(showPhotoBrowser:(NSNumber * _Nonnull)index photos:(NSArray<NSDictionary*>*)photos)
{
  [self showBrowser:index photos:photos];
}

- (void)showBrowser:(NSNumber * _Nonnull)index photos:(NSArray<NSDictionary*>*)photos{

  NSMutableArray *localPhotos = [self changeDataFormat:photos];
  
  dispatch_async(dispatch_get_main_queue(), ^{
    YBImageBrowser *browser = [YBImageBrowser new];
    browser.dataSourceArray = localPhotos;
    browser.currentPage = [index unsignedIntegerValue];
    [browser show];
  });

}

// 唤起多个图片/视频预览
RCT_EXPORT_METHOD(changePhoto:(NSNumber * _Nonnull)index photos:(NSArray<NSDictionary*>*)photos)
{
  [self changePhotoBrowserData:[index intValue] photos:photos];
}

- (void)changePhotoBrowserData:(int)index photos:(NSArray<NSDictionary*>*)photos{
  
  NSMutableArray *localPhotos = [self changeDataFormat:photos];
  
  dispatch_async(dispatch_get_main_queue(), ^{
    // 获取应用程序的keyWindow
    UIWindow *keyWindow = [UIApplication sharedApplication].keyWindow;
    // 遍历keyWindow的所有子视图
    for (UIView *subview in keyWindow.subviews) {
        // 检查这个子视图是否是你要找的视图
        // 这里假设你的视图类名为MyCustomView
        if ([subview isKindOfClass:[YBImageBrowser class]]) {
            // 找到了你的视图
          YBImageBrowser *browser = (YBImageBrowser *)subview;
          RCTLogWarn(@"index---%d",index);
            // 现在你可以对myView做你需要的操作
          if (index == 1) {
            RCTLogWarn(@"%lu-%lu",localPhotos.count,browser.dataSourceArray.count);
            browser.currentPage = localPhotos.count - 1 - browser.dataSourceArray.count;
          }else{
            browser.currentPage = localPhotos.count - 1;
          }
          browser.dataSourceArray = localPhotos;
//          browser.currentPage = [index unsignedIntegerValue];
            [browser reloadData];
            break;
        }
    }
  });
}

- (NSMutableArray*)changeDataFormat:(NSArray<NSDictionary*>*)photos{
  NSMutableArray *localPhotos = [NSMutableArray array];
   for (NSDictionary *dic in photos) {
     NSString *type = [NSString stringWithFormat:@"%@",dic[@"type"]];
     NSString *url = [NSString stringWithFormat:@"%@",dic[@"url"]];
     NSString *thumbnailUrl100 = [NSString stringWithFormat:@"%@",dic[@"thumbnailUrl100"]];
     if ([type isEqualToString:@"0"]) {
       NSString *localPath = [NSString stringWithFormat:@"%@",dic[@"localPath"]];
       // RCTLogInfo(@"%@", localPath);
       YBIBImageData *image = [YBIBImageData new];
       if (localPath.length == 0 || [localPath isEqualToString:@"<null>"] || [localPath isEqualToString:@"(null)"]){
         image.imageURL = [NSURL URLWithString:url];
       }else{
         image.imagePath = localPath;
       }
       image.thumbURL = [NSURL URLWithString:thumbnailUrl100];
       image.defaultLayout.verticalFillType = YBIBImageFillTypeFullWidth;
       [localPhotos addObject:image];
     } else {
       YBIBVideoData *video = [YBIBVideoData new];
       NSString *localIdentifier = [NSString stringWithFormat:@"%@",dic[@"localIdentifier"]];
       if (localIdentifier.length == 0 || [localIdentifier isEqualToString:@"<null>"]|| [localIdentifier isEqualToString:@"(null)"]){
         video.videoURL = [NSURL URLWithString:url];
         video.videoAVAsset = [AVAsset assetWithURL:[NSURL URLWithString:url]];
       }else{
         PHAsset *asset = [PHAsset fetchAssetsWithLocalIdentifiers:@[localIdentifier] options:nil].firstObject;
         video.videoPHAsset = asset;
       }
       //        video.thumbImage = [UIImage imageWithData:[NSData dataWithContentsOfURL:[NSURL URLWithString:thumbnailUrl100]]];
       video.autoPlayCount = NSUIntegerMax;
       video.shouldHideForkButton = YES;
       [localPhotos addObject:video];
     }
   }
  return localPhotos;
}

- (NSURL*)savePath:(NSString *)urlPath{
  NSArray*arr = [urlPath componentsSeparatedByString:@"/"];
  
  NSString*documentPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
  NSString*savePath = [NSString stringWithFormat:@"%@/%@",documentPath,[arr lastObject]];
  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSString *videoPath = @"";
  if ([fileManager fileExistsAtPath:savePath]) {
      videoPath = savePath;
  }else{
      videoPath = urlPath;
  }
    
  if (videoPath) {
      return nil;
  }
  
  NSURL *asset = nil;
  if ([videoPath hasPrefix:@"http"]) {
      asset = [NSURL URLWithString:videoPath];
  }else{
      asset = [NSURL fileURLWithPath:videoPath];
  }
  return asset;
}

RCT_EXPORT_METHOD(resetStatusBar)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [[UIApplication sharedApplication] setStatusBarStyle:UIStatusBarStyleDarkContent animated:YES];
  });
}

RCT_EXPORT_METHOD(checkTestflight:(RCTResponseSenderBlock)callback){
  // 通过itms-bata://来判断TestFlight是否安装
  NSString *customAppString = @"itms-beta://testflight.apple.com/join/esyGZcdt";
  // TestFlight 已经安装
  int res = [[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:customAppString]] ? 1 : 0;
  callback(@[[NSNull null],@(res)]);
}

RCT_EXPORT_METHOD(checkVPNIsOpen:(RCTResponseSenderBlock)callback){

  BOOL flag = NO;
  NSDictionary *dict = CFBridgingRelease(CFNetworkCopySystemProxySettings());
  NSArray *keys = [dict[@"__SCOPED__"] allKeys];
  for (NSString *key in keys) {
      if ([key rangeOfString:@"tap"].location != NSNotFound ||
          [key rangeOfString:@"tun"].location != NSNotFound ||
          [key rangeOfString:@"ipsec"].location != NSNotFound ||
          [key rangeOfString:@"ppp"].location != NSNotFound){
          flag = YES;
          break;
      }
  }
  
  callback(@[[NSNull null],@(flag)]);
}

//- (void)showBrowser:(NSNumber * _Nonnull)index photos:(NSArray<NSDictionary*>*)photos{
//  // Create array of MWPhoto objects
//  self.photos = [NSMutableArray array];
//
//  for (NSDictionary *dic in photos) {
//    NSString *type = [NSString stringWithFormat:@"%@",dic[@"type"]];
//    NSString *url = [NSString stringWithFormat:@"%@",dic[@"url"]];
//    if ([type isEqualToString:@"0"]) {
//      [self.photos addObject:[MWPhoto photoWithURL:[NSURL URLWithString:url]]];
//    } else {
//      MWPhoto *video = [MWPhoto videoWithURL:[NSURL URLWithString:url]];
//      video.isVideo = YES;
//      [self.photos addObject:video];
//    }
//  }
//
//  // Create browser (must be done each time photo browser is
//  // displayed. Photo browser objects cannot be re-used)
//  MWPhotoBrowser *browser = [[MWPhotoBrowser alloc] initWithDelegate:self];
//
//  // Set options
//  browser.displayActionButton = YES; // Show action button to allow sharing, copying, etc (defaults to YES)
//  browser.displayNavArrows = YES; // Whether to display left and right nav arrows on toolbar (defaults to NO)
//  browser.displaySelectionButtons = NO; // Whether selection buttons are shown on each image (defaults to NO)
//  browser.zoomPhotosToFill = YES; // Images that almost fill the screen will be initially zoomed to fill (defaults to YES)
//  browser.alwaysShowControls = YES; // Allows to control whether the bars and controls are always visible or whether they fade away to show the photo full (defaults to NO)
//  browser.enableGrid = NO; // Whether to allow the viewing of all the photo thumbnails on a grid (defaults to YES)
//  browser.startOnGrid = NO; // Whether to start on the grid of thumbnails instead of the first photo (defaults to NO)
//  browser.autoPlayOnAppear = NO; // Auto-play first video
//
//  // Customise selection images to change colours if required
//  browser.customImageSelectedIconName = @"ImageSelected.png";
//  browser.customImageSelectedSmallIconName = @"ImageSelectedSmall.png";
//
//  // Optionally set the current visible photo before displaying
//  [browser setCurrentPhotoIndex:[index unsignedIntegerValue]];
//
//  // Present
//  dispatch_async(dispatch_get_main_queue(), ^{
//    browser.modalPresentationStyle = UIModalPresentationFullScreen;
//    [[self getRootVC] presentViewController:browser animated:YES completion:nil];
//  });
//
//  // Manipulate
//  [browser showNextPhotoAnimated:YES];
//  [browser showPreviousPhotoAnimated:YES];
//}

//- (NSUInteger)numberOfPhotosInPhotoBrowser:(MWPhotoBrowser *)photoBrowser {
//    return self.photos.count;
//}
//
//- (id <MWPhoto>)photoBrowser:(MWPhotoBrowser *)photoBrowser photoAtIndex:(NSUInteger)index {
//    if (index < self.photos.count) {
//        return [self.photos objectAtIndex:index];
//    }
//    return nil;
//}

//- (UIViewController*) getRootVC {
//    UIViewController *root = [[[[UIApplication sharedApplication] delegate] window] rootViewController];
//    while (root.presentedViewController != nil) {
//        root = root.presentedViewController;
//    }
//    return root;
//}
@end
