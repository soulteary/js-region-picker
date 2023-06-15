window.RegionPicker = (function () {
  var RegionPicker = {
    Selected: null,
    RegionList: null,
    ComponentId: "",
    Show: showPicker,
    Hide: hidePicker,
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

  function initBaseContainer(container, componentId) {
    const template = `
      <div id="${componentId}" class="picker-box area-picker hide">
        <div class="flex flex-row align-center justify-between">
            <div class="area-picker-tips">选择查询地区（支持多选）</div>
            <div class="flex flex-row align-center">
                <div class="area-picker-clear-all">清除全部</div>
                <div class="area-picker-sure flex flex-center">确定</div>
            </div>
        </div>
      
        <div class="area-picker-selected flex flex-row flex-wrap"></div>
      
        <div class="area-picker-input flex flex-row align-center">
            <input type="text" id="area-search-input" placeholder="检索国家或地区的中英文名称" />
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
        template += `<span class="picker-letter" data-code="${char}">${char} </span>`;
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
      <div class="area-picker-item">
        <label for="region-picker-${code}" class="flex flex-row align-center" data-code="${code}">
          <div class="checkBox-inner">
              <input id="region-picker-${code}" type="checkbox" name="region-picker" value="${code}" />
              <span class="checkBox"></span>
          </div>
          <img src="assets/region-icon/${icon}.svg" alt="${cname}" />
          <div class="flex flex-col">
              <div class="area-picker-item-zh">${cname}</div>
              <div class="area-picker-item-en">${name}</div>
          </div>
        </label>
      </div>`;
    });

    document.querySelector(`#${RegionPicker.ComponentId} .area-picker-list`).innerHTML = template.join("");
  }

  /**
   * Filter region list by char
   *
   * @param {array} regionList
   */
  function filterRegionListByChar(selectedChar) {
    const areaPickerItems = document.querySelectorAll(".area-picker-item");
    areaPickerItems.forEach((item) => {
      if (selectedChar === "*") {
        item.classList.remove("hide");
        return;
      }

      const enName = item.querySelector(".area-picker-item-en").innerText;
      if (enName.startsWith(selectedChar)) {
        item.classList.remove("hide");
      } else {
        item.classList.add("hide");
      }
    });
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
      // const classname = target.getAttribute("class");
      // if (!classname || classname.trim() != "checkBox") return;
      const label = target.closest("label");
      if (!label || !label.matches(".area-picker-item label")) return;
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

  // picker click
  function handlePickerLetterClick() {
    const letterContainer = document.querySelector(".area-picker-letter");
    const letterLabels = Array.from(letterContainer.querySelectorAll(".picker-letter"));
    letterContainer.addEventListener("click", (e) => {
      e.preventDefault();
      const target = e.target;
      const classname = target.getAttribute("class");
      if (!classname || classname.trim().indexOf("picker-letter") == -1) return;
      const code = target.getAttribute("data-code");
      if (!code) return;

      if (target.classList.contains("picker-letter-active")) {
        target.classList.remove("picker-letter-active");
        filterRegionListByChar("*");
      } else {
        letterLabels.forEach((item) => item.classList.remove("picker-letter-active"));
        target.classList.add("picker-letter-active");
        filterRegionListByChar(code);
      }
    });
  }

  // search area
  function handleSearch() {
    const searchInput = document.getElementById("area-search-input");
    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.trim().toLowerCase();

      const areaPickerItems = document.querySelectorAll(".area-picker-item");
      areaPickerItems.forEach((item) => {
        const zhName = item.querySelector(".area-picker-item-zh").innerText.toLowerCase();
        const enName = item.querySelector(".area-picker-item-en").innerText.toLowerCase();

        // 检查地区名称是否包含搜索词
        if (zhName.includes(searchTerm) || enName.includes(searchTerm)) {
          item.style.display = "block";
        } else {
          item.style.display = "none";
        }
      });
    });
  }

  /**
   * Show the region picker
   */
  function showPicker() {
    document.getElementById(RegionPicker.ComponentId).classList.remove("hide");
  }

  /**
   * Hide the region picker
   */
  function hidePicker() {
    document.getElementById(RegionPicker.ComponentId).classList.add("hide");
  }

  function bootstrap(container, regionList) {
    const componentId = "region-picker-" + Math.random().toString(36).slice(-6);
    RegionPicker.ComponentId = componentId;
    RegionPicker.RegionList = regionList;

    initBaseContainer(container, componentId);
    initRegionPickerLetters(regionList);
    initRegionList(regionList);

    handlePickerSelected();
    handlePickerList();
    handlePickerLetterClick();
    handleSearch();

    return RegionPicker;
  }

  return bootstrap;
})();
