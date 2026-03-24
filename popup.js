(function () {
  const api = globalThis.YouTubeMinimalSettings || globalThis.YTMinimalSettings;
  const LIST_FIELDS = [
    { key: "whitelist", modeKey: "whitelistMode" },
    { key: "blacklist", modeKey: "blacklistMode" },
  ];
  const listFieldKeys = new Set(LIST_FIELDS.map((field) => field.key));
  const fieldIds = api.SETTING_DEFINITIONS
    .map((definition) => definition.key)
    .filter((key) => !listFieldKeys.has(key));
  const controls = new Map();
  const listTimers = new Map();

  function $(id) {
    return document.getElementById(id);
  }

  function normalizeListValue(value) {
    return String(value || "")
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function syncToggleState(settings) {
    fieldIds.forEach((field) => {
      const control = controls.get(field);
      if (control) {
        control.checked = Boolean(settings[field]);
      }
    });
  }

  function syncListField(settings, { key, modeKey }) {
    const textarea = $(key);
    if (!textarea) {
      return;
    }

    textarea.value = Array.isArray(settings[key]) ? settings[key].join("\n") : "";
    textarea.disabled = !settings[modeKey];
  }

  function syncAll(settings) {
    syncToggleState(settings);
    LIST_FIELDS.forEach((field) => syncListField(settings, field));
  }

  async function syncFromStorage() {
    syncAll(await api.getSettings());
  }

  async function persistField(field, value) {
    await api.setSettings({ [field]: value });
  }

  function wireControl(field) {
    const input = $(field);
    if (!input) {
      return;
    }

    controls.set(field, input);
    input.addEventListener("change", async () => {
      await persistField(field, input.checked);
    });
  }

  function wireListField({ key }) {
    const textarea = $(key);
    if (!textarea) {
      return;
    }

    const persist = async () => {
      await persistField(key, normalizeListValue(textarea.value));
    };

    textarea.addEventListener("input", () => {
      window.clearTimeout(listTimers.get(key));
      listTimers.set(key, window.setTimeout(persist, 180));
    });

    textarea.addEventListener("blur", persist);
  }

  async function restoreDefaults() {
    syncAll(await api.resetSettings());
  }

  document.addEventListener("DOMContentLoaded", async () => {
    fieldIds.forEach(wireControl);
    LIST_FIELDS.forEach(wireListField);

    const restoreButton = $("restoreDefaults");
    if (restoreButton) {
      restoreButton.addEventListener("click", restoreDefaults);
    }

    await syncFromStorage();
    api.onSettingsChanged(syncAll);
  });
})();
