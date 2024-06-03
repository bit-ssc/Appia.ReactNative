package com.talkingdata.sdk;

import android.content.Context;
import android.text.TextUtils;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeArray;
import com.facebook.react.bridge.ReadableNativeMap;
import com.tendcloud.tenddata.TalkingDataOrder;
import com.tendcloud.tenddata.TalkingDataProfile;
import com.tendcloud.tenddata.TalkingDataProfileType;
import com.tendcloud.tenddata.TalkingDataGender;
import com.tendcloud.tenddata.TalkingDataShoppingCart;
import com.tendcloud.tenddata.TalkingDataSearch;
import com.tendcloud.tenddata.TalkingDataSDK;

import org.json.JSONArray;
import org.json.JSONObject;

public class TalkingDataSDKPlugin extends ReactContextBaseJavaModule {
    private Context context;

    @Override
    public String getName() {
        return "TalkingDataSDK";
    }

    public TalkingDataSDKPlugin(ReactApplicationContext reactContext) {
        super(reactContext);
        context = reactContext;
    }

    @ReactMethod
    public void init(String appId, String channelId, String custom) {
        TalkingDataSDK.init(context, appId, channelId, custom);
    }

    @ReactMethod
    public void getDeviceID(Promise callback) {
        callback.resolve(TalkingDataSDK.getDeviceId(context));
    }

    @ReactMethod
    public void getOAID(Promise callback) {
        callback.resolve(TalkingDataSDK.getOAID(context));
    }

    @ReactMethod
    public void setVerboseLogDisable() {
        TalkingDataSDK.setVerboseLogDisable();
    }

    @ReactMethod
    public void onPageBegin(String pageName) {
        TalkingDataSDK.onPageBegin(context, pageName);
    }

    @ReactMethod
    public void onPageEnd(String pageName) {
        TalkingDataSDK.onPageEnd(context, pageName);
    }

    @ReactMethod
    public void onEvent(String eventId, ReadableMap map) {
        TalkingDataSDK.onEvent(context, eventId, map.toHashMap());
    }

    @ReactMethod
    public void setGlobalKVMap(String key, ReadableMap value) {
        if (value == null){
            TalkingDataSDK.setGlobalKV(key, null);
        }else {
            ReadableNativeMap map = (ReadableNativeMap) value;
            TalkingDataSDK.setGlobalKV(key, map.toHashMap());
        }
    }

    @ReactMethod
    public void setGlobalKVArray(String key, ReadableArray value) {
        ReadableNativeArray array = (ReadableNativeArray) value;
        TalkingDataSDK.setGlobalKV(key, array.toArrayList());
    }

    @ReactMethod
    public void setGlobalKVDouble(String key, double value) {
        TalkingDataSDK.setGlobalKV(key, value);
    }

    @ReactMethod
    public void setGlobalKVString(String key, String value) {
        TalkingDataSDK.setGlobalKV(key, value);
    }

    @ReactMethod
    public void setGlobalKVBoolean(String key, boolean value) {
        TalkingDataSDK.setGlobalKV(key, value);
    }

    @ReactMethod
    public void removeGlobalKV(String key) {
        TalkingDataSDK.removeGlobalKV(key);
    }


    @ReactMethod
    public void onReceiveDeepLink(String link){
        TalkingDataSDK.onReceiveDeepLink(link);
    }

    @ReactMethod
    public void onRegister(String profileId, String profile, String invitationCode) {
         TalkingDataSDK.onRegister(profileId, getProfile(profile), invitationCode);
    }

    @ReactMethod
    public void onLogin(String profileId, String profile) {
         TalkingDataSDK.onLogin(profileId, getProfile(profile));
    }

    @ReactMethod
    public void onProfileUpdate(String profile){
         TalkingDataSDK.onProfileUpdate(getProfile(profile));
    }

    @ReactMethod
    public void onCreateCard(String profileId, String method, String content) {
        TalkingDataSDK.onCreateCard(profileId, method, content);
    }

    @ReactMethod
    public  void onFavorite(String category, String content) {
        TalkingDataSDK.onFavorite(category, content);
    }

    @ReactMethod
    public  void onShare(String profileId, String content) {
        TalkingDataSDK.onShare(profileId, content);
    }

