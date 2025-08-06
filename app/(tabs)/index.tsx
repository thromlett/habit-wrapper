import React, { useRef } from "react";
import { SafeAreaView } from "react-native";
import { launchCamera } from "react-native-image-picker";
import PushNotification from "react-native-push-notification";
import { WebView, WebViewMessageEvent } from "react-native-webview";

export default function App() {
  const webviewRef = useRef<WebView>(null);

  const onMessage = async (event: WebViewMessageEvent) => {
    const { action, payload } = JSON.parse(event.nativeEvent.data);

    switch (action) {
      case "openCamera":
        // launch native camera
        const result = await launchCamera({
          mediaType: "photo",
          includeBase64: true,
        });
        if (result.assets?.[0]?.base64) {
          // send back base64 image data
          webviewRef.current?.postMessage(
            JSON.stringify({
              action: "cameraResult",
              data: result.assets[0].base64,
            })
          );
        }
        break;

      case "scheduleNotification":
        // schedule a local notification
        PushNotification.localNotificationSchedule({
          message: payload.message,
          date: new Date(Date.now() + (payload.delayMs || 0)),
        });
        break;

      // …add more handlers here…
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        ref={webviewRef}
        incognito={true}
        source={{
          uri: "https://habit-tracker-git-daniel-thromletts-projects.vercel.app?_vercel_share=8dRYuOPiA78YKfa0CGAMwdcXN6E7OTXW",
        }}
        onMessage={onMessage}
        injectedJavaScriptBeforeContentLoaded={`
          // expose a bridge object on window
          window.NativeBridge = {
            send: (msg) => window.ReactNativeWebView.postMessage(JSON.stringify(msg))
          };
        `}
      />
    </SafeAreaView>
  );
}

//https://habit-tracker-git-main-thromletts-projects.vercel.app
