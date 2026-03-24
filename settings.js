/* Shared defaults and storage helpers for the extension.
 * This file is loaded by both the popup and the content script.
 */
(function (global) {
  const STORAGE_KEY = "yt_minimal_settings";

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    hideAdsAndUpsells: true,
    subscriptionsOnlyHomepage: true,
    hideRecommendations: true,
    hideDonations: true,
    hideSubscriptionsSection: false,
    hideHomeFeedCompletely: false,
    hideComments: false,
    hideLiveChat: false,
    hideNotificationsBell: false,
    hideSidebarEntirely: false,
    hideSearchSuggestions: false,
    hideAutoplayToggle: false,
    hideMiniplayerButton: false,
    hideChannelAvatars: false,
    whitelistMode: false,
    whitelist: [],
    blacklistMode: false,
    blacklist: [],
  });

  const SETTING_DEFINITIONS = Object.freeze([
    { key: "enabled", type: "boolean", defaultValue: true, label: "Master enable" },
    { key: "hideAdsAndUpsells", type: "boolean", defaultValue: true, label: "Block ads and upsells" },
    { key: "subscriptionsOnlyHomepage", type: "boolean", defaultValue: true, label: "Subscription-only homepage" },
    { key: "hideRecommendations", type: "boolean", defaultValue: true, label: "Hide recommendations" },
    { key: "hideDonations", type: "boolean", defaultValue: true, label: "Hide donations and fundraisers" },
    { key: "hideSubscriptionsSection", type: "boolean", defaultValue: false, label: "Hide subscriptions section" },
    { key: "hideHomeFeedCompletely", type: "boolean", defaultValue: false, label: "Hide homepage feed completely" },
    { key: "hideComments", type: "boolean", defaultValue: false, label: "Hide comments" },
    { key: "hideLiveChat", type: "boolean", defaultValue: false, label: "Hide live chat" },
    { key: "hideNotificationsBell", type: "boolean", defaultValue: false, label: "Hide notifications bell" },
    { key: "hideSidebarEntirely", type: "boolean", defaultValue: false, label: "Hide sidebar entirely" },
    { key: "hideSearchSuggestions", type: "boolean", defaultValue: false, label: "Hide search suggestions" },
    { key: "hideAutoplayToggle", type: "boolean", defaultValue: false, label: "Hide autoplay toggle" },
    { key: "hideMiniplayerButton", type: "boolean", defaultValue: false, label: "Hide miniplayer button" },
    { key: "hideChannelAvatars", type: "boolean", defaultValue: false, label: "Hide channel avatars" },
    { key: "whitelistMode", type: "boolean", defaultValue: false, label: "Whitelist mode" },
    { key: "whitelist", type: "array", defaultValue: [], label: "Whitelist" },
    { key: "blacklistMode", type: "boolean", defaultValue: false, label: "Blacklist mode" },
    { key: "blacklist", type: "array", defaultValue: [], label: "Blacklist" },
  ]);

  const listeners = new Set();
  let storageListenerInstalled = false;
  let pendingLocalWriteSignature = null;

  function getBrowserApi() {
    return global.browser || global.chrome || null;
  }

  function getStorageArea() {
    const api = getBrowserApi();
    if (!api || !api.storage) return null;
    return api.storage.sync || api.storage.local || null;
  }

  function getStorageAreaName() {
    const api = getBrowserApi();
    if (!api || !api.storage) return "local";
    return api.storage.sync ? "sync" : "local";
  }

  function isBrowserPromiseApi() {
    return Boolean(global.browser && global.browser.storage && global.browser.storage.local);
  }

  function storageGet(key) {
    const storage = getStorageArea();
    if (!storage) return Promise.resolve(null);

    if (isBrowserPromiseApi()) {
      return storage.get(key);
    }

    return new Promise((resolve, reject) => {
      try {
        storage.get(key, (value) => {
          const api = getBrowserApi();
          const lastError = api && api.runtime && api.runtime.lastError;
          if (lastError) {
            reject(new Error(lastError.message));
            return;
          }
          resolve(value);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function storageSet(data) {
    const storage = getStorageArea();
    if (!storage) return Promise.resolve();

    if (isBrowserPromiseApi()) {
      return storage.set(data);
    }

    return new Promise((resolve, reject) => {
      try {
        storage.set(data, () => {
          const api = getBrowserApi();
          const lastError = api && api.runtime && api.runtime.lastError;
          if (lastError) {
            reject(new Error(lastError.message));
            return;
          }
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function normalizeStringList(value) {
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  function normalizeSettings(input) {
    const source = input && typeof input === "object" ? input : {};
    const settings = {
      ...DEFAULT_SETTINGS,
      whitelist: [...DEFAULT_SETTINGS.whitelist],
      blacklist: [...DEFAULT_SETTINGS.blacklist],
    };

    SETTING_DEFINITIONS.forEach((definition) => {
      const hasValue = Object.prototype.hasOwnProperty.call(source, definition.key);

      if (definition.type === "array") {
        settings[definition.key] = hasValue
          ? normalizeStringList(source[definition.key])
          : [...DEFAULT_SETTINGS[definition.key]];
        return;
      }

      if (definition.type === "boolean") {
        settings[definition.key] = hasValue
          ? Boolean(source[definition.key])
          : DEFAULT_SETTINGS[definition.key];
      }
    });

    return settings;
  }

  async function getSettings() {
    const result = await storageGet(STORAGE_KEY);
    return normalizeSettings(result && result[STORAGE_KEY]);
  }

  async function notifySettingsChanged(settings) {
    const merged = normalizeSettings(settings);

    listeners.forEach((callback) => {
      try {
        callback(merged);
      } catch (error) {
        console.error("YouTubeMinimalSettings listener failed", error);
      }
    });

    return merged;
  }

  async function setSettings(patch) {
    const current = await getSettings();
    const next = normalizeSettings({ ...current, ...(patch || {}) });

    if (getStorageArea()) {
      pendingLocalWriteSignature = JSON.stringify(next);
      await storageSet({ [STORAGE_KEY]: next });
    }

    await notifySettingsChanged(next);
    return next;
  }

  async function resetSettings() {
    return setSettings(DEFAULT_SETTINGS);
  }

  function onSettingsChanged(callback) {
    if (typeof callback !== "function") {
      return () => {};
    }

    listeners.add(callback);

    if (!storageListenerInstalled) {
      const api = getBrowserApi();
      const storage = api && api.storage;
      const expectedArea = getStorageAreaName();

      if (storage && storage.onChanged && typeof storage.onChanged.addListener === "function") {
        storage.onChanged.addListener((changes, areaName) => {
          if (areaName !== expectedArea || !changes[STORAGE_KEY]) return;
          const signature = JSON.stringify(normalizeSettings(changes[STORAGE_KEY].newValue));
          if (pendingLocalWriteSignature && signature === pendingLocalWriteSignature) {
            pendingLocalWriteSignature = null;
            return;
          }
          notifySettingsChanged(changes[STORAGE_KEY].newValue);
        });
      }

      storageListenerInstalled = true;
    }

    return () => {
      listeners.delete(callback);
    };
  }

  const api = {
    STORAGE_KEY,
    DEFAULT_SETTINGS,
    SETTING_DEFINITIONS,
    getBrowserApi,
    getSettings,
    setSettings,
    resetSettings,
    onSettingsChanged,
  };

  global.YouTubeMinimalSettings = api;
  global.YTMinimalSettings = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
