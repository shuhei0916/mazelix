import { mountEnabledToggle } from "../../src/popup/enabled-toggle";
import { mountRatioControl } from "../../src/popup/ratio-control";
import {
  getEnabled,
  getEnglishRatio,
  setEnabled,
  setEnglishRatio,
} from "../../src/settings";

void mountEnabledToggle(document.getElementById("enabled")!, {
  get: getEnabled,
  set: setEnabled,
});
void mountRatioControl(document.getElementById("ratio")!, {
  get: getEnglishRatio,
  set: setEnglishRatio,
});
