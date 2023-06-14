var RegionPicker = {
  Selected: null,
  RegionList: null,
};

/**
 * fix the region icon code
 *
 * @param {string} code
 * @returns {string} icon code
 */
function regionIconFixer(code) {
  if (code === "uk") {
    return "gb";
  } else if (code === "tw") {
    return "cn";
  }
  return code;
}

/**
 * Generate the region picker letters template
 *
 * @param {array} regionList
 */
function initRegionPickerLetters(regionList) {
  const firstLettersDict = regionList
    .map((item, _) => [item.name.slice(0, 1).toUpperCase(), item.code.slice(0, 1).toUpperCase()])
    .reduce((prev, item) => {
      prev[item[0]] = true;
      prev[item[1]] = true;
      return prev;
    }, {});

  let template = "";
  for (let i = 65; i <= 90; i++) {
    const char = String.fromCharCode(i);
    if (firstLettersDict[char]) {
      template += `<span>${char} </span>`;
    } else {
      template += `<span class="picker-letter-disabled">${char} </span>`;
    }
  }
  document.querySelector(".area-picker-letter").innerHTML = template;
}

/**
 * Generate the region list template
 *
 * @param {array} regionList
 */
function initRegionList(regionList) {
  const template = regionList.map((item, _) => {
    const { code, cname, name } = item;
    const icon = regionIconFixer(code);

    return `
    <div class="area-picker-item flex flex-row align-center">
      <label for="region-picker-${code}" class="checkBox-inner">
          <input id="region-picker-${code}" type="checkbox" name="region-picker" value="${code}" />
          <span class="checkBox"></span>
      </label>
      <img src="assets/region-icon/${icon}.svg" alt="${cname}" />
      <div class="flex flex-col">
          <div class="area-picker-item-zh">${cname}</div>
          <div class="area-picker-item-en">${name}</div>
      </div>
    </div>`;
  });

  document.querySelector("#areaPicker .area-picker-list").innerHTML = template.join("");
}

/**
 * Update picker selected template
 *
 * @param {array} regionList
 */
function updatePickerSelected(regionList) {
  const template = regionList.map((item, _) => {
    const { cname, code } = item;
    return `
    <div class="area-picker-selected-item flex flex-row flex-center" data-code="${code}">
      <span>${cname}</span>
      <img class="area-picker-selected-close" src="assets/region-selector/close.svg" alt="" />
    </div>`;
  });

  document.querySelector(".area-picker-selected").innerHTML = template.join("");
}

/**
 * Remove the selected region by code
 *
 * @param {string} code
 */
function removeSelectedRegion(code) {
  if (!code) return;
  const regionList = RegionPicker.Selected;
  const index = regionList.findIndex((item) => item.code === code);
  regionList.splice(index, 1);
  RegionPicker.Selected = regionList;
  updatePickerSelected(RegionPicker.Selected);
}

/**
 * Handle the region picker selected close icon click event
 */
function handlePickerSelected() {
  // handle clear single item
  document.querySelector(".area-picker-selected").addEventListener("click", (e) => {
    e.preventDefault();
    const target = e.target;
    const classname = target.getAttribute("class");
    if (!classname || classname.trim() != "area-picker-selected-close") return;
    const code = target.parentElement.getAttribute("data-code");
    removeSelectedRegion(code);
    updatePickerSelected(RegionPicker.Selected);
  });

  // handle clear all
  document.querySelector(".area-picker-clear-all").addEventListener("click", (e) => {
    e.preventDefault();
    RegionPicker.Selected = [];
    updatePickerSelected(RegionPicker.Selected);
  });
}

function bootstrap() {
  RegionPicker.RegionList = window.RegionOptions.region;
  initRegionPickerLetters(RegionPicker.RegionList);
  initRegionList(RegionPicker.RegionList);
  handlePickerSelected();

  // TODO remove this test
  RegionPicker.Selected = RegionPicker.RegionList;
  updatePickerSelected(RegionPicker.Selected);
}

bootstrap();
