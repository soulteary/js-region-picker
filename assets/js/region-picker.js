window.RegionPicker = function (container, options = {}) {
  var Picker = {
    // expose states
    ComponentId: "",
    Options: {},
    BaseDir: "",
    Selected: [],
    RegionList: [],
    Visiable: false,
    // expose functions
    GetSelected: GetSelected,
    Show: ShowPicker,
    Hide: HidePicker,
  };

  function GetSelected() {
    return this.Selected;
  }

  function Feedback(event) {
    if (Picker.Options && Picker.Options.updater && typeof Picker.Options.updater === "function") {
      Picker.Selected = Picker.Selected.sort((a, b) => {
        if (a.code < b.code) {
          return -1;
        }
        if (a.code > b.code) {
          return 1;
        }
        return 0;
      });
      Picker.Options.updater(Picker.Selected, event, Picker);
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

  const REGION_SELECTED_CONTAINER = ".region-selected-container";

  function InitBaseContainer(container, componentId) {
    const visiableClass = Picker.Visiable ? "" : "hide";
    const template = `
        <div id="${componentId}" class="region-picker-container ${visiableClass}">
          <div class="flex flex-row align-center justify-between">
              <div class="region-picker-labels no-select">选择查询地区</div>
              <div class="flex flex-row align-center">
                  <div class="clickable no-select btn-select-all">全选</div>
                  <div class="clickable no-select btn-reset">重置</div>
                  <div class="clickable no-select btn-submit flex flex-center">确定</div>
              </div>
          </div>

          <div class="region-selected-container no-select flex flex-row flex-wrap"></div>

          <div class="region-search flex flex-row align-center">
              <input type="text" id="region-search-input" placeholder="进行区域检索" />
              <i class="icon-search"></i>
          </div>

          <div class="region-letters-container no-select "></div>
          <div class="region-list-conatiner no-select flex flex-row flex-wrap align-start"></div>
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
        template += `<span class="clickable picker-letter" data-code="${char}">${char} </span>`;
      } else {
        template += `<span class="clickable picker-letter-disabled">${char} </span>`;
      }
    }
    document.querySelector(`#${Picker.ComponentId} .region-letters-container`).innerHTML = template;
  }

  /**
   * Generate the region list template
   */
  function InitRegionList() {
    const template = Picker.RegionList.map((item, _) => {
      const { code, cname, name } = item;
      const icon = regionIconFixer(code);

      return `
        <div class="region-picker-item">
          <label for="region-picker-${code}" class="clickable flex flex-row align-center" data-code="${code}">
            <div class="region-checkbox">
                <input id="region-picker-${code}" type="checkbox" name="region-picker" value="${code}" />
                <span class="region-checkbox-elem"></span>
            </div>
            <img src="${Picker.BaseDir}assets/region-icon/${icon}.svg" loading="lazy" alt="${cname}" />
            <div class="flex flex-col">
                <div class="region-picker-item-cname">${cname}</div>
                <div class="region-picker-item-name">${name}</div>
            </div>
          </label>
        </div>`;
    });

    document.querySelector(`#${Picker.ComponentId} .region-list-conatiner`).innerHTML = template.join("");
  }

  /**
   * Filter region list by char
   *
   * @param {array} regionList
   */
  function filterRegionListByChar(charSelected) {
    const areaPickerItems = document.querySelectorAll(`#${Picker.ComponentId} .region-picker-item`);
    areaPickerItems.forEach((item) => {
      if (charSelected === "*") {
        item.classList.remove("hide");
        return;
      }

      const name = item.querySelector(".region-picker-item-name").innerText;
      const code = item.querySelector("label").getAttribute("data-code");
      if (name.startsWith(charSelected) || code.startsWith(charSelected)) {
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
    const OnlyOneSelected = Picker.Selected.length === 1;

    const template = Picker.Selected.map((item, idx) => {
      const { cname, code } = item;
      item.icon = regionIconFixer(code);

      const itemStateClass = idx === 0 && OnlyOneSelected ? "region-item-selected-freezed" : "";
      const iconStateClass = !OnlyOneSelected ? "clickable" : "disallow";

      return `
        <div class="region-item-selected ${itemStateClass} flex flex-row flex-center" data-code="${code}">
          <span>${cname}</span>
          <img class="${iconStateClass} btn-remove-selected" src="${Picker.BaseDir}assets/img/icon-close.svg" alt="" />
        </div>`;
    });

    Feedback("change");

    document.querySelector(`#${Picker.ComponentId} ${REGION_SELECTED_CONTAINER}`).innerHTML = template.join("");
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
  }

  /**
   * Handle the region picker selected close icon click event
   */
  function handlePickerSelected() {
    const container = document.getElementById(Picker.ComponentId);
    container.addEventListener("click", (e) => {
      const target = e.target;
      if (!target) return;

      // handle clear single item
      const selectedContainer = target.closest(REGION_SELECTED_CONTAINER);
      if (selectedContainer) {
        const classname = (target.className || "").trim();
        if (classname.indexOf("btn-remove-selected") === -1) return;
        if (classname.indexOf("disallow") !== -1) return;
        const code = target.parentElement.getAttribute("data-code");
        removeSelectedRegion(code);
        UpdatePickerSelected();
        UpdateRegionCheckboxSelected();
        return;
      }

      // handle select all
      const btnSelectall = target.closest(".btn-select-all");
      if (btnSelectall) {
        e.preventDefault();
        Picker.Selected = [];
        SetPreSelectedRegion("all");
        return;
      }

      // handle reset
      const btnReset = target.closest(".btn-reset");
      if (btnReset) {
        e.preventDefault();
        Picker.Selected = [];
        if (Picker.Options.preselected) {
          SetPreSelectedRegion(Picker.Options.preselected);
        }
        return;
      }

      // handle submit
      const btnSubmit = target.closest(".btn-submit");
      if (btnSubmit) {
        e.preventDefault();
        HidePicker();
        return;
      }
    });
  }

  function handlePickerList() {
    document.querySelector(`#${Picker.ComponentId} .region-list-conatiner`).addEventListener("click", (e) => {
      const target = e.target;
      // const classname = target.getAttribute("class");
      // if (!classname || classname.trim() != "region-checkbox-elem") return;
      const label = target.closest("label");
      if (!label || !label.matches(".region-picker-item label")) return;
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
    const letterContainer = document.querySelector(`#${Picker.ComponentId} .region-letters-container`);
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
    const searchInput = document.getElementById("region-search-input");
    const areaPickerItems = document.querySelectorAll(`#${Picker.ComponentId} .region-picker-item`);

    searchInput.addEventListener("input", () => {
      const searchTerm = (searchInput.value || "").trim().toLowerCase();

      if (!searchTerm) {
        areaPickerItems.forEach((item) => item.classList.remove("hide"));
        return;
      }

      const letterLabels = Array.from(document.querySelectorAll(`#${Picker.ComponentId} .region-letters-container .picker-letter`));
      letterLabels.forEach((item) => item.classList.remove("picker-letter-active"));

      areaPickerItems.forEach((item) => {
        const zhName = item.querySelector(".region-picker-item-cname").innerText;
        const enName = item.querySelector(".region-picker-item-name").innerText.toLowerCase();

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
    Picker.Visiable = true;
  }

  /**
   * Hide the region picker
   */
  function HidePicker() {
    const container = document.getElementById(Picker.ComponentId);
    container.className = container.className + " hide";
    Picker.Visiable = false;
    Feedback("submit");
  }

  function SetPreSelectedRegion(code) {
    if (!code) return;
    if (typeof code == "string") {
      const userPreSelected = code.toLowerCase().trim();
      // select all item
      if (userPreSelected == "all") {
        Picker.Selected = Picker.RegionList;
      } else {
        Picker.Selected = Picker.RegionList.filter((item) => userPreSelected == item.code);
      }
    } else {
      // handle array
      const userPreSelected = code.map((item) => item.toLowerCase().trim());
      Picker.Selected = Picker.RegionList.filter((item) => userPreSelected.includes(item.code));
    }

    UpdatePickerSelected();
    ResetAllCheckBoxSelected();
    UpdateRegionCheckboxSelected();
  }

  function UpdateRegionCheckboxSelected() {
    Array.from(document.querySelectorAll(`#${Picker.ComponentId} input[name=region-picker]`)).forEach((item) => {
      Picker.Selected.forEach((selected) => {
        if (item.value === selected.code) item.checked = true;
      });
    });
  }

  function ResetAllCheckBoxSelected() {
    Array.from(document.querySelectorAll(`#${Picker.ComponentId} input[name=region-picker]`)).forEach((item) => {
      if (item.checked) item.checked = false;
    });
  }

  function Bootstrap(container, options) {
    const componentId = "region-picker-" + Math.random().toString(36).slice(-6);
    Picker.ComponentId = componentId;

    Picker.Options = options;
    const { data, baseDir, preselected, visiable } = options;

    Picker.RegionList = data;
    Picker.Visiable = !!visiable;

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
      SetPreSelectedRegion(preselected);
    }

    Feedback("init");

    return Picker;
  }

  return Bootstrap(container, options);
};
