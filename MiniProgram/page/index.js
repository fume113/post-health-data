import { createWidget, widget, prop, align } from "@zos/ui";
import { Stress } from "@zos/sensor";
import { px } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { showToast } from "@zos/interaction";
import { setPageBrightTime, pauseDropWristScreenOff, pausePalmScreenOff } from "@zos/display"; // Import the required functions

const { width: DEVICE_WIDTH } = getDeviceInfo();

import { BasePage } from "@zeppos/zml/base/base-page";
import { pagePlugin } from "@zeppos/zml/2.0/module/messaging/plugin/page";

BasePage.use(pagePlugin);

Page(
  BasePage({
    state: {
      textWidget: null,
      stressData: null,
      stressInstance: null,
    },
    build() {
      console.log("Building UI components");
      this.setIntervalToFetchData();
      this.keepScreenOn();
    },

    setIntervalToFetchData() {
      setInterval(() => {
        this.getStressData();
      }, 300000); // 5 menit
    },

    keepScreenOn() {
      setPageBrightTime({
        brightTime: 4200000, // 70 menit
      });
      pauseDropWristScreenOff({
        duration: 4200000, // 70 menit
      });
      pausePalmScreenOff({
        duration: 4200000, // 70 menit
      });
    },

    onCall(data) {
      console.log("Received call with data:", data);
      this.responseCall(data);
    },

    getStressData() {
      console.log("Fetching stress data");
      if (!this.state.stressInstance) {
        this.state.stressInstance = new Stress();
      }

      const info = this.state.stressInstance.getCurrent();

      if (info?.value === undefined) {
        console.log("No Stress Data available");
        showToast({
          content: "No Stress Data",
        });

        return false;
      }

      this.state.stressData = {
        value: info.value,
      };

      const { value } = this.state.stressData;
      const text = `Nilai Stress: ${value}`;

      if (!this.state.textWidget) {
        this.state.textWidget = createWidget(widget.TEXT, {
          x: (DEVICE_WIDTH - px(400)) / 2,
          y: px(48),
          w: px(400),
          h: px(200),
          text_size: px(22),
          align_h: align.CENTER_H,
          align_v: align.CENTER_V,
          text,
          color: 0xffffff,
        });
      } else {
        this.state.textWidget.setProperty(prop.TEXT, text);
      }

      this.postStressData();
    },

    postStressData() {
      console.log("Posting stress data:", JSON.stringify(this.state.stressData));

      this.request({
        type: "UPLOAD",
        params: {
          ...this.state.stressData,
        },
      })
        .then((data) => {
          console.log("Data upload response:", data);
          showToast({ content: `UPLOADED` });
        })
        .catch((error) => {
          console.error("Error uploading data:", error);
          showToast({ content: "UPLOAD FAILED" });
        });
    },

    responseCall(data) {
      const { type = "" } = data;
      console.log("Response call with type:", type);

      if (type === "SETTINGS_APP_REQUEST_DATA") {
        this.getStressData();

        this.request({
          type: "UPLOAD_DATA_SIDE_SERVICE",
          params: {
            ...this.state.stressData,
          },
        })
          .then((data) => {
            const { message } = data;
            console.log("Data upload side service response:", data);
            showToast({ content: `UPLOAD_DATA_SIDE_SERVICE ${message}` });
          })
          .catch((error) => {
            console.error("Error uploading side service data:", error);
            showToast({ content: "UPLOAD_DATA_SIDE_SERVICE FAILED" });
          });
      }
    },
  })
);
