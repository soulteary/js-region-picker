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

function initBaseContainer(container) {
  const template = `
<div id="areaPicker" class="picker-box area-picker hide">
  <div class="flex flex-row align-center justify-between">
      <div class="area-picker-tips">选择查询地区（支持多选）</div>
      <div class="flex flex-row align-center">
          <div class="area-picker-clear-all">清除全部</div>
          <div class="area-picker-sure flex flex-center">确定</div>
      </div>
  </div>

  <div class="area-picker-selected flex flex-row flex-wrap"></div>

  <div class="area-picker-input flex flex-row align-center">
      <input type="text" placeholder="检索国家或地区的中英文名称" />
      <i class="icon-search"></i>
  </div>

  <div class="area-picker-letter"></div>
  <div class="area-picker-list flex flex-row flex-wrap align-start"></div>
</div>
  `;
  document.querySelector(container).innerHTML = template;
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
      <label for="region-picker-${code}" class="checkBox-inner" data-code="${code}">
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

    Array.from(document.getElementsByName("region-picker")).forEach((item) => {
      if (item.value === code) item.checked = false;
    });
  });

  // handle clear all
  document.querySelector(".area-picker-clear-all").addEventListener("click", (e) => {
    e.preventDefault();
    RegionPicker.Selected = [];
    updatePickerSelected(RegionPicker.Selected);

    Array.from(document.getElementsByName("region-picker")).forEach((item) => {
      item.checked = false;
    });
  });
}

function handlePickerList() {
  document.querySelector(".area-picker-list").addEventListener("click", (e) => {
    const target = e.target;
    const classname = target.getAttribute("class");
    if (!classname || classname.trim() != "checkBox") return;
    // TODO
    // The current DOM structure design makes it necessary to use asynchronous fetching,
    // which may be adjusted and optimized to avoid potential problems
    setTimeout(() => {
      const selected = Array.from(document.getElementsByName("region-picker"))
        .filter((item) => item.checked)
        .map((item) => item.value);

      RegionPicker.Selected = RegionPicker.RegionList.filter((item) => selected.includes(item.code));
      updatePickerSelected(RegionPicker.Selected);
    }, 10);
  });
}

// TODO
function handlePickerLetterClick() {}
// TODO
function handleSearch() {}

function bootstrap() {
  initBaseContainer("#container");
  RegionPicker.RegionList = window.RegionOptions.region;
  initRegionPickerLetters(RegionPicker.RegionList);
  initRegionList(RegionPicker.RegionList);
  handlePickerSelected();
  handlePickerList();
}

bootstrap();
