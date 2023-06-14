// fix the region icon code
function regionIconFixer(code) {
  if (code === "uk") {
    return "gb";
  } else if (code === "tw") {
    return "cn";
  }
  return code;
}

function initRegionPickerLetters() {
  // area-picker-letter
}

function initRegionList() {
  const template = window.RegionOptions.region.map((item, _) => {
    const { code, cname, name } = item;
    const icon = regionIconFixer(code);

    return `<div class="area-picker-item flex flex-row align-center">
      <label for="picker-${code}" class="checkBox-inner">
          <input id="picker-${code}" type="checkbox" name="picker-${code}" value="${code}" />
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

initRegionList();
