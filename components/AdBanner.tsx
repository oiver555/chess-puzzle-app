import React from "react";
import { View } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

export default function AdBanner() {
  return (
    <View style={{ alignItems: "center" }}>
      <BannerAd
        unitId={TestIds.BANNER}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}