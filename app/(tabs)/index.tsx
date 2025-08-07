import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import * as React from "react";
import { useEffect, useRef } from "react";
import { Platform, SafeAreaView } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

export default function App() {
  const webviewRef = useRef<WebView>(null);

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // 2. Request permissions on mount
  useEffect(() => {
    (async () => {
      if (Constants.isDevice) {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          console.warn(
            "Notification permissions not granted! Some features may not work."
          );
        }
      } else {
        console.warn("Must use a physical device for notifications");
      }

      // Optional: on Android, create a default channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }
    })();
  }, []);

  const onMessage = async (event: WebViewMessageEvent) => {
    const { action, payload } = JSON.parse(event.nativeEvent.data);

    switch (action) {
      case "openCamera": {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,
        });
        if (result.assets?.[0]?.base64) {
          webviewRef.current?.postMessage(
            JSON.stringify({
              action: "cameraResult",
              data: result.assets[0].base64,
            })
          );
        }
        break;
      }

      case "scheduleNotification": {
        // schedule a local notification after payload.delayMs milliseconds
        await Notifications.scheduleNotificationAsync({
          content: {
            body: payload.message,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.max((payload.delayMs || 0) / 1000, 1),
            repeats: false,
          },
        });
        break;
      }

      // …add more handlers here…
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        ref={webviewRef}
        incognito
        source={{
          uri: "https://habit-tracker-git-main-thromletts-projects.vercel.app?_vercel_share=OfJ18Cqi3vgrsKgFRgmltz0wy3vxwDMr",
        }}
        onMessage={onMessage}
        injectedJavaScriptBeforeContentLoaded={`
          window.NativeBridge = {
            send: (msg) => window.ReactNativeWebView.postMessage(JSON.stringify(msg))
          };
        `}
      />
    </SafeAreaView>
  );
}