    @ReactMethod
    public  void onPunch(String profileId, String punchId) {
        TalkingDataSDK.onPunch(profileId, punchId);
    }
    private TalkingDataProfile getProfile(String json){
        TalkingDataProfile tdProfile = TalkingDataProfile.createProfile();
        try{
            JSONObject jsonObject = new JSONObject(json);
            tdProfile.setName(jsonObject.optString("name", null));
            if (jsonObject.has("type")){
                tdProfile.setType(getAccountType(jsonObject.optInt("type")));
            }
            if (jsonObject.has("gender")){
                tdProfile.setGender(getAccountGender(jsonObject.optInt("gender")));
            }
            if (jsonObject.has("age")){
                tdProfile.setAge(jsonObject.optInt("age"));
            }
            tdProfile.setProperty1(jsonObject.opt("value1"));
            tdProfile.setProperty2(jsonObject.opt("value2"));
            tdProfile.setProperty3(jsonObject.opt("value3"));
            tdProfile.setProperty4(jsonObject.opt("value4"));
            tdProfile.setProperty5(jsonObject.opt("value5"));
            tdProfile.setProperty6(jsonObject.opt("value6"));
            tdProfile.setProperty7(jsonObject.opt("value7"));
            tdProfile.setProperty8(jsonObject.opt("value8"));
            tdProfile.setProperty9(jsonObject.opt("value9"));
            tdProfile.setProperty10(jsonObject.opt("value10"));
        }catch (Throwable t){
            t.printStackTrace();
        }
        return tdProfile;
    }
    /**
     * 获取订单
     *
     * @param json 订单
     * @return Order订单对象
     */
    private TalkingDataOrder getOrder(String json){
        try{
            JSONObject jsonObject = new JSONObject(json);
            TalkingDataOrder order = TalkingDataOrder.createOrder(jsonObject.optString("orderId"), jsonObject.optInt("total"), jsonObject.optString("currencyType"));
            JSONArray items = jsonObject.optJSONArray("items");
            if (items != null){
                for (int i = 0;i<items.length();i++) {
                    JSONObject item = items.optJSONObject(i);
                    String id = item.optString("itemId");
                    String category = item.optString("category");
                    String name = item.optString("name");
                    int unitPrice = item.optInt("unitPrice");
                    int count = item.optInt("amount");
                    if (TextUtils.isEmpty(id)) {
                        order.addItem(category,name,unitPrice,count);
                    }else{
                        order.addItem(id,category,name,unitPrice,count);
                    }
                }
            }
            return order;
        }catch (Throwable t){
            t.printStackTrace();
        }
        return null;
    }

    /**
     * 获取购物车
     *
     * @param json 购物车
     * @return ShoppingCart购物车对象
     */
    private TalkingDataShoppingCart getShoppingCart(String json){
        TalkingDataShoppingCart shoppingCart = TalkingDataShoppingCart.createShoppingCart();
        try {
            JSONObject jsonObject = new JSONObject(json);
            JSONArray items = jsonObject.optJSONArray("items");
            if (items != null){
                for (int i = 0;i<items.length();i++) {
                    JSONObject item = items.optJSONObject(i);
                    String id = item.optString("itemId");
                    String category = item.optString("category");
                    String name = item.optString("name");
                    int unitPrice = item.optInt("unitPrice");
                    int count = item.optInt("amount");
                    shoppingCart.addItem(id,category,name,unitPrice,count);
                }
            }
        }catch (Throwable t){
            t.printStackTrace();
        }

        return shoppingCart;
    }


    /**
     * 获取账户类型
     *
     * @param type int型账户类型
     * @return AccountType型账户类型
     */
    private TalkingDataProfileType getAccountType(int type){
        TalkingDataProfileType accountType;
        switch (type) {
            case 1:
                accountType = TalkingDataProfileType.REGISTERED;
                break;
            case 2:
                accountType = TalkingDataProfileType.SINA_WEIBO;
                break;
            case 3:
                accountType = TalkingDataProfileType.QQ;
                break;
            case 4:
                accountType = TalkingDataProfileType.QQ_WEIBO;
                break;
            case 5:
                accountType = TalkingDataProfileType.ND91;
                break;
            case 6:
                accountType = TalkingDataProfileType.WEIXIN;
                break;
            case 11:
                accountType = TalkingDataProfileType.TYPE1;
                break;
            case 12:
                accountType = TalkingDataProfileType.TYPE2;
                break;
            case 13:
                accountType = TalkingDataProfileType.TYPE3;
                break;
            case 14:
                accountType = TalkingDataProfileType.TYPE4;
                break;
            case 15:
                accountType = TalkingDataProfileType.TYPE5;
                break;
            case 16:
                accountType = TalkingDataProfileType.TYPE6;
                break;
            case 17:
                accountType = TalkingDataProfileType.TYPE7;
                break;
            case 18:
                accountType = TalkingDataProfileType.TYPE8;
                break;
            case 19:
                accountType = TalkingDataProfileType.TYPE9;
                break;
            case 20:
                accountType = TalkingDataProfileType.TYPE10;
                break;
            default:
                accountType = TalkingDataProfileType.ANONYMOUS;
        }
        return accountType;
    }

    /**
     * 获取账户类型
     *
     * @param gender int型 账户性别
     * @return AccountGender型 账户性别
     */
    private TalkingDataGender getAccountGender(int gender){
        TalkingDataGender accountGender;
        switch (gender) {
            case 1:
                accountGender = TalkingDataGender.MALE;
                break;
            case 2:
                accountGender = TalkingDataGender.FEMALE;
                break;
            default:
                accountGender = TalkingDataGender.UNKNOWN;
        }
        return accountGender;
    }
}
