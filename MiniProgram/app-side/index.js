import { BaseSideService } from "@zeppos/zml/base/base-side";
import { messagingPlugin } from "@zeppos/zml/2.0/module/messaging/plugin/side";

const linkRes = "https://stress-notificator-default-rtdb.asia-southeast1.firebasedatabase.app/data_stress.json";

BaseSideService.use(messagingPlugin);

AppSideService(
  BaseSideService({
    async onRequest(req, res) {
      const { type, params } = req;
      console.log("Received request:", req);

      if (type === "UPLOAD") {
        console.log("Uploading data:", params);
        settings.settingsStorage.setItem("stressData", JSON.stringify(params));

        try {
          const result = await this.postData();
          res(null, result);
        } catch (error) {
          console.error("Error posting data:", error);
          res(error);
        }
      } else if (type === "UPLOAD_DATA_SIDE_SERVICE") {
        console.log("Uploading side service data:", params);
        settings.settingsStorage.setItem("stressData", JSON.stringify(params));

        res(null, {
          code: 0,
          message: "SUCCESS",
        });
      }
    },
    onInit() {
      console.log("Initializing service");
      settings.settingsStorage.addListener("change", async ({ key, newValue, oldValue }) => {
        console.log("Settings change detected:", { key, newValue, oldValue });
        if (key === "REQUEST_ACTION") {
          console.log("REQUEST_ACTION detected");
          this.call({ type: "SETTINGS_APP_REQUEST_DATA" });
        } else if (key === "POST_ACTION") {
          console.log("POST_ACTION detected");
          try {
            await this.postData();
          } catch (error) {
            console.error("Error in postData:", error);
          }
        }
      });
    },
    async postData() {
      console.log("Service postData");
      try {
        const res = await fetch({
          url: linkRes,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: settings.settingsStorage.getItem("stressData"),
        });

        const result = await res.json();
        console.log("Post data response:", result);
        return result;
      } catch (error) {
        console.error("Error posting data:", error);
        throw error;
      }
    },
  })
);
