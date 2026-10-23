import { mountRatioControl } from "../../src/popup/ratio-control";
import { getEnglishRatio, setEnglishRatio } from "../../src/settings";

void mountRatioControl(document.getElementById("ratio")!, {
  get: getEnglishRatio,
  set: setEnglishRatio,
});
