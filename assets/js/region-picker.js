window.RegionPicker = function (container, options = {}) {
  var Picker = {
    // expose states
    ComponentId: "",
    Options: {},
    BaseDir: "",
    Selected: [],
    RegionList: [],
    // expose functions
    GetSelected: GetSelected,
    Show: ShowPicker,
    Hide: HidePicker,
  };

  function GetSelected() {
    return this.Selected;
  }

  function Feedback() {
    if (Picker.Options && Picker.Options.updater && typeof Picker.Options.updater === "function") {
      Picker.Selected.sort((a, b) => a - b);
      Picker.Options.updater(Picker, Picker.Selected);
    }
  }

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

  function InitBaseContainer(container, componentId) {
    const template = `
      <div id="${componentId}" class="picker-box area-picker hide">
        <div class="flex flex-row align-center justify-between">
            <div class="area-picker-tips">选择查询地区</div>
            <div class="flex flex-row align-center">
                <div class="area-picker-clear-all">清除全部</div>
                <div class="area-picker-sure flex flex-center">确定</div>
            </div>
        </div>
      
        <div class="area-picker-selected flex flex-row flex-wrap"></div>
      
        <div class="area-picker-input flex flex-row align-center">
            <input type="text" id="area-search-input" placeholder="进行区域检索" />
            <i class="icon-search"></i>
        </div>
      
        <div class="area-picker-letter"></div>
        <div class="area-picker-list flex flex-row flex-wrap align-start"></div>
      </div>
    `;
    document.querySelector(container).innerHTML = template;
  }

  function GetFirstUpperLetter(str) {
    return (str || "").slice(0, 1).toUpperCase();
  }

  /**
   * Generate the region picker letters template
   */
  function InitRegionPickerLetters() {
    const firstLettersDict = Picker.RegionList.map((item, _) => [GetFirstUpperLetter(item.name), GetFirstUpperLetter(item.code)]).reduce((prev, item) => {
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
    document.querySelector(`#${Picker.ComponentId} .area-picker-letter`).innerHTML = template;
  }

  /**
   * Generate the region list template
   */
  function InitRegionList() {
    const template = Picker.RegionList.map((item, _) => {
      const { code, cname, name } = item;
      const icon = regionIconFixer(code);

      return `
      <div class="area-picker-item">
        <label for="region-picker-${code}" class="flex flex-row align-center" data-code="${code}">
          <div class="checkBox-inner">
              <input id="region-picker-${code}" type="checkbox" name="region-picker" value="${code}" />
              <span class="checkBox"></span>
          </div>
          <img src="${Picker.BaseDir}assets/region-icon/${icon}.svg" loading="lazy" alt="${cname}" />
          <div class="flex flex-col">
              <div class="area-picker-item-zh">${cname}</div>
              <div class="area-picker-item-en">${name}</div>
          </div>
        </label>
      </div>`;
    });

    document.querySelector(`#${Picker.ComponentId} .area-picker-list`).innerHTML = template.join("");
  }

  /**
   * Filter region list by char
   *
   * @param {array} regionList
   */
  function filterRegionListByChar(charSelected) {
    const areaPickerItems = document.querySelectorAll(`#${Picker.ComponentId} .area-picker-item`);
    areaPickerItems.forEach((item) => {
      if (charSelected === "*") {
        item.classList.remove("hide");
        return;
      }

      const enName = item.querySelector(".area-picker-item-en").innerText;
      const code = item.querySelector("label").getAttribute("data-code");
      if (enName.startsWith(charSelected) || code.startsWith(charSelected)) {
        item.classList.remove("hide");
      } else {
        item.classList.add("hide");
      }
    });
  }

  /**
   * Update picker selected template
   */
  function UpdatePickerSelected() {
    const template = Picker.Selected.map((item, _) => {
      const { cname, code } = item;
      item.icon = regionIconFixer(code);
      return `
      <div class="area-picker-selected-item flex flex-row flex-center" data-code="${code}">
        <span>${cname}</span>
        <img class="area-picker-selected-close" src="${Picker.BaseDir}assets/region-selector/close.svg" alt="" />
      </div>`;
    });

    Feedback();
    document.querySelector(`#${Picker.ComponentId} .area-picker-selected`).innerHTML = template.join("");
  }

  /**
   * Remove the selected region by code
   *
   * @param {string} code
   */
  function removeSelectedRegion(code) {
    if (!code) return;
    const regionList = Picker.Selected;
    const index = regionList.findIndex((item) => item.code === code);
    regionList.splice(index, 1);
    Picker.Selected = regionList;
    UpdatePickerSelected();
  }

  /**
   * Handle the region picker selected close icon click event
   */
  function handlePickerSelected() {
    // handle clear single item
    document.querySelector(`#${Picker.ComponentId} .area-picker-selected`).addEventListener("click", (e) => {
      e.preventDefault();
      const target = e.target;
      const classname = target.getAttribute("class");
      if (!classname || classname.trim() != "area-picker-selected-close") return;
      const code = target.parentElement.getAttribute("data-code");
      removeSelectedRegion(code);
      UpdatePickerSelected();

      Array.from(document.getElementsByName("region-picker")).forEach((item) => {
        if (item.value === code) item.checked = false;
      });
    });

    // handle clear all
    document.querySelector(`#${Picker.ComponentId} .area-picker-clear-all`).addEventListener("click", (e) => {
      e.preventDefault();
      Picker.Selected = [];
      UpdatePickerSelected();

      Array.from(document.getElementsByName("region-picker")).forEach((item) => {
        item.checked = false;
      });
    });
  }

  function handlePickerList() {
    document.querySelector(`#${Picker.ComponentId} .area-picker-list`).addEventListener("click", (e) => {
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

        Picker.Selected = Picker.RegionList.filter((item) => selected.includes(item.code));
        UpdatePickerSelected();
      }, 10);
    });
  }

  // picker click
  function handlePickerLetterClick() {
    const letterContainer = document.querySelector(`#${Picker.ComponentId} .area-picker-letter`);
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
        filterRegionListByChar(code.toLowerCase());
      }
    });
  }

  // search area
  function handleSearch() {
    const searchInput = document.getElementById("area-search-input");
    const areaPickerItems = document.querySelectorAll(`#${Picker.ComponentId} .area-picker-item`);

    searchInput.addEventListener("input", () => {
      const searchTerm = (searchInput.value || "").trim().toLowerCase();

      if (!searchTerm) {
        areaPickerItems.forEach((item) => item.classList.remove("hide"));
        return;
      }

      const letterLabels = Array.from(document.querySelectorAll(`#${Picker.ComponentId} .area-picker-letter .picker-letter`));
      letterLabels.forEach((item) => item.classList.remove("picker-letter-active"));

      areaPickerItems.forEach((item) => {
        const zhName = item.querySelector(".area-picker-item-zh").innerText;
        const enName = item.querySelector(".area-picker-item-en").innerText.toLowerCase();

        if (zhName.includes(searchTerm) || enName.includes(searchTerm)) {
          item.classList.remove("hide");
        } else {
          item.classList.add("hide");
        }
      });
    });
  }

  /**
   * Show the region picker
   */
  function ShowPicker() {
    const container = document.getElementById(Picker.ComponentId);
    container.className = container.className.replace(/\s?hide/g, "");
  }

  /**
   * Hide the region picker
   */
  function HidePicker() {
    const container = document.getElementById(Picker.ComponentId);
    container.className = container.className + " hide";
  }

  function Bootstrap(container, options) {
    const componentId = "region-picker-" + Math.random().toString(36).slice(-6);
    Picker.ComponentId = componentId;

    Picker.Options = options;
    const { data, baseDir, preselected } = options;

    Picker.RegionList = data;

    if (baseDir != "") {
      Picker.BaseDir = baseDir + "/";
    }

    InitBaseContainer(container, componentId);
    InitRegionPickerLetters();
    InitRegionList();

    handlePickerSelected();
    handlePickerList();
    handlePickerLetterClick();
    handleSearch();

    if (preselected) {
      if (typeof preselected == "string") {
        const userPreSelected = preselected.toLowerCase().trim();
        // select all item
        if (userPreSelected == "all") {
          Picker.Selected = Picker.RegionList;
        } else {
          Picker.Selected = Picker.RegionList.filter((item) => userPreSelected == item.code);
        }
      } else {
        // handle array
        const userPreSelected = preselected.map((item) => item.toLowerCase().trim());
        Picker.Selected = Picker.RegionList.filter((item) => userPreSelected.includes(item.code));
      }

      UpdatePickerSelected();

      Array.from(document.querySelectorAll(`#${Picker.ComponentId} input[name=region-picker]`)).forEach((item) => {
        Picker.Selected.forEach((selected) => {
          if (item.value === selected.code) item.checked = true;
        });
      });
    }

    Feedback();

    return Picker;
  }

  return Bootstrap(container, options);
};
