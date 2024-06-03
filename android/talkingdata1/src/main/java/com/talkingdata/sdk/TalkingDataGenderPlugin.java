package com.talkingdata.sdk;


import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

public class TalkingDataGenderPlugin extends ReactContextBaseJavaModule {

    public TalkingDataGenderPlugin(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Nullable
    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("UNKNOWN", 0);
        constants.put("MALE", 1);
        constants.put("FEMALE", 2);
        return constants;
    }

    @Override
    public String getName() {
        return "TalkingDataGender";
    }
}
