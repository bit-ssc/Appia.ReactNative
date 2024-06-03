#!/usr/bin/env bash

sed -i '' \
	's/PRODUCT_BUNDLE_IDENTIFIER = cn.appia.reactnative.ShareExtension;/PRODUCT_BUNDLE_IDENTIFIER = cn.appia.reactnative.Rocket-Chat-ShareExtension;/' \
	../RocketChatRN.xcodeproj/project.pbxproj

sed -i '' \
	's/PRODUCT_BUNDLE_IDENTIFIER = cn.appia.reactnative.NotificationService;/PRODUCT_BUNDLE_IDENTIFIER = cn.appia.reactnative.NotificationService;/' \
	../RocketChatRN.xcodeproj/project.pbxproj