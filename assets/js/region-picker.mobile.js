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

  function initBaseContainer(container, componentId) {
    const visiableClass = Picker.Visiable ? "" : "hide";
    const template = `
        <div id="${componentId}" class="region-picker-container ${visiableClass}">
          <div class="nav flex flex-row align-center justify-between">
              <div id="region-picker-container-cancel" class="nav-left">返回</div>
              <div class="nav-middle">选择查询国家</div>
              <div id="region-picker-container-sure" class="btn-submit">确定</div>
          </div>
        
          <div class="area-select">
            <div class="flex justify-between">
                <div class="menu-name">已选择国家</div>
                <div class="flex flex-row">
                    <div class="btn-clear-all clickable no-select">一键清除</div>
                    <div class="btn-select-all clickable no-select">全部选择</div>
                </div>
            </div>
            <div class="region-selected-container flex flex-row flex-wrap"></div>
          </div>
  
          <div class="list flex">
            <div class="region-letters-container"></div>
  
            <div class="list-box">
              <div class="region-picker-container-input flex align-center">
                  <input type="text" id="region-search-input" class="list-search-input" placeholder="请输入国家中文或英文名称">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                          d="M15.3156 14.4344L13.1906 12.3094C14.2406 11.0594 14.875 9.44687 14.875 7.6875C14.875 3.71875 11.6563 0.5 7.6875 0.5C3.71875 0.5 0.5 3.71875 0.5 7.6875C0.5 11.6562 3.71875 14.875 7.6875 14.875C9.44688 14.875 11.0594 14.2406 12.3094 13.1906L14.4344 15.3156C14.5563 15.4375 14.7156 15.5 14.875 15.5C15.0344 15.5 15.1938 15.4375 15.3156 15.3156C15.5625 15.0719 15.5625 14.6781 15.3156 14.4344ZM1.75 7.6875C1.75 4.4125 4.4125 1.75 7.6875 1.75C10.9625 1.75 13.625 4.4125 13.625 7.6875C13.625 10.9625 10.9625 13.625 7.6875 13.625C4.4125 13.625 1.75 10.9625 1.75 7.6875Z"
                          fill="#82AAD7" />
                  </svg>
              </div>
  
              <div class="list-container flex flex-row">
                <div class="list-container-select"></div>
    
                <div class="region-picker-container-list region-list-conatiner"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    document.querySelector(container).innerHTML = template;

    watchMaskButtons();
  }

  function GetFirstUpperLetter(str) {
    return (str || "").slice(0, 1).toUpperCase();
  }

  /**
   * Generate the region picker letters template
   *
   * @param {array} regionList
   */
  function initRegionPickerLetters(regionList) {
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
   *
   * @param {array} regionList
   */
  function InitRegionList() {
    const template = Picker.RegionList.map((item, index) => {
      const { code, cname, name } = item;
      const icon = regionIconFixer(code);

      return `
        
        <div class="region-picker-item">
          <label for="region-picker-${code}" data-code="${code}" data-index="${index}" class="flex flex-row justify-between align-center">
            <div class="flex flex-row align-center">
                <img class="list__flag" src="${Picker.BaseDir}assets/region-icon/${icon}.svg" alt="${cname}" />
                <div class="flex flex-col">
                  <div class="region-picker-item-cname">${cname}</div>
                  <div class="region-picker-item-name">${name}</div>
                </div>
            </div>
            <div class="region-checkbox">
                <input id="region-picker-${code}" type="checkbox" name="region-picker" value="${code}" >
                <span class="region-checkbox-elem"></span>
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
    const areaPickerItems = document.querySelectorAll(".region-picker-item");
    areaPickerItems.forEach((item) => {
      if (charSelected === "*") {
        item.classList.remove("hide");
        return;
      }

      const enName = item.querySelector(".region-picker-item-name").innerText;
      const code = item.querySelector("label").getAttribute("data-code");
      if (enName.startsWith(charSelected) || code.startsWith(charSelected)) {
        item.classList.remove("hide");
      } else {
        item.classList.add("hide");
      }
    });
  }

  function watchMaskButtons() {
    const cancelButton = document.getElementById("region-picker-container-cancel");
    const sureButton = document.getElementById("region-picker-container-sure");

    cancelButton.addEventListener("click", CancelPicker);
    sureButton.addEventListener("click", HidePicker);
  }

  /**
   * Update picker selected template
   *
   * @param {array} regionList
   */
  function UpdatePickerSelected() {
    const template = Picker.Selected.map((item, _) => {
      const { cname, code } = item;
      item.icon = regionIconFixer(code);
      return `
        <div class="region-item-selected flex flex-row flex-center" data-code="${code}">
          <span>${cname}</span>
          <img class="btn-remove-selected" src="${Picker.BaseDir}assets/img/icon-close.svg" alt="" />
        </div>`;
    });

    Feedback("change");

    document.querySelector(`#${Picker.ComponentId} .region-selected-container`).innerHTML = template.join("");
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
      const selectedContainer = target.closest(".region-selected-container");
      if (selectedContainer) {
        const classname = (target.className || "").trim();
        if (classname.indexOf("btn-remove-selected") === -1) return;
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

      // handle clear all
      const btnClearall = target.closest(".btn-clear-all");
      if (btnClearall) {
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
    const letterContainer = document.querySelector(".region-letters-container");
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
        document.querySelector(".list-container-select").textContent = code;
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
      document.querySelector(".list-container-select").textContent = "";

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

  function debounce(func, delay) {
    let timerId;
    return function (...args) {
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => {
        func.apply(this, args);
        timerId = null;
      }, delay);
    };
  }

  function watchScroll() {
    const listContainer = document.querySelector(".region-picker-container-list");
    const letterLabels = Array.from(document.querySelectorAll(".picker-letter"));
    const handleScroll = debounce(() => {
      const scrollTop = listContainer.scrollTop;
      const listItemHeight = 55;
      let activeIndex = Math.floor(scrollTop / listItemHeight);

      if (activeIndex < 0) {
        activeIndex = 0;
      } else if (activeIndex >= letterLabels.length) {
        activeIndex = letterLabels.length - 1;
      }

      if (!letterLabels[activeIndex]) return;

      const listContainerSelect = document.querySelector(".list-container-select");
      listContainerSelect.textContent = letterLabels[activeIndex].getAttribute("data-code");

      letterLabels.forEach((label) => {
        label.classList.remove("picker-letter-active");
      });

      letterLabels[activeIndex].classList.add("picker-letter-active");
    }, 200);

    listContainer.addEventListener("scroll", handleScroll);
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

  /**
   * Cancel the region picker
   */
  function CancelPicker() {
    const container = document.getElementById(Picker.ComponentId);
    container.className = container.className + " hide";
    Picker.Visiable = false;
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
    UpdateRegionCheckboxSelected();
  }

  function UpdateRegionCheckboxSelected() {
    Array.from(document.querySelectorAll(`#${Picker.ComponentId} input[name=region-picker]`)).forEach((item) => {
      Picker.Selected.forEach((selected) => {
        if (item.value === selected.code) item.checked = true;
      });
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

    initBaseContainer(container, componentId);
    initRegionPickerLetters();
    InitRegionList();

    handlePickerSelected();
    handlePickerList();
    handlePickerLetterClick();
    handleSearch();
    watchScroll();

    if (preselected) {
      SetPreSelectedRegion(preselected);
    }

    Feedback("init");

    return Picker;
  }

  return Bootstrap(container, options);
};
