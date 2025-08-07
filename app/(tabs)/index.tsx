import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import * as React from "react";
import { useEffect, useRef } from "react";
import { Platform, SafeAreaView } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

function runHaptic(style?: string) {
  switch (style) {
    case "selection":
      return Haptics.selectionAsync();
    case "impactLight":
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    case "impactMedium":
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case "impactHeavy":
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    case "success":
      return Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    case "warning":
      return Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );
    case "error":
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    default:
      return Haptics.selectionAsync();
  }
}

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

      case "haptic": {
        runHaptic(payload?.style);
        break;
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        onMessage={onMessage}
        injectedJavaScriptBeforeContentLoaded={`
          window.NativeBridge = {
            send: (msg) => window.ReactNativeWebView.postMessage(JSON.stringify(msg))
          };
          true;
        `}
        ref={webviewRef}
        setSupportMultipleWindows={false}
        overScrollMode="never"
        cacheEnabled
        bounces={false}
        allowsBackForwardNavigationGestures
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        //originWhitelist={["https://domain.com"]} //Enable when we have a static domain
        decelerationRate={0.9}
        source={{
          uri: "https://habit-tracker-git-main-thromletts-projects.vercel.app?_vercel_share=OfJ18Cqi3vgrsKgFRgmltz0wy3vxwDMr",
        }}
      />
    </SafeAreaView>
  );
}
